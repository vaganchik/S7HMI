using FluentAssertions;
using S7Hmi.Core.Enums;
using S7Hmi.Driver.S7.Converters;
using Xunit;

namespace S7Hmi.Tests;

public class S7DataConverterTests
{
    [Fact]
    public void ExtractValue_Real_ShouldParseBigEndianFloat()
    {
        // 123.456f in IEEE 754 Big Endian is 0x42, 0xF6, 0xE9, 0x79
        byte[] buffer = [0x42, 0xF6, 0xE9, 0x79];

        var result = S7DataConverter.ExtractValue(buffer, S7DataType.Real);

        result.Should().BeOfType<float>();
        ((float)result!).Should().BeApproximately(123.456f, 0.001f);
    }

    [Fact]
    public void SerializeValue_Real_ShouldProduceBigEndianBytes()
    {
        float value = 123.456f;

        var bytes = S7DataConverter.SerializeValue(value, S7DataType.Real);

        bytes.Should().HaveCount(4);
        bytes[0].Should().Be(0x42);
        bytes[1].Should().Be(0xF6);
        bytes[2].Should().Be(0xE9);
        bytes[3].Should().Be(0x79);
    }

    [Fact]
    public void ExtractValue_Int_ShouldParseBigEndianShort()
    {
        // 1000 in short Big Endian is 0x03, 0xE8
        byte[] buffer = [0x03, 0xE8];

        var result = S7DataConverter.ExtractValue(buffer, S7DataType.Int);

        result.Should().Be((short)1000);
    }

    [Fact]
    public void ExtractValue_Bool_ShouldReadCorrectBit()
    {
        byte b = 0b00000100; // Bit 2 is True
        byte[] buffer = [b];

        var bit0 = S7DataConverter.ExtractValue(buffer, S7DataType.Bool, bitNumber: 0);
        var bit2 = S7DataConverter.ExtractValue(buffer, S7DataType.Bool, bitNumber: 2);

        bit0.Should().Be(false);
        bit2.Should().Be(true);
    }

    [Fact]
    public void S7String_RoundTrip_ShouldWorkCorrectly()
    {
        string text = "Pump-101";
        var bytes = S7DataConverter.SerializeS7String(text, 32);

        bytes[0].Should().Be(32); // Max length
        bytes[1].Should().Be((byte)text.Length); // Actual length

        var readBack = S7DataConverter.ReadS7String(bytes);
        readBack.Should().Be(text);
    }
}
