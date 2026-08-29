using System.Text.Json;
using FluentAssertions;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Models;
using S7Hmi.Core.Services;
using Xunit;

namespace S7Hmi.Tests;

public class TagValueParserTests
{
    [Fact]
    public void Should_Parse_Boolean_From_JsonElement()
    {
        var tag = new PlcTagDefinition
        {
            Id = "pump.run",
            Address = new PlcTagAddress { DataType = S7DataType.Bool }
        };

        var jsonTrue = JsonSerializer.Deserialize<object>("true");
        var (successTrue, valTrue, _) = TagValueParser.TryParseAndValidate(jsonTrue, tag);

        successTrue.Should().BeTrue();
        valTrue.Should().Be(true);

        var jsonFalse = JsonSerializer.Deserialize<object>("false");
        var (successFalse, valFalse, _) = TagValueParser.TryParseAndValidate(jsonFalse, tag);

        successFalse.Should().BeTrue();
        valFalse.Should().Be(false);
    }

    [Fact]
    public void Should_Parse_Real_Float_From_JsonElement()
    {
        var tag = new PlcTagDefinition
        {
            Id = "temp.zone1",
            Address = new PlcTagAddress { DataType = S7DataType.Real },
            MinValue = 0,
            MaxValue = 300
        };

        var jsonNum = JsonSerializer.Deserialize<object>("245.5");
        var (success, val, _) = TagValueParser.TryParseAndValidate(jsonNum, tag);

        success.Should().BeTrue();
        val.Should().BeOfType<float>();
        ((float)val!).Should().BeApproximately(245.5f, 0.001f);
    }

    [Fact]
    public void Should_Reject_Value_Exceeding_MaxValue()
    {
        var tag = new PlcTagDefinition
        {
            Id = "temp.zone1",
            Address = new PlcTagAddress { DataType = S7DataType.Real },
            MinValue = 0,
            MaxValue = 300
        };

        var jsonExcess = JsonSerializer.Deserialize<object>("350.0");
        var (success, _, error) = TagValueParser.TryParseAndValidate(jsonExcess, tag);

        success.Should().BeFalse();
        error.Should().Contain("превышает допустимый максимум");
    }

    [Fact]
    public void Should_Reject_ReadOnly_Tag()
    {
        var tag = new PlcTagDefinition
        {
            Id = "read.only.tag",
            Address = new PlcTagAddress { DataType = S7DataType.Real },
            ReadOnly = true
        };

        var (success, _, error) = TagValueParser.TryParseAndValidate(123.4f, tag);

        success.Should().BeFalse();
        error.Should().Contain("Read-Only");
    }
}
