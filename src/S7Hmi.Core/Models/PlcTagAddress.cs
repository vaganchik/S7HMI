using System.Text.RegularExpressions;
using S7Hmi.Core.Enums;

namespace S7Hmi.Core.Models;

/// <summary>
/// Адрес переменной в памяти контроллера Siemens
/// Поддерживает форматы: DB1.DBD0, DB10.DBX4.0, DB2.DBW12, M0.0, MW10, MD20, IW0, QW0, Q0.1
/// </summary>
public partial class PlcTagAddress
{
    public S7MemoryArea Area { get; set; } = S7MemoryArea.DB;
    public int DbNumber { get; set; } = 1;
    public int StartByte { get; set; } = 0;
    public int BitNumber { get; set; } = 0; // 0..7
    public S7DataType DataType { get; set; } = S7DataType.Real;
    public int StringLength { get; set; } = 254; // Максимальная длина строки S7

    public int GetByteSize()
    {
        return DataType switch
        {
            S7DataType.Bool => 1,
            S7DataType.Byte or S7DataType.Char => 1,
            S7DataType.Word or S7DataType.Int or S7DataType.UInt => 2,
            S7DataType.DWord or S7DataType.DInt or S7DataType.UDInt or S7DataType.Real or S7DataType.Time => 4,
            S7DataType.LInt or S7DataType.LReal or S7DataType.DateAndTime => 8,
            S7DataType.String => 2 + StringLength,
            _ => 2
        };
    }

    /// <summary>
    /// Парсит строковое представление адреса Siemens в структурированный объект
    /// </summary>
    public static PlcTagAddress Parse(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Address cannot be empty", nameof(address));

        var clean = address.Trim().ToUpperInvariant();

        // 1. DataBlock addresses: DB1.DBX0.0, DB10.DBD4, DB5.DBW10, DB2.DBB0, DB1.STRING(20, 4)
        var dbRegex = new Regex(@"^DB(\d+)\.(DBX|DBB|DBW|DBD|STRING|DT)?(\d+)(?:\.(\d+))?$", RegexOptions.IgnoreCase);
        var dbMatch = dbRegex.Match(clean);
        if (dbMatch.Success)
        {
            int dbNum = int.Parse(dbMatch.Groups[1].Value);
            string typePrefix = dbMatch.Groups[2].Value;
            int startByte = int.Parse(dbMatch.Groups[3].Value);
            int bitNum = dbMatch.Groups[4].Success ? int.Parse(dbMatch.Groups[4].Value) : 0;

            S7DataType dType = typePrefix switch
            {
                "DBX" => S7DataType.Bool,
                "DBB" => S7DataType.Byte,
                "DBW" => S7DataType.Int,
                "DBD" => S7DataType.Real, // Default to Real for DBD, can be overridden
                "STRING" => S7DataType.String,
                "DT" => S7DataType.DateAndTime,
                _ => S7DataType.Real
            };

            return new PlcTagAddress
            {
                Area = S7MemoryArea.DB,
                DbNumber = dbNum,
                StartByte = startByte,
                BitNumber = bitNum,
                DataType = dType
            };
        }

        // 2. Flags / Merkers: M0.0, MB10, MW20, MD30
        var mRegex = new Regex(@"^M([BWDX])?(\d+)(?:\.(\d+))?$", RegexOptions.IgnoreCase);
        var mMatch = mRegex.Match(clean);
        if (mMatch.Success)
        {
            string modifier = mMatch.Groups[1].Value;
            int startByte = int.Parse(mMatch.Groups[2].Value);
            int bitNum = mMatch.Groups[3].Success ? int.Parse(mMatch.Groups[3].Value) : 0;

            S7DataType dType = modifier switch
            {
                "B" => S7DataType.Byte,
                "W" => S7DataType.Word,
                "D" => S7DataType.DWord,
                _ => S7DataType.Bool
            };

            return new PlcTagAddress
            {
                Area = S7MemoryArea.Flags,
                DbNumber = 0,
                StartByte = startByte,
                BitNumber = bitNum,
                DataType = dType
            };
        }

        // 3. Inputs: I0.0, IB10, IW20, ID30
        var iRegex = new Regex(@"^I([BWDX])?(\d+)(?:\.(\d+))?$", RegexOptions.IgnoreCase);
        var iMatch = iRegex.Match(clean);
        if (iMatch.Success)
        {
            string modifier = iMatch.Groups[1].Value;
            int startByte = int.Parse(iMatch.Groups[2].Value);
            int bitNum = iMatch.Groups[3].Success ? int.Parse(iMatch.Groups[3].Value) : 0;

            S7DataType dType = modifier switch
            {
                "B" => S7DataType.Byte,
                "W" => S7DataType.Word,
                "D" => S7DataType.DWord,
                _ => S7DataType.Bool
            };

            return new PlcTagAddress
            {
                Area = S7MemoryArea.Inputs,
                DbNumber = 0,
                StartByte = startByte,
                BitNumber = bitNum,
                DataType = dType
            };
        }

        // 4. Outputs: Q0.0, QB10, QW20, QD30
        var qRegex = new Regex(@"^Q([BWDX])?(\d+)(?:\.(\d+))?$", RegexOptions.IgnoreCase);
        var qMatch = qRegex.Match(clean);
        if (qMatch.Success)
        {
            string modifier = qMatch.Groups[1].Value;
            int startByte = int.Parse(qMatch.Groups[2].Value);
            int bitNum = qMatch.Groups[3].Success ? int.Parse(qMatch.Groups[3].Value) : 0;

            S7DataType dType = modifier switch
            {
                "B" => S7DataType.Byte,
                "W" => S7DataType.Word,
                "D" => S7DataType.DWord,
                _ => S7DataType.Bool
            };

            return new PlcTagAddress
            {
                Area = S7MemoryArea.Outputs,
                DbNumber = 0,
                StartByte = startByte,
                BitNumber = bitNum,
                DataType = dType
            };
        }

        throw new FormatException($"Unsupported S7 address format: '{address}'");
    }

    public override string ToString()
    {
        return Area switch
        {
            S7MemoryArea.DB => DataType == S7DataType.Bool
                ? $"DB{DbNumber}.DBX{StartByte}.{BitNumber}"
                : $"DB{DbNumber}.{GetPrefix()}{StartByte}",
            S7MemoryArea.Flags => DataType == S7DataType.Bool
                ? $"M{StartByte}.{BitNumber}"
                : $"M{GetPrefix()}{StartByte}",
            S7MemoryArea.Inputs => DataType == S7DataType.Bool
                ? $"I{StartByte}.{BitNumber}"
                : $"I{GetPrefix()}{StartByte}",
            S7MemoryArea.Outputs => DataType == S7DataType.Bool
                ? $"Q{StartByte}.{BitNumber}"
                : $"Q{GetPrefix()}{StartByte}",
            _ => $"DB{DbNumber}.{StartByte}"
        };
    }

    private string GetPrefix() => DataType switch
    {
        S7DataType.Byte or S7DataType.Char => "B",
        S7DataType.Word or S7DataType.Int or S7DataType.UInt => "W",
        S7DataType.DWord or S7DataType.DInt or S7DataType.UDInt or S7DataType.Real or S7DataType.Time => "D",
        S7DataType.LReal or S7DataType.LInt => "L",
        _ => "D"
    };
}
