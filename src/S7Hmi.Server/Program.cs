using S7Hmi.Archiver.Postgres.Repositories;
using S7Hmi.Archiver.Postgres.Services;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;
using S7Hmi.Core.Services;
using S7Hmi.Driver.S7;
using S7Hmi.Driver.S7.Simulators;
using S7Hmi.Server.Data;
using S7Hmi.Server.Endpoints;
using S7Hmi.Server.Hubs;
using S7Hmi.Server.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// 1. Настройка структурированного логирования Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// 2. CORS для взаимодействия с Web-HMI клиентами
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 3. Регистрация ядра, драйвера ПЛК и хранилищ
var plcConfig = builder.Configuration.GetSection("PlcConnection").Get<PlcConnectionConfig>() ?? new PlcConnectionConfig();
var pgConnectionString = builder.Configuration.GetConnectionString("Postgres") ?? "Host=localhost;Database=s7_scada;Username=postgres;Password=postgres";
bool useSimulator = builder.Configuration.GetValue<bool>("UseSimulator", true);

var defaultArchiveIntervalMs = builder.Configuration.GetValue<int>("ArchiverSettings:DefaultIntervalMs", 1000);
var tagRegistry = new TagRegistry { DefaultArchiveIntervalMs = defaultArchiveIntervalMs };

builder.Services.AddSingleton(plcConfig);
builder.Services.AddSingleton<ITagRegistry>(tagRegistry);
builder.Services.AddSingleton<ITagDataCache, TagDataCache>();
builder.Services.AddSingleton<IArchiverQueue, ChannelArchiverQueue>();
builder.Services.AddSingleton<IAlarmEngine, AlarmEngine>();

if (useSimulator)
{
    Log.Information("Using Built-in Software Simulator Driver for S7-1500.");
    builder.Services.AddSingleton<IPlcDriver, SimulatedPlcDriver>();
}
else
{
    Log.Information("Using Hardware S7netplus Driver for PLC at {Ip}:{Port}", plcConfig.IpAddress, plcConfig.Port);
    builder.Services.AddSingleton<IPlcDriver, S7NetPlcDriver>();
}

var archiverMode = builder.Configuration.GetValue<string>("ArchiverMode", "Sqlite");
var sqliteConnectionString = builder.Configuration.GetConnectionString("Sqlite") ?? "Data Source=scada_history.db;Cache=Shared;";

if (string.Equals(archiverMode, "Postgres", StringComparison.OrdinalIgnoreCase))
{
    Log.Information("Using PostgreSQL / TimescaleDB Archiver at {ConnectionString}", pgConnectionString);
    builder.Services.AddSingleton<ITagHistoryRepository>(new TagHistoryRepository(pgConnectionString));
    builder.Services.AddHostedService(sp => new PostgresBatchArchiverService(
        sp.GetRequiredService<IArchiverQueue>(),
        pgConnectionString,
        sp.GetRequiredService<ILogger<PostgresBatchArchiverService>>()
    ));
}
else if (string.Equals(archiverMode, "Sqlite", StringComparison.OrdinalIgnoreCase))
{
    Log.Information("Using Embedded SQLite Database Archiver (scada_history.db).");
    var sqliteRepo = new SqliteHistoryRepository(sqliteConnectionString);
    builder.Services.AddSingleton<ITagHistoryRepository>(sqliteRepo);
    builder.Services.AddSingleton(sqliteRepo);
    builder.Services.AddHostedService(sp => new SqliteBatchArchiverService(
        sp.GetRequiredService<IArchiverQueue>(),
        sqliteRepo,
        sp.GetRequiredService<ILogger<SqliteBatchArchiverService>>()
    ));
}
else
{
    Log.Information("Using In-Memory Mock Archiver (Zero-Dependency check mode).");
    var inMemoryRepo = new InMemoryHistoryRepository();
    builder.Services.AddSingleton<ITagHistoryRepository>(inMemoryRepo);
    builder.Services.AddSingleton(inMemoryRepo);
    builder.Services.AddHostedService<InMemoryArchiverService>();
}

// 4. Регистрация фоновой службы опроса ПЛК
builder.Services.AddHostedService<PlcPollingWorker>();

// 5. SignalR & Web API
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseCors();
app.MapHub<HmiHub>("/hmihub");

// 6. Подключение модульных эндпоинтов
app.MapRootEndpoints();
app.MapPlcEndpoints();
app.MapTagEndpoints();
app.MapAlarmEndpoints();
app.MapOpennessEndpoints();

// 7. Инициализация демонстрационных тегов, аварий и истории точек
DataSeeder.SeedSampleData(
    app.Services.GetRequiredService<ITagRegistry>(),
    app.Services.GetRequiredService<IAlarmEngine>(),
    app.Services.GetService<ITagHistoryRepository>()
);

Log.Information("S7 Industrial HMI Server ready. Listening on http://localhost:5000");

app.Run();
