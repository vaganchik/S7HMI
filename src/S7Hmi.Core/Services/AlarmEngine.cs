using System.Collections.Concurrent;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Models;

namespace S7Hmi.Core.Services;

/// <summary>
/// Интерфейс подсистемы контроля аварий и тревог (Alarm Engine)
/// </summary>
public interface IAlarmEngine
{
    /// <summary>
    /// Регистрация аварийной уставки
    /// </summary>
    void RegisterAlarm(AlarmDefinition alarm);

    /// <summary>
    /// Массовая регистрация уставок
    /// </summary>
    void RegisterAlarms(IEnumerable<AlarmDefinition> alarms);

    /// <summary>
    /// Получение списка всех сконфигурированных аварийных правил
    /// </summary>
    IReadOnlyList<AlarmDefinition> GetAlarmDefinitions();

    /// <summary>
    /// Получение списка текущих активных аварий
    /// </summary>
    IReadOnlyList<AlarmEvent> GetActiveAlarms();

    /// <summary>
    /// Получение журнала истории аварийных событий
    /// </summary>
    IReadOnlyList<AlarmEvent> GetAlarmHistory(int limit = 100);

    /// <summary>
    /// Получение списка всех предыдущих инцидентов конкретной аварии с датой/временем срабатывания и квитирования
    /// </summary>
    /// <param name="alarmId">Идентификатор аварии</param>
    /// <param name="limit">Максимальное число записей</param>
    IReadOnlyList<AlarmEvent> GetAlarmOccurrences(string alarmId, int limit = 50);

    /// <summary>
    /// Квитирование аварии оператором
    /// </summary>
    /// <param name="eventId">Идентификатор события аварии</param>
    /// <param name="userName">Имя оператора</param>
    bool AcknowledgeAlarm(long eventId, string userName);

    /// <summary>
    /// Оценка значений тегов на срабатывание аварийных условий
    /// </summary>
    /// <param name="updates">Список обновленных значений тегов</param>
    void Evaluate(IReadOnlyList<TagValueUpdate> updates);

    /// <summary>
    /// Событие изменения состояния аварии (возникновение, квитирование, нормализация)
    /// </summary>
    event Action<AlarmEvent>? OnAlarmChanged;
}

/// <summary>
/// Реализация подсистемы контроля аварий и тревог
/// </summary>
public class AlarmEngine : IAlarmEngine
{
    private readonly ConcurrentDictionary<string, AlarmDefinition> _definitions = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, AlarmEvent> _activeAlarms = new(StringComparer.OrdinalIgnoreCase);
    private readonly List<AlarmEvent> _history = [];
    private readonly object _lock = new();
    private long _eventIdCounter = 1;

    public event Action<AlarmEvent>? OnAlarmChanged;

    public void RegisterAlarm(AlarmDefinition alarm)
    {
        _definitions[alarm.Id] = alarm;
    }

    public void RegisterAlarms(IEnumerable<AlarmDefinition> alarms)
    {
        foreach (var a in alarms)
        {
            _definitions[a.Id] = a;
        }
    }

    public IReadOnlyList<AlarmDefinition> GetAlarmDefinitions() => _definitions.Values.ToList();

    public IReadOnlyList<AlarmEvent> GetActiveAlarms() => _activeAlarms.Values.ToList();

    public IReadOnlyList<AlarmEvent> GetAlarmHistory(int limit = 100)
    {
        lock (_lock)
        {
            return _history.TakeLast(limit).Reverse().ToList();
        }
    }

    public IReadOnlyList<AlarmEvent> GetAlarmOccurrences(string alarmId, int limit = 50)
    {
        lock (_lock)
        {
            return _history
                .Where(a => string.Equals(a.AlarmId, alarmId, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(a => a.ActiveTimestamp)
                .Take(limit)
                .ToList();
        }
    }

    public bool AcknowledgeAlarm(long eventId, string userName)
    {
        lock (_lock)
        {
            var active = _activeAlarms.Values.FirstOrDefault(a => a.Id == eventId);
            if (active != null && active.State == AlarmState.Active)
            {
                active.State = AlarmState.Acknowledged;
                active.AcknowledgedTimestamp = DateTime.UtcNow;
                active.AcknowledgedBy = userName;
                OnAlarmChanged?.Invoke(active);
                return true;
            }
        }
        return false;
    }

    public void Evaluate(IReadOnlyList<TagValueUpdate> updates)
    {
        foreach (var update in updates)
        {
            if (update.Value == null) continue;

            double? numericVal = null;
            if (update.Value is bool b) numericVal = b ? 1.0 : 0.0;
            else if (double.TryParse(update.Value.ToString(), out var d)) numericVal = d;

            if (!numericVal.HasValue) continue;

            var matchingAlarms = _definitions.Values.Where(a => a.Enabled && string.Equals(a.TagId, update.TagId, StringComparison.OrdinalIgnoreCase));

            foreach (var rule in matchingAlarms)
            {
                bool isTriggered = CheckCondition(numericVal.Value, rule.Condition, rule.Setpoint);

                lock (_lock)
                {
                    if (isTriggered)
                    {
                        if (!_activeAlarms.ContainsKey(rule.Id))
                        {
                            var evt = new AlarmEvent
                            {
                                Id = Interlocked.Increment(ref _eventIdCounter),
                                AlarmId = rule.Id,
                                TagId = rule.TagId,
                                Severity = rule.Severity,
                                State = AlarmState.Active,
                                Message = rule.Message,
                                TriggerValue = numericVal.Value,
                                Setpoint = rule.Setpoint,
                                ActiveTimestamp = DateTime.UtcNow
                            };
                            _activeAlarms[rule.Id] = evt;
                            _history.Add(evt);
                            OnAlarmChanged?.Invoke(evt);
                        }
                    }
                    else
                    {
                        if (_activeAlarms.TryRemove(rule.Id, out var active))
                        {
                            active.State = AlarmState.Cleared;
                            active.ClearedTimestamp = DateTime.UtcNow;
                            OnAlarmChanged?.Invoke(active);
                        }
                    }
                }
            }
        }
    }

    private static bool CheckCondition(double value, AlarmCondition condition, double setpoint) => condition switch
    {
        AlarmCondition.GreaterThan => value > setpoint,
        AlarmCondition.GreaterThanOrEqual => value >= setpoint,
        AlarmCondition.LessThan => value < setpoint,
        AlarmCondition.LessThanOrEqual => value <= setpoint,
        AlarmCondition.Equal => Math.Abs(value - setpoint) < 0.0001,
        AlarmCondition.NotEqual => Math.Abs(value - setpoint) >= 0.0001,
        _ => false
    };
}
