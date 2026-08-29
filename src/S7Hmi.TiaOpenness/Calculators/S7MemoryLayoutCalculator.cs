using System.Text.RegularExpressions;
using S7Hmi.Core.Enums;
using S7Hmi.TiaOpenness.Models;

namespace S7Hmi.TiaOpenness.Calculators;

/// <summary>
/// Калькулятор смещений в стандартных (Non-Optimized) блоках данных Siemens S7
/// Реализует правила выравнивания памяти Step 7 / TIA Portal
/// </summary>
public static class S7MemoryLayoutCalculator
{
    public static S7DataType ParseDataType(string rawType, out int stringLength, out int arrayLength)
    {
        stringLength = 254;
        arrayLength = 1;

        if (string.IsNullOrWhiteSpace(rawType))
            return S7DataType.Word;

        var clean = rawType.Trim();

        // Check for String[N]
        var strMatch = Regex.Match(clean, @"^String(?:\[(\d+)\])?$", RegexOptions.IgnoreCase);
        if (strMatch.Success)
        {
            if (strMatch.Groups[1].Success)
            {
                stringLength = int.Parse(strMatch.Groups[1].Value);
            }
            return S7DataType.String;
        }

        return clean.ToUpperInvariant() switch
        {
            "BOOL" => S7DataType.Bool,
            "BYTE" or "USINT" or "SINT" => S7DataType.Byte,
            "CHAR" => S7DataType.Char,
            "WORD" => S7DataType.Word,
            "DWORD" => S7DataType.DWord,
            "INT" => S7DataType.Int,
            "UINT" => S7DataType.UInt,
            "DINT" => S7DataType.DInt,
            "UDINT" => S7DataType.UDInt,
            "LINT" => S7DataType.LInt,
            "REAL" => S7DataType.Real,
            "LREAL" => S7DataType.LReal,
            "TIME" => S7DataType.Time,
            "DATE_AND_TIME" or "DT" => S7DataType.DateAndTime,
            "WSTRING" => S7DataType.WString,
            _ => S7DataType.Word
        };
    }

    /// <summary>
    /// Вычисляет и расставляет байтовые и битовые смещения для списка переменных DB
    /// </summary>
    public static void CalculateOffsets(IList<TiaDbVariable> variables)
    {
        int currentByte = 0;
        int currentBit = 0;
        bool inBoolRun = false;

        foreach (var v in variables)
        {
            var s7Type = ParseDataType(v.RawDataType, out int strLen, out _);
            v.S7DataType = s7Type;

            if (s7Type == S7DataType.Bool)
            {
                if (!inBoolRun)
                {
                    inBoolRun = true;
                    currentBit = 0;
                }
                else if (currentBit >= 8)
                {
                    currentByte++;
                    currentBit = 0;
                }

                v.ByteOffset = currentByte;
                v.BitOffset = currentBit;
                v.ByteSize = 1;
                currentBit++;
            }
            else
            {
                if (inBoolRun)
                {
                    currentByte++;
                    currentBit = 0;
                    inBoolRun = false;
                }

                // Выравнивание по границе 2 байт (Word alignment) для типов > 1 байта
                int alignment = GetTypeAlignment(s7Type);
                if (alignment > 1 && (currentByte % alignment != 0))
                {
                    currentByte += alignment - (currentByte % alignment);
                }

                v.ByteOffset = currentByte;
                v.BitOffset = 0;
                int size = GetTypeSize(s7Type, strLen);
                v.ByteSize = size;
                currentByte += size;
            }
        }
    }

    public static int GetTypeAlignment(S7DataType type) => type switch
    {
        S7DataType.Bool => 1,
        S7DataType.Byte or S7DataType.Char => 1,
        S7DataType.Word or S7DataType.Int or S7DataType.UInt => 2,
        S7DataType.DWord or S7DataType.DInt or S7DataType.UDInt or S7DataType.Real or S7DataType.Time => 2, // Siemens S7 standard DB uses 2-byte alignment
        S7DataType.LReal or S7DataType.LInt or S7DataType.DateAndTime => 2,
        S7DataType.String or S7DataType.WString => 2,
        _ => 2
    };

    public static int GetTypeSize(S7DataType type, int stringLength = 254) => type switch
    {
        S7DataType.Bool => 1,
        S7DataType.Byte or S7DataType.Char => 1,
        S7DataType.Word or S7DataType.Int or S7DataType.UInt => 2,
        S7DataType.DWord or S7DataType.DInt or S7DataType.UDInt or S7DataType.Real or S7DataType.Time => 4,
        S7DataType.LReal or S7DataType.LInt or S7DataType.DateAndTime => 8,
        S7DataType.String => 2 + stringLength,
        _ => 2
    };
}
