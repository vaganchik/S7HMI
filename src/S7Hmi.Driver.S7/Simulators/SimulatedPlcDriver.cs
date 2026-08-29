using System.Collections.Concurrent;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;
using S7Hmi.Driver.S7.Converters;

namespace S7Hmi.Driver.S7.Simulators;

/// <summary>
/// Программный симулятор ПЛК Siemens S7-1500 для автономного тестирования Web-HMI и архивации
/// Моделирует непрерывную физику техпроцесса (нагрев, давление, насосы, клапаны)
/// </summary>
public class SimulatedPlcDriver : IPlcDriver
{
    private readonly ConcurrentDictionary<string, object> _memory = new(StringComparer.OrdinalIgnoreCase);
    private bool _connected = false;
    private double _rttMs = 1.2;
    private readonly Random _random = new();

    public PlcConnectionConfig Config { get; }
    public bool IsConnected => _connected;
    public double LastRoundTripTimeMs => _rttMs;

    public SimulatedPlcDriver(PlcConnectionConfig config)
    {
        Config = config;
        InitDefaultProcessValues();
    }

    private void InitDefaultProcessValues()
    {
        _memory["furnace.zone1.temperature"] = 642.5f;
        _memory["furnace.zone1.pressure"] = 3.45f;
        _memory["furnace.pump.running"] = true;
        _memory["furnace.valve.open"] = true;
        _memory["furnace.cycle.count"] = 1420;
    }

    public Task<bool> ConnectAsync(CancellationToken cancellationToken = default)
    {
        _connected = true;
        _rttMs = 0.8 + _random.NextDouble() * 1.5;
        return Task.FromResult(true);
    }

    public Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        _connected = false;
        return Task.CompletedTask;
    }

    public Task<byte[]> ReadBytesAsync(PlcTagAddress address, int length, CancellationToken cancellationToken = default)
    {
        _rttMs = 0.5 + _random.NextDouble() * 1.0;
        var bytes = new byte[length];
        return Task.FromResult(bytes);
    }

    public Task<IDictionary<string, TagValue>> ReadTagsAsync(IEnumerable<PlcTagDefinition> tags, CancellationToken cancellationToken = default)
    {
        _rttMs = 0.8 + _random.NextDouble() * 1.2;
        var result = new Dictionary<string, TagValue>(StringComparer.OrdinalIgnoreCase);
        var timestamp = DateTime.UtcNow;

        // Симуляция динамики процесса
        SimulateProcessStep();

        foreach (var tag in tags)
        {
            if (_memory.TryGetValue(tag.Id, out var val))
            {
                result[tag.Id] = new TagValue
                {
                    TagId = tag.Id,
                    Value = val,
                    Quality = TagQuality.Good,
                    Timestamp = timestamp
                };
            }
            else
            {
                // Для новых тегов, импортированных из TIA Openness
                object simulatedVal = tag.Address.DataType switch
                {
                    S7DataType.Bool => _random.Next(2) == 1,
                    S7DataType.Real => (float)Math.Round(50.0 + _random.NextDouble() * 200.0, 2),
                    S7DataType.Int or S7DataType.DInt => _random.Next(10, 500),
                    S7DataType.String => "Batch-" + _random.Next(100, 999),
                    _ => 0
                };
                _memory[tag.Id] = simulatedVal;

                result[tag.Id] = new TagValue
                {
                    TagId = tag.Id,
                    Value = simulatedVal,
                    Quality = TagQuality.Good,
                    Timestamp = timestamp
                };
            }
        }

        return Task.FromResult<IDictionary<string, TagValue>>(result);
    }

    public Task<bool> WriteTagAsync(PlcTagDefinition tag, object value, CancellationToken cancellationToken = default)
    {
        _memory[tag.Id] = value;
        return Task.FromResult(true);
    }

    public Task<bool> WriteBytesAsync(PlcTagAddress address, byte[] value, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }

    private void SimulateProcessStep()
    {
        // 1. Температура печи
        if (_memory.TryGetValue("furnace.zone1.temperature", out var tempObj))
        {
            float temp = Convert.ToSingle(tempObj);
            bool pump = Convert.ToBoolean(_memory.GetValueOrDefault("furnace.pump.running", true));
            bool valve = Convert.ToBoolean(_memory.GetValueOrDefault("furnace.valve.open", true));

            // Физика: при включенном клапане греется, при насосе охлаждается
            float targetTemp = 650.0f;
            if (!valve) targetTemp = 300.0f;
            if (pump) targetTemp -= 40.0f;

            float delta = (targetTemp - temp) * 0.02f + (float)(_random.NextDouble() - 0.5) * 0.8f;
            _memory["furnace.zone1.temperature"] = (float)Math.Round(temp + delta, 1);
        }

        // 2. Давление в камере
        if (_memory.TryGetValue("furnace.zone1.pressure", out var pressObj))
        {
            float press = Convert.ToSingle(pressObj);
            float targetPress = Convert.ToBoolean(_memory.GetValueOrDefault("furnace.valve.open", true)) ? 3.5f : 1.0f;
            float deltaPress = (targetPress - press) * 0.05f + (float)(_random.NextDouble() - 0.5) * 0.05f;
            _memory["furnace.zone1.pressure"] = (float)Math.Round(Math.Max(0.5f, press + deltaPress), 2);
        }
    }

    public ValueTask DisposeAsync()
    {
        _connected = false;
        return ValueTask.CompletedTask;
    }
}
