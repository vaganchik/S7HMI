using Microsoft.AspNetCore.Mvc;
using S7Hmi.Archiver.Postgres.Repositories;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;
using S7Hmi.Core.Services;
using S7Hmi.Server.Services;

namespace S7Hmi.Server.Endpoints;

public static class TagEndpoints
{
    private static readonly string[] OperatorWriteRoles = ["operator", "technologist", "engineer", "admin"];
    private static readonly string[] EngineerConfigRoles = ["engineer", "admin"];

    public static void MapTagEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tags");

        // Список всех тегов
        group.MapGet("/", (ITagRegistry registry) =>
        {
            return Results.Ok(registry.GetAllTags());
        });

        // Оперативные значения всех тегов
        group.MapGet("/values", (ITagDataCache cache) =>
        {
            return Results.Ok(cache.GetAllValues());
        });

        // История тега для графиков
        group.MapGet("/{id}/history", async (
            string id,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int? limit,
            ITagHistoryRepository repo) =>
        {
            var fromUtc = from ?? DateTime.UtcNow.AddHours(-1);
            var toUtc = to ?? DateTime.UtcNow;
            var maxLimit = Math.Clamp(limit ?? 1000, 1, 10000);

            var history = await repo.GetHistoryAsync(id, fromUtc, toUtc, maxLimit);
            return Results.Ok(history);
        });

        // Запись значения тега в ПЛК (Fail-Closed конвейер + RBAC)
        group.MapPost("/{id}/write", async (
            string id,
            [FromBody] object rawValue,
            HttpContext httpContext,
            ITagRegistry registry,
            IPlcDriver driver,
            IHmiSecurityService security) =>
        {
            // 1. Проверка авторизации
            if (!security.IsAuthorized(httpContext, OperatorWriteRoles, out var userName, out var userRole))
            {
                security.LogAudit(userName, userRole, "WRITE_TAG_DENIED", id, rawValue, false, "Unauthorized or insufficient role");
                return Results.Json(new { error = "Действие требует авторизации с ролью оператора, технолога, наладчика или администратора." }, statusCode: 403);
            }

            var tag = registry.GetTag(id);
            if (tag == null)
            {
                security.LogAudit(userName, userRole, "WRITE_TAG_FAILED", id, rawValue, false, "Tag not found");
                return Results.NotFound(new { error = $"Тег '{id}' не найден в реестре." });
            }

            // 2. Валидация типа, ReadOnly, Min/Max и Interlock (ADR-004)
            var (valid, parsedValue, validationError) = TagValueParser.TryParseAndValidate(rawValue, tag);
            if (!valid || parsedValue == null)
            {
                security.LogAudit(userName, userRole, "WRITE_TAG_REJECTED", id, rawValue, false, validationError);
                return Results.BadRequest(new { error = validationError });
            }

            // 3. Отправка в драйвер ПЛК
            try
            {
                bool success = await driver.WriteTagAsync(tag, parsedValue);
                security.LogAudit(userName, userRole, "WRITE_TAG_EXECUTED", id, parsedValue, success, success ? "OK" : "Driver write failed");

                return success
                    ? Results.Ok(new { status = "success", id, value = parsedValue, timestamp = DateTime.UtcNow })
                    : Results.Problem("Ошибка записи в контроллер ПЛК.");
            }
            catch (Exception ex)
            {
                security.LogAudit(userName, userRole, "WRITE_TAG_EXCEPTION", id, parsedValue, false, ex.Message);
                return Results.Problem($"Исключение при записи: {ex.Message}");
            }
        });

        // Настройка времени архивации индивидуального тега
        group.MapPut("/{id}/archive", (
            string id,
            [FromBody] TagArchiveConfigRequest request,
            HttpContext httpContext,
            ITagRegistry registry,
            IHmiSecurityService security) =>
        {
            if (!security.IsAuthorized(httpContext, EngineerConfigRoles, out var userName, out var userRole))
            {
                return Results.Json(new { error = "Требуются права наладчика или администратора." }, statusCode: 403);
            }

            var tag = registry.GetTag(id);
            if (tag == null) return Results.NotFound(new { error = $"Tag '{id}' not found" });

            bool updated = registry.UpdateTagArchiveConfig(id, request.ArchiveEnabled, request.ArchiveIntervalMs, request.Deadband);
            security.LogAudit(userName, userRole, "UPDATE_TAG_ARCHIVE", id, request, updated);
            return updated ? Results.Ok(tag) : Results.BadRequest();
        });

        // Глобальные настройки архивации
        var archiverGroup = app.MapGroup("/api/archiver");

        archiverGroup.MapGet("/settings", (ITagRegistry registry, IConfiguration config) =>
        {
            var mode = config.GetValue<string>("ArchiverMode", "Sqlite");
            return Results.Ok(new
            {
                defaultIntervalMs = registry.DefaultArchiveIntervalMs,
                archiverMode = mode
            });
        });

        archiverGroup.MapPost("/settings", (
            [FromBody] GlobalArchiverSettingsRequest request,
            HttpContext httpContext,
            ITagRegistry registry,
            IHmiSecurityService security) =>
        {
            if (!security.IsAuthorized(httpContext, EngineerConfigRoles, out var userName, out var userRole))
            {
                return Results.Json(new { error = "Требуются права наладчика или администратора." }, statusCode: 403);
            }

            if (request.DefaultIntervalMs > 0)
            {
                registry.SetGlobalArchiveInterval(request.DefaultIntervalMs);
            }

            security.LogAudit(userName, userRole, "UPDATE_GLOBAL_ARCHIVE", "all", request, true);
            return Results.Ok(new
            {
                defaultIntervalMs = registry.DefaultArchiveIntervalMs,
                status = "updated"
            });
        });
    }
}

public record TagArchiveConfigRequest(bool? ArchiveEnabled, int? ArchiveIntervalMs, double? Deadband);
public record GlobalArchiverSettingsRequest(int DefaultIntervalMs);
