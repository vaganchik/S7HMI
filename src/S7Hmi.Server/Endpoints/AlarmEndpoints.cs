using Microsoft.AspNetCore.Mvc;
using S7Hmi.Core.Services;

namespace S7Hmi.Server.Endpoints;

public static class AlarmEndpoints
{
    public static void MapAlarmEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/alarms");

        // Активные аварии
        group.MapGet("/active", (IAlarmEngine alarmEngine) =>
        {
            return Results.Ok(alarmEngine.GetActiveAlarms());
        });

        // Журнал истории аварий
        group.MapGet("/history", (IAlarmEngine alarmEngine, [FromQuery] int? limit) =>
        {
            return Results.Ok(alarmEngine.GetAlarmHistory(limit ?? 100));
        });

        // Список предыдущих инцидентов конкретной аварии
        group.MapGet("/{alarmId}/occurrences", (string alarmId, IAlarmEngine alarmEngine, [FromQuery] int? limit) =>
        {
            return Results.Ok(alarmEngine.GetAlarmOccurrences(alarmId, limit ?? 50));
        });

        // Квитирование оператором
        group.MapPost("/{id:long}/ack", (long id, IAlarmEngine alarmEngine) =>
        {
            bool ack = alarmEngine.AcknowledgeAlarm(id, "Operator-1");
            return ack
                ? Results.Ok(new { status = "acknowledged", id })
                : Results.NotFound(new { error = "Alarm not found or already acknowledged" });
        });
    }
}
