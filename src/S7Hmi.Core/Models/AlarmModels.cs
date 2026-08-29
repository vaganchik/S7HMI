using S7Hmi.Core.Enums;

namespace S7Hmi.Core.Models;

public enum AlarmCondition
{
    Equal,
    NotEqual,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual
}

/// <summary>
/// Определение уставки аварии (Alarm Rule)
/// </summary>
public class AlarmDefinition
{
    public string Id { get; set; } = string.Empty;
    public string TagId { get; set; } = string.Empty;
    public AlarmCondition Condition { get; set; } = AlarmCondition.GreaterThan;
    public double Setpoint { get; set; }
    public AlarmSeverity Severity { get; set; } = AlarmSeverity.Warning;
    public string Message { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}

/// <summary>
/// Событие срабатывания аварии в журнале
/// </summary>
public class AlarmEvent
{
    public long Id { get; set; }
    public string AlarmId { get; set; } = string.Empty;
    public string TagId { get; set; } = string.Empty;
    public AlarmSeverity Severity { get; set; }
    public AlarmState State { get; set; }
    public string Message { get; set; } = string.Empty;
    public double TriggerValue { get; set; }
    public double Setpoint { get; set; }
    public DateTime ActiveTimestamp { get; set; } = DateTime.UtcNow;
    public DateTime? AcknowledgedTimestamp { get; set; }
    public DateTime? ClearedTimestamp { get; set; }
    public string? AcknowledgedBy { get; set; }
}
