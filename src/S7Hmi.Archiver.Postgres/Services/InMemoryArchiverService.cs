using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using S7Hmi.Archiver.Postgres.Repositories;
using S7Hmi.Core.Interfaces;

namespace S7Hmi.Archiver.Postgres.Services;

/// <summary>
/// Фоновый сервис сохранения архивных точек в память (In-Memory Mock)
/// </summary>
public class InMemoryArchiverService : BackgroundService
{
    private readonly IArchiverQueue _queue;
    private readonly InMemoryHistoryRepository _repository;
    private readonly ILogger<InMemoryArchiverService> _logger;

    public InMemoryArchiverService(
        IArchiverQueue queue,
        InMemoryHistoryRepository repository,
        ILogger<InMemoryArchiverService> logger)
    {
        _queue = queue;
        _repository = repository;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("In-Memory Mock Archiver Service started.");

        await foreach (var batch in _queue.ReadBatchesAsync(500, TimeSpan.FromMilliseconds(500), stoppingToken))
        {
            if (batch.Count > 0)
            {
                _repository.AddPoints(batch);
            }
        }
    }
}
