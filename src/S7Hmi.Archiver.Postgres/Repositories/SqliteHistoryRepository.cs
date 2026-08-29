using Dapper;
using Microsoft.Data.Sqlite;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Models;

namespace S7Hmi.Archiver.Postgres.Repositories;

/// <summary>
/// Репозиторий хранения архивных данных в легковесной встраиваемой базе данных SQLite
/// </summary>
public class SqliteHistoryRepository : ITagHistoryRepository
{
    private readonly string _connectionString;
    private bool _initialized = false;
    private readonly object _initLock = new();

    public SqliteHistoryRepository(string connectionString = "Data Source=scada_history.db;Cache=Shared;")
    {
        _connectionString = connectionString;
        EnsureDatabaseInitialized();
    }

    private void EnsureDatabaseInitialized()
    {
        if (_initialized) return;

        lock (_initLock)
        {
            if (_initialized) return;

            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            var sql = @"
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;

            CREATE TABLE IF NOT EXISTS tag_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                value_numeric REAL,
                value_text TEXT,
                quality INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_tag_history_tag_time 
            ON tag_history (tag_id, timestamp);
            ";

            connection.Execute(sql);
            _initialized = true;
        }
    }

    public async Task<IReadOnlyList<TagHistoryPoint>> GetHistoryAsync(string tagId, DateTime fromUtc, DateTime toUtc, int limit = 5000)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        var sql = @"
        SELECT timestamp as TimestampStr, tag_id as TagId, value_numeric as ValueNumeric, value_text as ValueText, quality as Quality
        FROM tag_history
        WHERE tag_id = @TagId AND timestamp >= @FromUtcStr AND timestamp <= @ToUtcStr
        ORDER BY timestamp ASC
        LIMIT @Limit;";

        var fromStr = fromUtc.ToString("o");
        var toStr = toUtc.ToString("o");

        var rows = await connection.QueryAsync<dynamic>(sql, new
        {
            TagId = tagId,
            FromUtcStr = fromStr,
            ToUtcStr = toStr,
            Limit = limit
        });

        var result = new List<TagHistoryPoint>();
        foreach (var r in rows)
        {
            DateTime.TryParse((string)r.TimestampStr, out DateTime dt);
            double? numVal = r.ValueNumeric != null ? (double?)Convert.ToDouble(r.ValueNumeric) : null;
            string? textVal = r.ValueText != null ? (string)r.ValueText : null;
            TagQuality quality = (TagQuality)(int)r.Quality;

            result.Add(new TagHistoryPoint(dt, (string)r.TagId, numVal, textVal, quality));
        }

        return result;
    }

    public async Task AddBatchAsync(IReadOnlyList<TagValueUpdate> batch, CancellationToken cancellationToken = default)
    {
        if (batch.Count == 0) return;

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var transaction = connection.BeginTransaction();

        var sql = @"
        INSERT INTO tag_history (timestamp, tag_id, value_numeric, value_text, quality)
        VALUES (@Timestamp, @TagId, @ValueNumeric, @ValueText, @Quality);";

        var parameters = batch.Select(u =>
        {
            double? numVal = null;
            string? textVal = null;

            if (u.Value is bool b) numVal = b ? 1.0 : 0.0;
            else if (u.Value is double or float or int or short or long or byte or uint or ushort) numVal = Convert.ToDouble(u.Value);
            else textVal = u.Value?.ToString();

            return new
            {
                Timestamp = u.Timestamp.ToString("o"),
                TagId = u.TagId,
                ValueNumeric = numVal,
                ValueText = textVal,
                Quality = (int)u.Quality
            };
        });

        await connection.ExecuteAsync(sql, parameters, transaction);
        await transaction.CommitAsync(cancellationToken);
    }
}
