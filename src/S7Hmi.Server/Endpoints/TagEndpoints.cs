using Microsoft.AspNetCore.Mvc;
using S7Hmi.Archiver.Postgres.Repositories;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;

namespace S7Hmi.Server.Endpoints;

public static class TagEndpoints
{
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

        // Запись значения тега в ПЛК
        group.MapPost("/{id}/write", async (
            string id,
            [FromBody] object value,
            ITagRegistry registry,
            IPlcDriver driver) =>
        {
            var tag = registry.GetTag(id);
            if (tag == null) return Results.NotFound(new { error = $"Tag '{id}' not found" });
            if (tag.ReadOnly) return Results.BadRequest(new { error = $"Tag '{id}' is read-only" });

            bool success = await driver.WriteTagAsync(tag, value);
            return success ? Results.Ok(new { status = "success", id, value }) : Results.Problem("Failed to write to PLC");
        });

        // Настройка времени архивации индивидуального тега
        group.MapPut("/{id}/archive", (
            string id,
            [FromBody] TagArchiveConfigRequest request,
            ITagRegistry registry) =>
        {
            var tag = registry.GetTag(id);
            if (tag == null) return Results.NotFound(new { error = $"Tag '{id}' not found" });

            bool updated = registry.UpdateTagArchiveConfig(id, request.ArchiveEnabled, request.ArchiveIntervalMs, request.Deadband);
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
            ITagRegistry registry) =>
        {
            if (request.DefaultIntervalMs > 0)
            {
                registry.SetGlobalArchiveInterval(request.DefaultIntervalMs);
            }

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
