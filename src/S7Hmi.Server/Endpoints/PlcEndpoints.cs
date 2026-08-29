using S7Hmi.Core.Interfaces;

namespace S7Hmi.Server.Endpoints;

public static class PlcEndpoints
{
    public static void MapPlcEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/plc");

        group.MapGet("/status", (IPlcDriver driver) =>
        {
            return Results.Ok(new
            {
                driver.Config.Id,
                driver.Config.Name,
                driver.Config.IpAddress,
                driver.Config.Port,
                driver.Config.CpuType,
                driver.IsConnected,
                driver.LastRoundTripTimeMs,
                driverType = driver.GetType().Name
            });
        });
    }
}
