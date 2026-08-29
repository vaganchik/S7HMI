using System.Diagnostics;
using S7Net = global::S7.Net;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;
using S7Hmi.Driver.S7.Batching;
using S7Hmi.Driver.S7.Converters;

namespace S7Hmi.Driver.S7;

/// <summary>
/// Промышленный драйвер связи с Siemens S7 ПЛК на базе S7netplus
/// </summary>
public class S7NetPlcDriver : IPlcDriver
{
    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly BatchRangeReader _batchReader;
    private S7Net.Plc? _plc;
    private bool _disposed;

    public PlcConnectionConfig Config { get; }
    public bool IsConnected => _plc is { IsConnected: true };
    public double LastRoundTripTimeMs { get; private set; }

    public S7NetPlcDriver(PlcConnectionConfig config)
    {
        Config = config ?? throw new ArgumentNullException(nameof(config));
        _batchReader = new BatchRangeReader(config.MaxBatchSizeBytes);
    }

    public async Task<bool> ConnectAsync(CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_plc is { IsConnected: true })
            {
                return true;
            }

            _plc?.Close();

            var cpuType = MapCpuType(Config.CpuType);
            _plc = new S7Net.Plc(cpuType, Config.IpAddress, (short)Config.Port, (short)Config.Rack, (short)Config.Slot);
            _plc.ReadTimeout = Config.TimeoutMs;
            _plc.WriteTimeout = Config.TimeoutMs;

            var sw = Stopwatch.StartNew();
            await _plc.OpenAsync(cancellationToken);
            sw.Stop();
            LastRoundTripTimeMs = sw.Elapsed.TotalMilliseconds;

            return _plc.IsConnected;
        }
        catch
        {
            _plc?.Close();
            return false;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_plc != null)
            {
                _plc.Close();
                _plc = null;
            }
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<byte[]> ReadBytesAsync(PlcTagAddress address, int length, CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            EnsureConnected();
            var sw = Stopwatch.StartNew();
            var s7DataType = MapMemoryArea(address.Area);
            var buffer = await _plc!.ReadBytesAsync(s7DataType, address.DbNumber, address.StartByte, length, cancellationToken);
            sw.Stop();
            LastRoundTripTimeMs = sw.Elapsed.TotalMilliseconds;
            return buffer;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IDictionary<string, TagValue>> ReadTagsAsync(IEnumerable<PlcTagDefinition> tags, CancellationToken cancellationToken = default)
    {
        var tagList = tags.ToList();
        var result = new Dictionary<string, TagValue>(tagList.Count, StringComparer.OrdinalIgnoreCase);
        if (tagList.Count == 0) return result;

        var timestamp = DateTime.UtcNow;

        if (!IsConnected)
        {
            foreach (var t in tagList)
            {
                result[t.Id] = new TagValue
                {
                    TagId = t.Id,
                    Quality = TagQuality.Offline,
                    Timestamp = timestamp,
                    ErrorMessage = "PLC not connected"
                };
            }
            return result;
        }

        await _lock.WaitAsync(cancellationToken);
        try
        {
            EnsureConnected();
            var chunks = _batchReader.CreateOptimizedChunks(tagList);
            var totalSw = Stopwatch.StartNew();

            foreach (var chunk in chunks)
            {
                try
                {
                    var s7DataType = MapMemoryArea(chunk.Area);
                    var buffer = await _plc!.ReadBytesAsync(s7DataType, chunk.DbNumber, chunk.StartByte, chunk.Length, cancellationToken);
                    BatchRangeReader.ExtractTagValuesFromBuffer(chunk, buffer, timestamp, result);
                }
                catch (Exception ex)
                {
                    foreach (var tag in chunk.Tags)
                    {
                        result[tag.Id] = new TagValue
                        {
                            TagId = tag.Id,
                            Quality = TagQuality.Bad,
                            Timestamp = timestamp,
                            ErrorMessage = ex.Message
                        };
                    }
                }
            }

            totalSw.Stop();
            LastRoundTripTimeMs = totalSw.Elapsed.TotalMilliseconds;
            return result;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> WriteTagAsync(PlcTagDefinition tag, object value, CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            EnsureConnected();
            var addr = tag.Address;
            var s7DataType = MapMemoryArea(addr.Area);

            if (addr.DataType == S7DataType.Bool)
            {
                bool boolVal = Convert.ToBoolean(value);
                await _plc!.WriteBitAsync(s7DataType, addr.DbNumber, addr.StartByte, addr.BitNumber, boolVal, cancellationToken);
                return true;
            }

            var bytes = S7DataConverter.SerializeValue(value, addr.DataType, addr.BitNumber, addr.StringLength);
            await _plc!.WriteBytesAsync(s7DataType, addr.DbNumber, addr.StartByte, bytes, cancellationToken);
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> WriteBytesAsync(PlcTagAddress address, byte[] value, CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            EnsureConnected();
            var s7DataType = MapMemoryArea(address.Area);
            await _plc!.WriteBytesAsync(s7DataType, address.DbNumber, address.StartByte, value, cancellationToken);
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }

    private void EnsureConnected()
    {
        if (_plc == null || !_plc.IsConnected)
        {
            throw new InvalidOperationException($"PLC '{Config.Name}' ({Config.IpAddress}) is not connected");
        }
    }

    private static S7Net.CpuType MapCpuType(S7CpuType cpuType) => cpuType switch
    {
        S7CpuType.S7200 => S7Net.CpuType.S7200,
        S7CpuType.S7300 => S7Net.CpuType.S7300,
        S7CpuType.S7400 => S7Net.CpuType.S7400,
        S7CpuType.S71200 => S7Net.CpuType.S71200,
        S7CpuType.S71500 => S7Net.CpuType.S71500,
        S7CpuType.Logo0BA8 => S7Net.CpuType.Logo0BA8,
        _ => S7Net.CpuType.S71200
    };

    private static S7Net.DataType MapMemoryArea(S7MemoryArea area) => area switch
    {
        S7MemoryArea.DB => S7Net.DataType.DataBlock,
        S7MemoryArea.Inputs => S7Net.DataType.Input,
        S7MemoryArea.Outputs => S7Net.DataType.Output,
        S7MemoryArea.Flags => S7Net.DataType.Memory,
        S7MemoryArea.Timers => S7Net.DataType.Timer,
        S7MemoryArea.Counters => S7Net.DataType.Counter,
        _ => S7Net.DataType.DataBlock
    };

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;
        await DisconnectAsync();
        _lock.Dispose();
        GC.SuppressFinalize(this);
    }
}
