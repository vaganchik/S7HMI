using System.Collections.Concurrent;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Models;

namespace S7Hmi.Archiver.Postgres.Repositories;

/// <summary>
/// Автономный In-Memory репозиторий архивации (для работы без PostgreSQL / режим проверки и тестирования)
/// </summary>
public class InMemoryHistoryRepository : ITagHistoryRepository
{
    private readonly ConcurrentDictionary<string, ConcurrentQueue<TagHistoryPoint>> _storage = new(StringComparer.OrdinalIgnoreCase);
    private const int MaxPointsPerTag = 10000;

    public void AddPoints(IEnumerable<TagValueUpdate> updates)
    {
        foreach (var u in updates)
        {
            var queue = _storage.GetOrAdd(u.TagId, _ => new ConcurrentQueue<TagHistoryPoint>());
            double? numVal = null;
            string? textVal = null;

            if (u.Value is bool b) numVal = b ? 1.0 : 0.0;
            else if (u.Value is double or float or int or short or long) numVal = Convert.ToDouble(u.Value);
            else textVal = u.Value?.ToString();

            queue.Enqueue(new TagHistoryPoint(u.Timestamp, u.TagId, numVal, textVal, u.Quality));

            // Ограничение кольцевого буфера
            while (queue.Count > MaxPointsPerTag && queue.TryDequeue(out _)) { }
        }
    }

    public Task<IReadOnlyList<TagHistoryPoint>> GetHistoryAsync(string tagId, DateTime fromUtc, DateTime toUtc, int limit = 5000)
    {
        if (_storage.TryGetValue(tagId, out var queue))
        {
            var points = queue
                .Where(p => p.Timestamp >= fromUtc && p.Timestamp <= toUtc)
                .OrderByDescending(p => p.Timestamp)
                .Take(limit)
                .Reverse()
                .ToList();

            if (points.Count > 0)
            {
                return Task.FromResult<IReadOnlyList<TagHistoryPoint>>(points);
            }
        }

        // Если точек нет — генерируем плавную синтетическую историю для демонстрации/проверки
        var generated = GenerateSyntheticHistory(tagId, fromUtc, toUtc, Math.Min(limit, 300));
        return Task.FromResult<IReadOnlyList<TagHistoryPoint>>(generated);
    }

    private static List<TagHistoryPoint> GenerateSyntheticHistory(string tagId, DateTime fromUtc, DateTime toUtc, int count)
    {
        var list = new List<TagHistoryPoint>();
        var span = (toUtc - fromUtc).TotalSeconds;
        var stepSec = Math.Max(1.0, span / count);

        for (int i = 0; i < count; i++)
        {
            var t = fromUtc.AddSeconds(i * stepSec);
            double baseVal = tagId.Contains("temp") ? 240.0 :
                             tagId.Contains("pressure") ? -2600.0 :
                             tagId.Contains("current") ? 14.5 :
                             tagId.Contains("speed") ? 1.43 :
                             tagId.Contains("density") ? 96.0 : 50.0;

            double noise = Math.Sin(i * 0.1) * (baseVal * 0.05);
            list.Add(new TagHistoryPoint(t, tagId, baseVal + noise, null, TagQuality.Good));
        }

        return list;
    }
}
