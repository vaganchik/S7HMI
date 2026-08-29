using S7Hmi.Core.Enums;

namespace S7Hmi.Core.Models;

/// <summary>
/// Описание тега в SCADA/HMI системе
/// </summary>
public class PlcTagDefinition
{
    public string Id { get; set; } = string.Empty; // Например: "furnace.zone1.temp"
    public string PlcId { get; set; } = "PLC-1";
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PlcTagAddress Address { get; set; } = new();
    public string EngineeringUnit { get; set; } = string.Empty; // °C, bar, rpm, %, kW
    public double? MinValue { get; set; }
    public double? MaxValue { get; set; }
    public double Deadband { get; set; } = 0.0; // Порог изменения для архивации/рассылки
    public TagCategory Category
    {
        get
        {
            if (_category.HasValue) return _category.Value;
            return Address.DataType == S7DataType.Bool ? TagCategory.Discrete : TagCategory.Analog;
        }
        set => _category = value;
    }
    private TagCategory? _category;

    public bool ArchiveEnabled { get; set; } = true;
    public int ArchiveIntervalMs { get; set; } = 1000;
    public bool ReadOnly { get; set; } = false;
}
