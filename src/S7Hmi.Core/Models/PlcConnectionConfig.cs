using S7Hmi.Core.Enums;

namespace S7Hmi.Core.Models;

/// <summary>
/// Конфигурация подключения к ПЛК Siemens
/// </summary>
public class PlcConnectionConfig
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "PLC-1";
    public string IpAddress { get; set; } = "192.168.0.1";
    public int Port { get; set; } = 102;
    public int Rack { get; set; } = 0;
    public int Slot { get; set; } = 1; // S7-1200/1500 default: 1; S7-300 default: 2
    public S7CpuType CpuType { get; set; } = S7CpuType.S71200;
    public int PollingIntervalMs { get; set; } = 200;
    public int TimeoutMs { get; set; } = 2000;
    public int ReconnectIntervalMs { get; set; } = 5000;
    public int MaxBatchSizeBytes { get; set; } = 480; // S7-1200: 240-480, S7-1500: up to 960, S7-300: 222
    public bool Enabled { get; set; } = true;
}
