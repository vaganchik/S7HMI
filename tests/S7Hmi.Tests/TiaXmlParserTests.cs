using FluentAssertions;
using S7Hmi.Core.Enums;
using S7Hmi.TiaOpenness.Parsers;
using Xunit;

namespace S7Hmi.Tests;

public class TiaXmlParserTests
{
    [Fact]
    public void ParseDataBlockXml_ShouldExtractVariablesAndCalculateOffsets()
    {
        string sampleXml = @"<?xml version=""1.0"" encoding=""utf-8""?>
<Document>
  <SW.Blocks.GlobalDB ID=""0"">
    <AttributeList>
      <Header.Number>10</Header.Number>
      <Name>DB_ProcessData</Name>
      <IsOptimized>false</IsOptimized>
    </AttributeList>
    <Interface>
      <Sections xmlns=""http://www.siemens.com/automation/Openness/SW/Interface/v4"">
        <Section Name=""Static"">
          <Member Name=""Zone1_Temp"" Datatype=""Real"" />
          <Member Name=""Zone1_Pressure"" Datatype=""Real"" />
          <Member Name=""Pump_Running"" Datatype=""Bool"" />
          <Member Name=""Valve_Open"" Datatype=""Bool"" />
          <Member Name=""Cycle_Count"" Datatype=""DInt"" />
        </Section>
      </Sections>
    </Interface>
  </SW.Blocks.GlobalDB>
</Document>";

        var db = TiaXmlParser.ParseDataBlockXml(sampleXml);

        db.Number.Should().Be(10);
        db.Name.Should().Be("DB_ProcessData");
        db.IsOptimized.Should().BeFalse();
        db.Variables.Should().HaveCount(5);

        // Zone1_Temp: Real (4 bytes, offset 0.0)
        db.Variables[0].Name.Should().Be("Zone1_Temp");
        db.Variables[0].ByteOffset.Should().Be(0);
        db.Variables[0].S7DataType.Should().Be(S7DataType.Real);

        // Zone1_Pressure: Real (4 bytes, offset 4.0)
        db.Variables[1].Name.Should().Be("Zone1_Pressure");
        db.Variables[1].ByteOffset.Should().Be(4);

        // Pump_Running: Bool (1 bit, offset 8.0)
        db.Variables[2].Name.Should().Be("Pump_Running");
        db.Variables[2].ByteOffset.Should().Be(8);
        db.Variables[2].BitOffset.Should().Be(0);

        // Valve_Open: Bool (1 bit, offset 8.1)
        db.Variables[3].Name.Should().Be("Valve_Open");
        db.Variables[3].ByteOffset.Should().Be(8);
        db.Variables[3].BitOffset.Should().Be(1);

        // Cycle_Count: DInt (4 bytes, aligned to 10.0 after booleans)
        db.Variables[4].Name.Should().Be("Cycle_Count");
        db.Variables[4].ByteOffset.Should().Be(10);
        db.Variables[4].S7DataType.Should().Be(S7DataType.DInt);

        var plcTags = TiaXmlParser.ConvertToPlcTags(db);
        plcTags.Should().HaveCount(5);
        plcTags[0].Id.Should().Be("db_processdata.zone1_temp");
        plcTags[0].Address.DbNumber.Should().Be(10);
    }
}
