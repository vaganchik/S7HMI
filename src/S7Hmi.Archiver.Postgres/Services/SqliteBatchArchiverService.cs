using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using S7Hmi.Archiver.Postgres.Repositories;
using S7Hmi.Core.Interfaces;

namespace S7Hmi.Archiver.Postgres.Services;

/// <summary>
/// Фоновый сервис пакетного сохранения истории тегов в SQLite
/// </summary>
public class SqliteBatchArchiverService : BackgroundService
{
    private readonly IArchiverQueue _queue;
    private readonly SqliteHistoryRepository _repository;
    private readonly ILogger<SqliteBatchArchiverService> _logger;
    private readonly int _maxBatchSize;
    private readonly TimeSpan _maxWaitTime;

    public SqliteBatchArchiverService(
        IArchiverQueue queue,
        SqliteHistoryRepository repository,
        ILogger<SqliteBatchArchiverService> logger,
        int maxBatchSize = 1000,
        int maxWaitTimeMs = 500)
    {
        _queue = queue;
        _repository = repository;
        _logger = logger;
        _maxBatchSize = maxBatchSize;
        _maxWaitTime = TimeSpan.FromMilliseconds(maxWaitTimeMs);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SQLite Batch Archiver Service started (scada_history.db).");

        await foreach (var batch in _queue.ReadBatchesAsync(_maxBatchSize, _maxWaitTime, stoppingToken))
        {
            if (batch.Count == 0) continue;

            try
            {
                await _repository.AddBatchAsync(batch, stoppingToken);
                _logger.LogDebug("Archived {Count} points to SQLite", batch.Count);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Failed to write batch to SQLite");
            }
        }

        _logger.LogInformation("SQLite Batch Archiver Service stopped.");
    }
}
