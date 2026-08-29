using S7Hmi.Core.Interfaces;

namespace S7Hmi.Server.Endpoints;

public static class RootEndpoints
{
    public static void MapRootEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", (IPlcDriver driver, ITagRegistry registry, ITagDataCache cache) =>
        {
            var status = driver.IsConnected
                ? "<span style='color:#10b981;'>● ONLINE (СВЯЗЬ УСТАНОВЛЕНА)</span>"
                : "<span style='color:#ef4444;'>● OFFLINE</span>";
            var tags = registry.GetAllTags();
            var values = cache.GetAllValues();

            var html = $@"
<!DOCTYPE html>
<html lang='ru'>
<head>
    <meta charset='UTF-8'>
    <title>S7 Industrial Communication Server</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }}
        .container {{ max-width: 900px; margin: 0 auto; }}
        .card {{ background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }}
        h1 {{ margin-top: 0; color: #38bdf8; font-size: 1.5rem; }}
        h2 {{ font-size: 1.1rem; color: #94a3b8; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; margin-top: 0; }}
        .btn {{ display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: bold; margin-top: 0.5rem; }}
        .btn:hover {{ background: #1d4ed8; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; }}
        th, td {{ text-align: left; padding: 0.6rem; border-bottom: 1px solid #334155; font-family: monospace; }}
        th {{ color: #94a3b8; }}
        .badge {{ background: #334155; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }}
        a {{ color: #38bdf8; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
        ul {{ line-height: 1.8; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='card'>
            <h1>🚀 S7 Industrial Communication Server (.NET 8/9 C#)</h1>
            <p>Высокопроизводительный сервер обмена данными с контроллерами Siemens S7-1200 / S7-1500 / S7-300.</p>
            <p><strong>Статус ПЛК:</strong> {status} &bull; <strong>Драйвер:</strong> {driver.GetType().Name} &bull; <strong>RTT:</strong> {driver.LastRoundTripTimeMs:F1} мс</p>
            <a href='http://localhost:3000' class='btn' target='_blank'>🖥️ Открыть Web-HMI Интерфейс (React) &rarr;</a>
        </div>

        <div class='card'>
            <h2>🔌 Доступные API Эндпоинты</h2>
            <ul>
                <li><a href='/api/plc/status' target='_blank'>/api/plc/status</a> — Диагностика и статус связи с ПЛК</li>
                <li><a href='/api/tags' target='_blank'>/api/tags</a> — Реестр всех зарегистрированных тегов</li>
                <li><a href='/api/tags/values' target='_blank'>/api/tags/values</a> — Текущие оперативные значения тегов</li>
                <li><a href='/api/alarms/active' target='_blank'>/api/alarms/active</a> — Активные предупреждения и аварии</li>
                <li><a href='/api/alarms/history' target='_blank'>/api/alarms/history</a> — Журнал аварийных событий</li>
                <li><strong>/hmihub</strong> — SignalR WebSockets Hub реального времени</li>
            </ul>
        </div>

        <div class='card'>
            <h2>📊 Текущие значения тегов в памяти</h2>
            <table>
                <thead>
                    <tr><th>ID Тега</th><th>Адрес S7</th><th>Значение</th><th>Качество</th></tr>
                </thead>
                <tbody>
                    {string.Join("", tags.Select(t => {
                        values.TryGetValue(t.Id, out var val);
                        return $"<tr><td>{t.Id}</td><td>DB{t.Address.DbNumber}.{t.Address.StartByte}</td><td style='color:#38bdf8;font-weight:bold;'>{val?.Value ?? "---"}</td><td><span class='badge'>{val?.Quality}</span></td></tr>";
                    }))}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>";

            return Results.Content(html, "text/html; charset=utf-8");
        });
    }
}
