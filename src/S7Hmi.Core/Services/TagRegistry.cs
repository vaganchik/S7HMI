using System.Collections.Concurrent;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;

namespace S7Hmi.Core.Services;

/// <summary>
/// Потокобезопасная реализация реестра определений тегов в оперативной памяти с поддержкой настраиваемой архивации
/// </summary>
public class TagRegistry : ITagRegistry
{
    private readonly ConcurrentDictionary<string, PlcTagDefinition> _tags = new(StringComparer.OrdinalIgnoreCase);

    public int DefaultArchiveIntervalMs { get; set; } = 1000;

    /// <summary>
    /// Регистрирует новый тег или обновляет существующий
    /// </summary>
    /// <param name="tag">Определение тега</param>
    public void RegisterTag(PlcTagDefinition tag)
    {
        if (tag.ArchiveIntervalMs <= 0)
        {
            tag.ArchiveIntervalMs = DefaultArchiveIntervalMs;
        }
        _tags[tag.Id] = tag;
    }

    /// <summary>
    /// Массово регистрирует коллекцию тегов
    /// </summary>
    /// <param name="tags">Список тегов</param>
    public void RegisterTags(IEnumerable<PlcTagDefinition> tags)
    {
        foreach (var tag in tags)
        {
            RegisterTag(tag);
        }
    }

    /// <summary>
    /// Возвращает описание тега по его уникальному строковому ID
    /// </summary>
    /// <param name="tagId">Идентификатор тега (например, "furnace.zone1.temperature")</param>
    /// <returns>Определение тега или null, если тег не найден</returns>
    public PlcTagDefinition? GetTag(string tagId)
    {
        _tags.TryGetValue(tagId, out var tag);
        return tag;
    }

    /// <summary>
    /// Возвращает список всех зарегистрированных тегов системы
    /// </summary>
    public IReadOnlyList<PlcTagDefinition> GetAllTags()
    {
        return _tags.Values.ToList();
    }

    /// <summary>
    /// Возвращает список тегов, привязанных к конкретному контроллеру
    /// </summary>
    /// <param name="plcId">Идентификатор ПЛК</param>
    public IReadOnlyList<PlcTagDefinition> GetTagsByPlc(string plcId)
    {
        return _tags.Values.Where(t => string.Equals(t.PlcId, plcId, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    /// <summary>
    /// Обновляет параметры архивации для конкретного тега
    /// </summary>
    public bool UpdateTagArchiveConfig(string tagId, bool? archiveEnabled, int? archiveIntervalMs, double? deadband = null)
    {
        if (!_tags.TryGetValue(tagId, out var tag)) return false;

        if (archiveEnabled.HasValue) tag.ArchiveEnabled = archiveEnabled.Value;
        if (archiveIntervalMs.HasValue && archiveIntervalMs.Value > 0) tag.ArchiveIntervalMs = archiveIntervalMs.Value;
        if (deadband.HasValue && deadband.Value >= 0) tag.Deadband = deadband.Value;

        return true;
    }

    /// <summary>
    /// Устанавливает глобальный интервал архивации для всех тегов
    /// </summary>
    public void SetGlobalArchiveInterval(int intervalMs)
    {
        if (intervalMs <= 0) return;
        DefaultArchiveIntervalMs = intervalMs;

        foreach (var tag in _tags.Values)
        {
            tag.ArchiveIntervalMs = intervalMs;
        }
    }

    /// <summary>
    /// Очищает реестр тегов
    /// </summary>
    public void Clear()
    {
        _tags.Clear();
    }
}
