using System.Diagnostics;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;

namespace S7Hmi.Archiver.Postgres.Services;

/// <summary>
/// Фоновый сервис пакетной записи истории тегов в PostgreSQL с использованием бинарного импорта
/// Включает Circuit Breaker и буфер повторной отправки (Spooling) для исключения потери пакетов при сбое сети
/// </summary>
public class PostgresBatchArchiverService : BackgroundService
{
    private readonly IArchiverQueue _queue;
    private readonly string _connectionString;
    private readonly ILogger<PostgresBatchArchiverService> _logger;
    private readonly int _maxBatchSize;
    private readonly TimeSpan _maxWaitTime;

    private readonly List<TagValueUpdate> _retrySpool = [];
    private const int MaxSpoolCapacity = 50_000;

    private DateTime _nextRetryUtc = DateTime.MinValue;
    private bool _schemaInitialized = false;

    public PostgresBatchArchiverService(
        IArchiverQueue queue,
        string connectionString,
        ILogger<PostgresBatchArchiverService> logger,
        int maxBatchSize = 2000,
        int maxWaitTimeMs = 500)
    {
        _queue = queue ?? throw new ArgumentNullException(nameof(queue));
        _connectionString = connectionString;
        _logger = logger;
        _maxBatchSize = maxBatchSize;
        _maxWaitTime = TimeSpan.FromMilliseconds(maxWaitTimeMs);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PostgresBatchArchiverService started with resilient spool buffer.");

        await foreach (var batch in _queue.ReadBatchesAsync(_maxBatchSize, _maxWaitTime, stoppingToken))
        {
            if (batch.Count == 0) continue;

            // Если СУБД на тайм-ауте ретрая, складываем пакет в spool-буфер без потери данных
            if (DateTime.UtcNow < _nextRetryUtc)
            {
                SpoolBatch(batch);
                continue;
            }

            // Объединяем накопленный spool-буфер с текущим пакетом
            IReadOnlyList<TagValueUpdate> toWrite;
            if (_retrySpool.Count > 0)
            {
                var combined = new List<TagValueUpdate>(_retrySpool.Count + batch.Count);
                combined.AddRange(_retrySpool);
                combined.AddRange(batch);
                toWrite = combined;
            }
            else
            {
                toWrite = batch;
            }

            bool success = await WriteBatchToDatabaseAsync(toWrite, stoppingToken);
            if (success)
            {
                _retrySpool.Clear();
            }
            else
            {
                // При ошибке сохраняем в spool-буфер
                SpoolBatch(batch);
            }
        }

        _logger.LogInformation("PostgresBatchArchiverService stopped.");
    }

    private void SpoolBatch(IReadOnlyList<TagValueUpdate> batch)
    {
        if (_retrySpool.Count + batch.Count > MaxSpoolCapacity)
        {
            int removeCount = (_retrySpool.Count + batch.Count) - MaxSpoolCapacity;
            if (removeCount < _retrySpool.Count)
            {
                _retrySpool.RemoveRange(0, removeCount);
            }
            else
            {
                _retrySpool.Clear();
            }
        }
        _retrySpool.AddRange(batch);
    }

    private async Task<bool> WriteBatchToDatabaseAsync(IReadOnlyList<TagValueUpdate> batch, CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            if (!_schemaInitialized)
            {
                await PostgresSchemaInitializer.InitializeAsync(_connectionString, cancellationToken);
                _schemaInitialized = true;
                _logger.LogInformation("PostgreSQL schema initialized successfully.");
            }

            await using var writer = await connection.BeginBinaryImportAsync(
                "COPY tag_history (timestamp, tag_id, value_numeric, value_text, quality) FROM STDIN (FORMAT BINARY)",
                cancellationToken);

            foreach (var update in batch)
            {
                await writer.StartRowAsync(cancellationToken);
                await writer.WriteAsync(update.Timestamp, NpgsqlDbType.TimestampTz, cancellationToken);
                await writer.WriteAsync(update.TagId, NpgsqlDbType.Varchar, cancellationToken);

                double? numericVal = null;
                string? textVal = null;

                if (update.Value != null)
                {
                    if (update.Value is bool b)
                    {
                        numericVal = b ? 1.0 : 0.0;
                    }
                    else if (update.Value is double or float or int or short or long or byte or uint or ushort)
                    {
                        numericVal = Convert.ToDouble(update.Value);
                    }
                    else
                    {
                        textVal = update.Value.ToString();
                    }
                }

                if (numericVal.HasValue)
                {
                    await writer.WriteAsync(numericVal.Value, NpgsqlDbType.Double, cancellationToken);
                }
                else
                {
                    await writer.WriteNullAsync(cancellationToken);
                }

                if (textVal != null)
                {
                    await writer.WriteAsync(textVal, NpgsqlDbType.Text, cancellationToken);
                }
                else
                {
                    await writer.WriteNullAsync(cancellationToken);
                }

                await writer.WriteAsync((int)update.Quality, NpgsqlDbType.Integer, cancellationToken);
            }

            await writer.CompleteAsync(cancellationToken);
            sw.Stop();
            _logger.LogDebug("Archived {Count} tags to PostgreSQL in {ElapsedMs:F1} ms (Spool={SpoolCount})", batch.Count, sw.Elapsed.TotalMilliseconds, _retrySpool.Count);
            return true;
        }
        catch (Exception ex)
        {
            _nextRetryUtc = DateTime.UtcNow.AddSeconds(15);
            _logger.LogWarning("PostgreSQL is currently unreachable ({Msg}). Spooled {Count} items in memory buffer. Retrying in 15s...", ex.Message, _retrySpool.Count);
            return false;
        }
    }
}
