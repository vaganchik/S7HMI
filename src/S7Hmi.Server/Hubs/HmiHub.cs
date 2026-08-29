using Microsoft.AspNetCore.SignalR;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;
using S7Hmi.Core.Services;
using S7Hmi.Server.Services;

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
    private static readonly string[] OperatorRoles = ["operator", "technologist", "engineer", "admin"];

    private readonly ITagDataCache _cache;
    private readonly ITagRegistry _registry;
    private readonly IPlcDriver _driver;
    private readonly IAlarmEngine _alarmEngine;
    private readonly IHmiSecurityService _security;

    public HmiHub(
        ITagDataCache cache,
        ITagRegistry registry,
        IPlcDriver driver,
        IAlarmEngine alarmEngine,
        IHmiSecurityService security)
    {
        _cache = cache;
        _registry = registry;
        _driver = driver;
        _alarmEngine = alarmEngine;
        _security = security;
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
    /// <param name="userRole">Роль пользователя</param>
    public async Task<bool> AcknowledgeAlarm(long eventId, string userName, string? userRole = "operator")
    {
        if (!_security.IsAuthorized(userRole, OperatorRoles))
        {
            _security.LogAudit(userName, userRole ?? "none", "ACK_ALARM_DENIED", eventId.ToString(), null, false, "Unauthorized role");
            return false;
        }

        bool result = _alarmEngine.AcknowledgeAlarm(eventId, userName);
        _security.LogAudit(userName, userRole ?? "operator", "ACK_ALARM", eventId.ToString(), null, result);
        return result;
    }

    /// <summary>
    /// Запись значения переменной в ПЛК через WebSockets с проверкой типа и прав доступа
    /// </summary>
    /// <param name="tagId">Идентификатор тега</param>
    /// <param name="rawValue">Записываемое значение</param>
    /// <param name="userRole">Роль оператора</param>
    /// <param name="userName">Имя оператора</param>
    public async Task<bool> WriteTagValue(string tagId, object rawValue, string? userRole = "operator", string? userName = "operator")
    {
        // 1. Проверка роли
        if (!_security.IsAuthorized(userRole, OperatorRoles))
        {
            _security.LogAudit(userName ?? "unknown", userRole ?? "none", "WRITE_TAG_DENIED", tagId, rawValue, false, "Unauthorized role");
            return false;
        }

        var tag = _registry.GetTag(tagId);
        if (tag == null)
        {
            _security.LogAudit(userName ?? "unknown", userRole ?? "none", "WRITE_TAG_FAILED", tagId, rawValue, false, "Tag not found");
            return false;
        }

        // 2. Валидация типа и ограничений
        var (valid, parsedValue, error) = TagValueParser.TryParseAndValidate(rawValue, tag);
        if (!valid || parsedValue == null)
        {
            _security.LogAudit(userName ?? "unknown", userRole ?? "none", "WRITE_TAG_REJECTED", tagId, rawValue, false, error);
            return false;
        }

        // 3. Запись в ПЛК
        try
        {
            bool success = await _driver.WriteTagAsync(tag, parsedValue);
            _security.LogAudit(userName ?? "unknown", userRole ?? "operator", "WRITE_TAG_SIGNALR", tagId, parsedValue, success);
            return success;
        }
        catch (Exception ex)
        {
            _security.LogAudit(userName ?? "unknown", userRole ?? "operator", "WRITE_TAG_EXCEPTION", tagId, parsedValue, false, ex.Message);
            return false;
        }
    }
}
