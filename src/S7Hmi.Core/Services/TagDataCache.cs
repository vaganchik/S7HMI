using System.Collections.Concurrent;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;

namespace S7Hmi.Core.Services;

/// <summary>
/// Потокобезопасный оперативный кэш текущих значений тегов в памяти процесса
/// </summary>
public class TagDataCache : ITagDataCache
{
    private readonly ConcurrentDictionary<string, TagValue> _cache = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Событие обновления значений тегов (для подписки SignalR и архиватора)
    /// </summary>
    public event Action<IReadOnlyList<TagValueUpdate>>? OnTagsUpdated;

    /// <summary>
    /// Обновляет текущее значение одного тега
    /// </summary>
    /// <param name="tagId">Идентификатор тега</param>
    /// <param name="value">Новое значение с меткой времени и качеством</param>
    public void UpdateValue(string tagId, TagValue value)
    {
        _cache[tagId] = value;
        OnTagsUpdated?.Invoke([new TagValueUpdate(tagId, value.Value, value.Quality, value.Timestamp)]);
    }

    /// <summary>
    /// Массово обновляет значения коллекции тегов за один такт опроса
    /// </summary>
    /// <param name="values">Словарь обновленных значений</param>
    public void UpdateValues(IEnumerable<KeyValuePair<string, TagValue>> values)
    {
        var updates = new List<TagValueUpdate>();
        foreach (var (tagId, value) in values)
        {
            _cache[tagId] = value;
            updates.Add(new TagValueUpdate(tagId, value.Value, value.Quality, value.Timestamp));
        }

        if (updates.Count > 0)
        {
            OnTagsUpdated?.Invoke(updates);
        }
    }

    /// <summary>
    /// Получает текущее значение тега из памяти
    /// </summary>
    /// <param name="tagId">Идентификатор тега</param>
    /// <returns>Текущее значение или null</returns>
    public TagValue? GetValue(string tagId)
    {
        _cache.TryGetValue(tagId, out var val);
        return val;
    }

    /// <summary>
    /// Возвращает снапшот всех текущих значений тегов
    /// </summary>
    public IReadOnlyDictionary<string, TagValue> GetAllValues()
    {
        return _cache;
    }
}
