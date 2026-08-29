using S7Hmi.Core.Models;

namespace S7Hmi.Core.Interfaces;

/// <summary>
/// Абстрактный интерфейс промышленного драйвера ПЛК
/// </summary>
public interface IPlcDriver : IAsyncDisposable
{
    PlcConnectionConfig Config { get; }
    bool IsConnected { get; }
    double LastRoundTripTimeMs { get; }

    Task<bool> ConnectAsync(CancellationToken cancellationToken = default);
    Task DisconnectAsync(CancellationToken cancellationToken = default);

    Task<byte[]> ReadBytesAsync(PlcTagAddress address, int length, CancellationToken cancellationToken = default);
    Task<IDictionary<string, TagValue>> ReadTagsAsync(IEnumerable<PlcTagDefinition> tags, CancellationToken cancellationToken = default);
    Task<bool> WriteTagAsync(PlcTagDefinition tag, object value, CancellationToken cancellationToken = default);
    Task<bool> WriteBytesAsync(PlcTagAddress address, byte[] value, CancellationToken cancellationToken = default);
}
