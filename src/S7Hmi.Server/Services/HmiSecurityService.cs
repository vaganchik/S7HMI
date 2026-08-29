using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace S7Hmi.Server.Services;

public interface IHmiSecurityService
{
    bool IsAuthorized(HttpContext context, string[] allowedRoles, out string userName, out string userRole);
    bool IsAuthorized(string? role, string[] allowedRoles);
    void LogAudit(string user, string role, string action, string target, object? value, bool success, string? details = null);
}

public class HmiSecurityService : IHmiSecurityService
{
    private readonly ILogger<HmiSecurityService> _logger;

    public HmiSecurityService(ILogger<HmiSecurityService> logger)
    {
        _logger = logger;
    }

    public bool IsAuthorized(HttpContext context, string[] allowedRoles, out string userName, out string userRole)
    {
        userName = context.Request.Headers["X-User-Name"].FirstOrDefault() ?? "anonymous";
        userRole = context.Request.Headers["X-User-Role"].FirstOrDefault()?.ToLowerInvariant() ?? "none";

        if (string.IsNullOrWhiteSpace(userRole) || userRole == "none")
        {
            return false;
        }

        return allowedRoles.Contains(userRole, StringComparer.OrdinalIgnoreCase);
    }

    public bool IsAuthorized(string? role, string[] allowedRoles)
    {
        if (string.IsNullOrWhiteSpace(role)) return false;
        return allowedRoles.Contains(role.Trim().ToLowerInvariant(), StringComparer.OrdinalIgnoreCase);
    }

    public void LogAudit(string user, string role, string action, string target, object? value, bool success, string? details = null)
    {
        _logger.LogInformation(
            "[AUDIT] Timestamp={Timestamp:u} User={User} Role={Role} Action={Action} Target={Target} Value={Value} Success={Success} Details={Details}",
            DateTime.UtcNow, user, role, action, target, value, success, details ?? "OK");
    }
}
