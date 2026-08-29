using S7Hmi.Core.Interfaces;
using S7Hmi.TiaOpenness.Parsers;

namespace S7Hmi.Server.Endpoints;

public static class OpennessEndpoints
{
    public static void MapOpennessEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/openness/import-db-xml", async (
            HttpRequest request,
            ITagRegistry registry) =>
        {
            using var reader = new StreamReader(request.Body);
            string xmlContent = await reader.ReadToEndAsync();

            try
            {
                var db = TiaXmlParser.ParseDataBlockXml(xmlContent);
                var tags = TiaXmlParser.ConvertToPlcTags(db);
                registry.RegisterTags(tags);

                return Results.Ok(new
                {
                    message = $"Successfully imported DB {db.Number} '{db.Name}' with {tags.Count} tags",
                    dbNumber = db.Number,
                    dbName = db.Name,
                    isOptimized = db.IsOptimized,
                    tagCount = tags.Count,
                    tags
                });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });
    }
}
