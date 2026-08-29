using S7Hmi.Core.Enums;

namespace S7Hmi.Core.Models;

/// <summary>
/// Текущее состояние и значение тега в памяти SCADA
/// </summary>
public class TagValue
{
    public string TagId { get; set; } = string.Empty;
    public object? Value { get; set; }
    public byte[]? RawBytes { get; set; }
    public TagQuality Quality { get; set; } = TagQuality.Offline;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? ErrorMessage { get; set; }

    public double? AsDouble()
    {
        if (Value == null) return null;
        if (Value is bool b) return b ? 1.0 : 0.0;
        try
        {
            return Convert.ToDouble(Value);
        }
        catch
        {
            return null;
        }
    }

    public bool? AsBool()
    {
        if (Value is bool b) return b;
        if (Value is int i) return i != 0;
        if (Value is double d) return d > 0.5;
        return null;
    }
}

/// <summary>
/// Легковесная структура для передачи изменения тега через SignalR и очередь БД
/// </summary>
public record TagValueUpdate(
    string TagId,
    object? Value,
    TagQuality Quality,
    DateTime Timestamp
);
