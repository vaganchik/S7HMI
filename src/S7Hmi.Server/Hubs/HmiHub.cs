using Microsoft.AspNetCore.SignalR;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;
using S7Hmi.Core.Services;

namespace S7Hmi.Server.Hubs;

/// <summary>
/// Интерфейс клиентских методов SignalR для Web-HMI
/// </summary>
public interface IHmiClient
{
    /// <summary>Одиночное обновление тега</summary>
    Task TagUpdated(TagValueUpdate update);

    /// <summary>Пакетное обновление группы тегов за такт опроса</summary>
    Task BatchTagsUpdated(IReadOnlyList<TagValueUpdate> updates);

    /// <summary>Изменение статуса связи с контроллером</summary>
    Task PlcStatusChanged(string plcId, bool isConnected, double rttMs);

    /// <summary>Событие тревоги или аварии (возникновение / квитирование / нормализация)</summary>
    Task AlarmChanged(AlarmEvent alarmEvent);
}

/// <summary>
/// Хаб SignalR для двунаправленной передачи телеметрии и команд управления в реальном времени
/// </summary>
public class HmiHub : Hub<IHmiClient>
{
    private readonly ITagDataCache _cache;
    private readonly ITagRegistry _registry;
    private readonly IPlcDriver _driver;
    private readonly IAlarmEngine _alarmEngine;

    public HmiHub(ITagDataCache cache, ITagRegistry registry, IPlcDriver driver, IAlarmEngine alarmEngine)
    {
        _cache = cache;
        _registry = registry;
        _driver = driver;
        _alarmEngine = alarmEngine;
    }

    /// <summary>
    /// Получение начального снимка всех значений тегов при подключении клиента
    /// </summary>
    public async Task<IReadOnlyDictionary<string, TagValue>> GetInitialValues()
    {
        return await Task.FromResult(_cache.GetAllValues());
    }

    /// <summary>
    /// Получение списка текущих активных аварий
    /// </summary>
    public async Task<IReadOnlyList<AlarmEvent>> GetActiveAlarms()
    {
        return await Task.FromResult(_alarmEngine.GetActiveAlarms());
    }

    /// <summary>
    /// Квитирование аварии оператором через WebSockets
    /// </summary>
    /// <param name="eventId">Идентификатор аварии</param>
    /// <param name="userName">Имя оператора</param>
    public async Task<bool> AcknowledgeAlarm(long eventId, string userName)
    {
        return await Task.FromResult(_alarmEngine.AcknowledgeAlarm(eventId, userName));
    }

    /// <summary>
    /// Запись значения переменной в ПЛК через WebSockets
    /// </summary>
    /// <param name="tagId">Идентификатор тега</param>
    /// <param name="value">Записываемое значение</param>
    public async Task<bool> WriteTagValue(string tagId, object value)
    {
        var tag = _registry.GetTag(tagId);
        if (tag == null || tag.ReadOnly)
        {
            return false;
        }

        return await _driver.WriteTagAsync(tag, value);
    }
}
