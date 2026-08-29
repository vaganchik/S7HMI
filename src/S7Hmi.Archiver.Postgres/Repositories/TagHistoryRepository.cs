using Dapper;
using Npgsql;
using S7Hmi.Core.Enums;

namespace S7Hmi.Archiver.Postgres.Repositories;

/// <summary>
/// Точка истории временного ряда значения тега
/// </summary>
public record TagHistoryPoint(
    DateTime Timestamp,
    string TagId,
    double? ValueNumeric,
    string? ValueText,
    TagQuality Quality
);

/// <summary>
/// Репозиторий доступа к архивным историческим данным PostgreSQL
/// </summary>
public interface ITagHistoryRepository
{
    /// <summary>
    /// Получает историю значений тега за указанный диапазон времени UTC
    /// </summary>
    /// <param name="tagId">Идентификатор тега</param>
    /// <param name="fromUtc">Начало диапазона UTC</param>
    /// <param name="toUtc">Конец диапазона UTC</param>
    /// <param name="limit">Максимальное число возвращаемых точек</param>
    Task<IReadOnlyList<TagHistoryPoint>> GetHistoryAsync(string tagId, DateTime fromUtc, DateTime toUtc, int limit = 5000);
}

/// <summary>
/// Реализация репозитория доступа к истории тегов через Dapper и Npgsql
/// </summary>
public class TagHistoryRepository : ITagHistoryRepository
{
    private readonly string _connectionString;

    public TagHistoryRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<IReadOnlyList<TagHistoryPoint>> GetHistoryAsync(string tagId, DateTime fromUtc, DateTime toUtc, int limit = 5000)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"
        SELECT timestamp, tag_id as TagId, value_numeric as ValueNumeric, value_text as ValueText, quality as Quality
        FROM tag_history
        WHERE tag_id = @TagId AND timestamp >= @FromUtc AND timestamp <= @ToUtc
        ORDER BY timestamp ASC
        LIMIT @Limit;";

        var rows = await connection.QueryAsync<TagHistoryPoint>(sql, new { TagId = tagId, FromUtc = fromUtc, ToUtc = toUtc, Limit = limit });
        return rows.ToList();
    }
}
