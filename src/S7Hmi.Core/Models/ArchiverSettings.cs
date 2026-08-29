namespace S7Hmi.Core.Models;

/// <summary>
/// Глобальные настройки подсистемы архивации SCADA
/// </summary>
public class ArchiverSettings
{
    /// <summary>
    /// Интервал периодической архивации по умолчанию (в миллисекундах). По умолчанию 1000 мс.
    /// </summary>
    public int DefaultIntervalMs { get; set; } = 1000;

    /// <summary>
    /// Максимальный размер пакета для пакетной записи в БД
    /// </summary>
    public int BatchSize { get; set; } = 1000;

    /// <summary>
    /// Максимальное время ожидания накопления пакета перед принудительным сбросом (мс)
    /// </summary>
    public int BatchWaitMs { get; set; } = 500;
}
