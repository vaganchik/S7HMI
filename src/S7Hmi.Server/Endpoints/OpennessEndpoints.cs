using S7Hmi.Core.Interfaces;
using S7Hmi.Server.Services;
using S7Hmi.TiaOpenness.Parsers;

namespace S7Hmi.Server.Endpoints;

public static class OpennessEndpoints
{
    private static readonly string[] ConfigRoles = ["engineer", "admin"];

    public static void MapOpennessEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/openness/import-db-xml", async (
            HttpRequest request,
            ITagRegistry registry,
            IHmiSecurityService security) =>
        {
            if (!security.IsAuthorized(request.HttpContext, ConfigRoles, out var userName, out var userRole))
            {
                security.LogAudit(userName, userRole, "IMPORT_TIA_DENIED", "openness", null, false, "Unauthorized role");
                return Results.Json(new { error = "Импорт TIA Openness XML требует роли наладчика или администратора." }, statusCode: 403);
            }

            using var reader = new StreamReader(request.Body);
            string xmlContent = await reader.ReadToEndAsync();

            try
            {
                var db = TiaXmlParser.ParseDataBlockXml(xmlContent);

                if (db.IsOptimized)
                {
                    security.LogAudit(userName, userRole, "IMPORT_TIA_REJECTED", $"DB{db.Number}", null, false, "Optimized DB not supported for classic S7 addressing");
                    return Results.BadRequest(new
                    {
                        error = $"Блок данных DB {db.Number} '{db.Name}' имеет включенный атрибут 'Optimized block access'. " +
                                "Классический протокол Siemens S7 (ISO-on-TCP) не поддерживает динамическое вычисление смещений. " +
                                "Отключите 'Optimized block access' в свойствах блока данных в TIA Portal и повторите экспорт."
                    });
                }

                var tags = TiaXmlParser.ConvertToPlcTags(db);
                registry.RegisterTags(tags);
                security.LogAudit(userName, userRole, "IMPORT_TIA_SUCCESS", $"DB{db.Number}", new { count = tags.Count }, true);

                return Results.Ok(new
                {
                    message = $"Успешно импортирован DB {db.Number} '{db.Name}' ({tags.Count} тегов)",
                    dbNumber = db.Number,
                    dbName = db.Name,
                    isOptimized = db.IsOptimized,
                    tagCount = tags.Count,
                    tags
                });
            }
            catch (Exception ex)
            {
                security.LogAudit(userName, userRole, "IMPORT_TIA_ERROR", "openness", null, false, ex.Message);
                return Results.BadRequest(new { error = ex.Message });
            }
        });
    }
}
