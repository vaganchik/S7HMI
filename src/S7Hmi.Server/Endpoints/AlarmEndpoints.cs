using Microsoft.AspNetCore.Mvc;
using S7Hmi.Core.Services;
using S7Hmi.Server.Services;

namespace S7Hmi.Server.Endpoints;

public static class AlarmEndpoints
{
    private static readonly string[] OperatorRoles = ["operator", "technologist", "engineer", "admin"];

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
        group.MapPost("/{id:long}/ack", (
            long id,
            HttpContext httpContext,
            IAlarmEngine alarmEngine,
            IHmiSecurityService security) =>
        {
            if (!security.IsAuthorized(httpContext, OperatorRoles, out var userName, out var userRole))
            {
                security.LogAudit(userName, userRole, "ACK_ALARM_DENIED", id.ToString(), null, false, "Unauthorized role");
                return Results.Json(new { error = "Квитирование аварий требует авторизации оператора или выше." }, statusCode: 403);
            }

            bool ack = alarmEngine.AcknowledgeAlarm(id, userName);
            security.LogAudit(userName, userRole, "ACK_ALARM", id.ToString(), null, ack);

            return ack
                ? Results.Ok(new { status = "acknowledged", id, acknowledgedBy = userName })
                : Results.NotFound(new { error = "Alarm not found or already acknowledged" });
        });
    }
}
