using System.Buffers.Binary;
using System.Text;
using S7Hmi.Core.Enums;

namespace S7Hmi.Driver.S7.Converters;

/// <summary>
/// Высокопроизводительный конвертер типов данных Siemens (Big-Endian)
/// </summary>
public static class S7DataConverter
{
    public static object? ExtractValue(ReadOnlySpan<byte> buffer, S7DataType dataType, int bitNumber = 0, int stringLength = 254)
    {
        if (buffer.IsEmpty) return null;

        return dataType switch
        {
            S7DataType.Bool => (buffer[0] & (1 << bitNumber)) != 0,
            S7DataType.Byte => buffer[0],
            S7DataType.Char => (char)buffer[0],
            S7DataType.Int => BinaryPrimitives.ReadInt16BigEndian(buffer),
            S7DataType.UInt => BinaryPrimitives.ReadUInt16BigEndian(buffer),
            S7DataType.Word => BinaryPrimitives.ReadUInt16BigEndian(buffer),
            S7DataType.DInt => BinaryPrimitives.ReadInt32BigEndian(buffer),
            S7DataType.UDInt => BinaryPrimitives.ReadUInt32BigEndian(buffer),
            S7DataType.DWord => BinaryPrimitives.ReadUInt32BigEndian(buffer),
            S7DataType.LInt => BinaryPrimitives.ReadInt64BigEndian(buffer),
            S7DataType.Real => BinaryPrimitives.ReadSingleBigEndian(buffer),
            S7DataType.LReal => BinaryPrimitives.ReadDoubleBigEndian(buffer),
            S7DataType.Time => TimeSpan.FromMilliseconds(BinaryPrimitives.ReadInt32BigEndian(buffer)),
            S7DataType.String => ReadS7String(buffer),
            S7DataType.DateAndTime => ReadDateAndTime(buffer),
            _ => null
        };
    }

    public static byte[] SerializeValue(object value, S7DataType dataType, int bitNumber = 0, int maxStringLength = 254)
    {
        return dataType switch
        {
            S7DataType.Bool => [ (byte)(Convert.ToBoolean(value) ? (1 << bitNumber) : 0) ],
            S7DataType.Byte => [ Convert.ToByte(value) ],
            S7DataType.Char => [ Convert.ToByte(Convert.ToChar(value)) ],
            S7DataType.Int => SerializeInt16(Convert.ToInt16(value)),
            S7DataType.UInt or S7DataType.Word => SerializeUInt16(Convert.ToUInt16(value)),
            S7DataType.DInt => SerializeInt32(Convert.ToInt32(value)),
            S7DataType.UDInt or S7DataType.DWord => SerializeUInt32(Convert.ToUInt32(value)),
            S7DataType.LInt => SerializeInt64(Convert.ToInt64(value)),
            S7DataType.Real => SerializeSingle(Convert.ToSingle(value)),
            S7DataType.LReal => SerializeDouble(Convert.ToDouble(value)),
            S7DataType.Time => SerializeInt32(value is TimeSpan ts ? (int)ts.TotalMilliseconds : Convert.ToInt32(value)),
            S7DataType.String => SerializeS7String(Convert.ToString(value) ?? string.Empty, maxStringLength),
            _ => throw new NotSupportedException($"Data type {dataType} serialization not supported")
        };
    }

    public static string ReadS7String(ReadOnlySpan<byte> buffer)
    {
        if (buffer.Length < 2) return string.Empty;
        int maxLen = buffer[0];
        int actLen = buffer[1];

        if (actLen <= 0 || buffer.Length < 2 + actLen) return string.Empty;

        return Encoding.ASCII.GetString(buffer.Slice(2, actLen));
    }

    public static byte[] SerializeS7String(string value, int maxLen = 254)
    {
        var chars = Encoding.ASCII.GetBytes(value);
        int actLen = Math.Min(chars.Length, maxLen);

        var result = new byte[2 + maxLen];
        result[0] = (byte)maxLen;
        result[1] = (byte)actLen;
        Array.Copy(chars, 0, result, 2, actLen);
        return result;
    }

    public static DateTime? ReadDateAndTime(ReadOnlySpan<byte> buffer)
    {
        if (buffer.Length < 8) return null;

        try
        {
            int year = FromBcd(buffer[0]);
            year += (year < 90) ? 2000 : 1900;
            int month = FromBcd(buffer[1]);
            int day = FromBcd(buffer[2]);
            int hour = FromBcd(buffer[3]);
            int minute = FromBcd(buffer[4]);
            int second = FromBcd(buffer[5]);
            int ms1 = FromBcd(buffer[6]);
            int ms2 = FromBcd((byte)(buffer[7] >> 4));
            int millisecond = Math.Clamp(ms1 * 10 + ms2, 0, 999);

            return new DateTime(year, month, day, hour, minute, second, millisecond, DateTimeKind.Utc);
        }
        catch
        {
            return null;
        }
    }

    private static int FromBcd(byte b) => ((b >> 4) * 10) + (b & 0x0F);

    private static byte[] SerializeInt16(short value)
    {
        var buf = new byte[2];
        BinaryPrimitives.WriteInt16BigEndian(buf, value);
        return buf;
    }

    private static byte[] SerializeUInt16(ushort value)
    {
        var buf = new byte[2];
        BinaryPrimitives.WriteUInt16BigEndian(buf, value);
        return buf;
    }

    private static byte[] SerializeInt32(int value)
    {
        var buf = new byte[4];
        BinaryPrimitives.WriteInt32BigEndian(buf, value);
        return buf;
    }

    private static byte[] SerializeUInt32(uint value)
    {
        var buf = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(buf, value);
        return buf;
    }

    private static byte[] SerializeInt64(long value)
    {
        var buf = new byte[8];
        BinaryPrimitives.WriteInt64BigEndian(buf, value);
        return buf;
    }

    private static byte[] SerializeSingle(float value)
    {
        var buf = new byte[4];
        BinaryPrimitives.WriteSingleBigEndian(buf, value);
        return buf;
    }

    private static byte[] SerializeDouble(double value)
    {
        var buf = new byte[8];
        BinaryPrimitives.WriteDoubleBigEndian(buf, value);
        return buf;
    }
}
