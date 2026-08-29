using System.Globalization;
using System.Text.Json;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Models;

namespace S7Hmi.Core.Services;

/// <summary>
/// Безопасный парсер и валидатор значений тегов для предотвращения некорректной записи в ПЛК
/// Реализует Fail-Closed конвейер валидации (ADR-004)
/// </summary>
public static class TagValueParser
{
    public static (bool Success, object? Value, string? Error) TryParseAndValidate(
        object? rawValue,
        PlcTagDefinition tag,
        bool globalWriteEnabled = true)
    {
        if (!globalWriteEnabled)
        {
            return (false, null, "Глобальная запись в ПЛК отключена (Safety Interlock).");
        }

        if (tag.ReadOnly)
        {
            return (false, null, $"Тег '{tag.Id}' настроен только для чтения (Read-Only).");
        }

        if (rawValue == null)
        {
            return (false, null, "Значение не может быть пустым (null).");
        }

        try
        {
            object parsed = ParseRawValue(rawValue, tag.Address.DataType);

            // Валидация Min/Max для числовых типов
            if (tag.MinValue.HasValue || tag.MaxValue.HasValue)
            {
                double numValue = parsed switch
                {
                    double d => d,
                    float f => f,
                    short s => s,
                    int i => i,
                    long l => l,
                    ushort us => us,
                    uint u => u,
                    byte b => b,
                    _ => double.NaN
                };

                if (!double.IsNaN(numValue))
                {
                    if (tag.MinValue.HasValue && numValue < tag.MinValue.Value)
                    {
                        return (false, null, $"Значение {numValue} меньше допустимого минимума ({tag.MinValue.Value}).");
                    }
                    if (tag.MaxValue.HasValue && numValue > tag.MaxValue.Value)
                    {
                        return (false, null, $"Значение {numValue} превышает допустимый максимум ({tag.MaxValue.Value}).");
                    }
                }
            }

            return (true, parsed, null);
        }
        catch (Exception ex)
        {
            return (false, null, $"Недопустимый формат для типа {tag.Address.DataType}: {ex.Message}");
        }
    }

    public static object ParseRawValue(object raw, S7DataType dataType)
    {
        if (raw is JsonElement elem)
        {
            return ParseJsonElement(elem, dataType);
        }

        return dataType switch
        {
            S7DataType.Bool => Convert.ToBoolean(raw, CultureInfo.InvariantCulture),
            S7DataType.Byte => Convert.ToByte(raw, CultureInfo.InvariantCulture),
            S7DataType.Char => Convert.ToChar(raw, CultureInfo.InvariantCulture),
            S7DataType.Int => Convert.ToInt16(raw, CultureInfo.InvariantCulture),
            S7DataType.UInt => Convert.ToUInt16(raw, CultureInfo.InvariantCulture),
            S7DataType.Word => Convert.ToUInt16(raw, CultureInfo.InvariantCulture),
            S7DataType.DInt => Convert.ToInt32(raw, CultureInfo.InvariantCulture),
            S7DataType.UDInt => Convert.ToUInt32(raw, CultureInfo.InvariantCulture),
            S7DataType.DWord => Convert.ToUInt32(raw, CultureInfo.InvariantCulture),
            S7DataType.LInt => Convert.ToInt64(raw, CultureInfo.InvariantCulture),
            S7DataType.Real => Convert.ToSingle(raw, CultureInfo.InvariantCulture),
            S7DataType.LReal => Convert.ToDouble(raw, CultureInfo.InvariantCulture),
            S7DataType.String => Convert.ToString(raw, CultureInfo.InvariantCulture) ?? string.Empty,
            _ => raw
        };
    }

    private static object ParseJsonElement(JsonElement elem, S7DataType dataType)
    {
        return dataType switch
        {
            S7DataType.Bool => elem.ValueKind switch
            {
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Number => elem.GetInt32() != 0,
                JsonValueKind.String => bool.TryParse(elem.GetString(), out var b) ? b : (elem.GetString() == "1"),
                _ => throw new FormatException($"Cannot convert JsonElement '{elem.ValueKind}' to boolean")
            },
            S7DataType.Byte => elem.ValueKind == JsonValueKind.Number ? elem.GetByte() : byte.Parse(elem.GetString()!, CultureInfo.InvariantCulture),
            S7DataType.Char => elem.ValueKind == JsonValueKind.String ? elem.GetString()![0] : (char)elem.GetByte(),
            S7DataType.Int => elem.ValueKind == JsonValueKind.Number ? elem.GetInt16() : short.Parse(elem.GetString()!, CultureInfo.InvariantCulture),
            S7DataType.UInt or S7DataType.Word => elem.ValueKind == JsonValueKind.Number ? elem.GetUInt16() : ushort.Parse(elem.GetString()!, CultureInfo.InvariantCulture),
            S7DataType.DInt => elem.ValueKind == JsonValueKind.Number ? elem.GetInt32() : int.Parse(elem.GetString()!, CultureInfo.InvariantCulture),
            S7DataType.UDInt or S7DataType.DWord => elem.ValueKind == JsonValueKind.Number ? elem.GetUInt32() : uint.Parse(elem.GetString()!, CultureInfo.InvariantCulture),
            S7DataType.LInt => elem.ValueKind == JsonValueKind.Number ? elem.GetInt64() : long.Parse(elem.GetString()!, CultureInfo.InvariantCulture),
            S7DataType.Real => elem.ValueKind == JsonValueKind.Number ? elem.GetSingle() : float.Parse(elem.GetString()!, CultureInfo.InvariantCulture),
            S7DataType.LReal => elem.ValueKind == JsonValueKind.Number ? elem.GetDouble() : double.Parse(elem.GetString()!, CultureInfo.InvariantCulture),
            S7DataType.String => elem.GetString() ?? string.Empty,
            _ => elem.ToString()
        };
    }
}
