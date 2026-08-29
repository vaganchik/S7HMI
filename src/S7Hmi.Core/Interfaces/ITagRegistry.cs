using S7Hmi.Core.Models;

namespace S7Hmi.Core.Interfaces;

/// <summary>
/// Реестр всех сконфигурированных тегов системы
/// </summary>
public interface ITagRegistry
{
    int DefaultArchiveIntervalMs { get; set; }
    void RegisterTag(PlcTagDefinition tag);
    void RegisterTags(IEnumerable<PlcTagDefinition> tags);
    PlcTagDefinition? GetTag(string tagId);
    IReadOnlyList<PlcTagDefinition> GetAllTags();
    IReadOnlyList<PlcTagDefinition> GetTagsByPlc(string plcId);
    bool UpdateTagArchiveConfig(string tagId, bool? archiveEnabled, int? archiveIntervalMs, double? deadband = null);
    void SetGlobalArchiveInterval(int intervalMs);
    void Clear();
}

/// <summary>
/// Потокобезопасный оперативный кэш текущих значений тегов в памяти
/// </summary>
public interface ITagDataCache
{
    void UpdateValue(string tagId, TagValue value);
    void UpdateValues(IEnumerable<KeyValuePair<string, TagValue>> values);
    TagValue? GetValue(string tagId);
    IReadOnlyDictionary<string, TagValue> GetAllValues();
    event Action<IReadOnlyList<TagValueUpdate>>? OnTagsUpdated;
}

/// <summary>
/// Интерфейс неблокирующей очереди архивации значений тегов в БД
/// </summary>
public interface IArchiverQueue
{
    ValueTask EnqueueAsync(TagValueUpdate update, CancellationToken cancellationToken = default);
    ValueTask EnqueueBatchAsync(IEnumerable<TagValueUpdate> updates, CancellationToken cancellationToken = default);
    IAsyncEnumerable<IReadOnlyList<TagValueUpdate>> ReadBatchesAsync(int maxBatchSize, TimeSpan maxWaitTime, CancellationToken cancellationToken = default);
}
