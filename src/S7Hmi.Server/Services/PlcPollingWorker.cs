using System.Diagnostics;
using Microsoft.AspNetCore.SignalR;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;
using S7Hmi.Core.Services;
using S7Hmi.Server.Hubs;

namespace S7Hmi.Server.Services;

/// <summary>
/// Фоновый воркер высокопроизводительного опроса ПЛК и обработки аварий
/// </summary>
public class PlcPollingWorker : BackgroundService
{
    private readonly IPlcDriver _driver;
    private readonly ITagRegistry _registry;
    private readonly ITagDataCache _cache;
    private readonly IArchiverQueue _archiverQueue;
    private readonly IAlarmEngine _alarmEngine;
    private readonly IHubContext<HmiHub, IHmiClient> _hubContext;
    private readonly ILogger<PlcPollingWorker> _logger;

    private readonly Dictionary<string, (object? Value, DateTime LastArchived)> _lastValues = new(StringComparer.OrdinalIgnoreCase);

    public PlcPollingWorker(
        IPlcDriver driver,
        ITagRegistry registry,
        ITagDataCache cache,
        IArchiverQueue archiverQueue,
        IAlarmEngine alarmEngine,
        IHubContext<HmiHub, IHmiClient> hubContext,
        ILogger<PlcPollingWorker> logger)
    {
        _driver = driver;
        _registry = registry;
        _cache = cache;
        _archiverQueue = archiverQueue;
        _alarmEngine = alarmEngine;
        _hubContext = hubContext;
        _logger = logger;

        _alarmEngine.OnAlarmChanged += async (alarmEvent) =>
        {
            try
            {
                await _hubContext.Clients.All.AlarmChanged(alarmEvent);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to broadcast alarm change via SignalR");
            }
        };
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var config = _driver.Config;
        _logger.LogInformation("Starting PLC Polling Worker for '{PlcName}' ({Ip}:{Port}). Interval: {Interval} ms",
            config.Name, config.IpAddress, config.Port, config.PollingIntervalMs);

        while (!stoppingToken.IsCancellationRequested)
        {
            if (!_driver.IsConnected)
            {
                _logger.LogInformation("Connecting to PLC '{PlcName}' at {Ip}:{Port}...", config.Name, config.IpAddress, config.Port);
                bool connected = await _driver.ConnectAsync(stoppingToken);
                await _hubContext.Clients.All.PlcStatusChanged(config.Id, connected, _driver.LastRoundTripTimeMs);

                if (!connected)
                {
                    _logger.LogWarning("Failed to connect to PLC '{PlcName}'. Retrying in {Interval} ms...", config.Name, config.ReconnectIntervalMs);
                    await Task.Delay(config.ReconnectIntervalMs, stoppingToken);
                    continue;
                }

                _logger.LogInformation("Successfully connected to PLC '{PlcName}'! RTT: {Rtt:F1} ms", config.Name, _driver.LastRoundTripTimeMs);
            }

            var cycleSw = Stopwatch.StartNew();

            try
            {
                var tags = _registry.GetTagsByPlc(config.Id);
                if (tags.Count > 0)
                {
                    var readResults = await _driver.ReadTagsAsync(tags, stoppingToken);
                    _cache.UpdateValues(readResults);

                    var allRawUpdates = new List<TagValueUpdate>(readResults.Count);
                    var updatesToBroadcast = new List<TagValueUpdate>();
                    var updatesToArchive = new List<TagValueUpdate>();
                    var now = DateTime.UtcNow;

                    foreach (var (tagId, tagValue) in readResults)
                    {
                        var update = new TagValueUpdate(tagId, tagValue.Value, tagValue.Quality, tagValue.Timestamp);
                        allRawUpdates.Add(update);

                        var tagDef = _registry.GetTag(tagId);
                        bool isChanged = false;

                        if (tagDef != null)
                        {
                            if (_lastValues.TryGetValue(tagId, out var prev))
                            {
                                if (tagDef.Category == S7Hmi.Core.Enums.TagCategory.Discrete)
                                {
                                    isChanged = !Equals(prev.Value, tagValue.Value);
                                }
                                else if (tagValue.Value is double or float or int or short or long && prev.Value is double or float or int or short or long)
                                {
                                    double d1 = Convert.ToDouble(tagValue.Value);
                                    double d0 = Convert.ToDouble(prev.Value);
                                    isChanged = Math.Abs(d1 - d0) >= Math.Max(0.0001, tagDef.Deadband);
                                }
                                else
                                {
                                    isChanged = !Equals(prev.Value, tagValue.Value);
                                }
                            }
                            else
                            {
                                isChanged = true;
                            }
                        }

                        if (isChanged)
                        {
                            updatesToBroadcast.Add(update);
                        }

                        // Логика архивации: COS для дискретных, Deadband + Таймер для аналоговых
                        if (tagDef != null && tagDef.ArchiveEnabled)
                        {
                            bool shouldArchive = isChanged;
                            if (!shouldArchive && tagDef.Category == S7Hmi.Core.Enums.TagCategory.Analog && _lastValues.TryGetValue(tagId, out var lastArchiveState))
                            {
                                if ((now - lastArchiveState.LastArchived).TotalMilliseconds >= tagDef.ArchiveIntervalMs)
                                {
                                    shouldArchive = true;
                                }
                            }

                            if (shouldArchive)
                            {
                                updatesToArchive.Add(update);
                                _lastValues[tagId] = (tagValue.Value, now);
                            }
                        }
                        else if (isChanged)
                        {
                            _lastValues[tagId] = (tagValue.Value, now);
                        }
                    }

                    // 1. Оценка аварийных условий по каждому качественному отсчету ДО фильтрации deadband (P1)
                    if (allRawUpdates.Count > 0)
                    {
                        _alarmEngine.Evaluate(allRawUpdates);
                    }

                    // 2. Рассылка изменений клиентам Web-HMI
                    if (updatesToBroadcast.Count > 0)
                    {
                        await _hubContext.Clients.All.BatchTagsUpdated(updatesToBroadcast);
                    }

                    // 3. Отправка в очередь архивации БД
                    if (updatesToArchive.Count > 0)
                    {
                        await _archiverQueue.EnqueueBatchAsync(updatesToArchive, stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during PLC polling cycle for '{PlcName}'", config.Name);
                await _hubContext.Clients.All.PlcStatusChanged(config.Id, false, 0);
            }

            cycleSw.Stop();
            int delay = Math.Max(0, config.PollingIntervalMs - (int)cycleSw.ElapsedMilliseconds);
            if (delay > 0)
            {
                await Task.Delay(delay, stoppingToken);
            }
        }
    }
}
