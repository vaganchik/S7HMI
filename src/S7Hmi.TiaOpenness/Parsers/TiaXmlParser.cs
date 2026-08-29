using System.Xml.Linq;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Models;
using S7Hmi.TiaOpenness.Calculators;
using S7Hmi.TiaOpenness.Models;

namespace S7Hmi.TiaOpenness.Parsers;

/// <summary>
/// Парсер XML файлов, экспортированных через Siemens TIA Portal Openness API
/// </summary>
public static class TiaXmlParser
{
    public static TiaDataBlock ParseDataBlockXml(string xmlContent)
    {
        var doc = XDocument.Parse(xmlContent);
        var dbElement = doc.Descendants().FirstOrDefault(e => e.Name.LocalName == "SW.Blocks.GlobalDB" || e.Name.LocalName == "GlobalDB");

        if (dbElement == null)
        {
            throw new FormatException("XML does not contain a valid Siemens GlobalDB block definition");
        }

        var result = new TiaDataBlock();

        // 1. Атрибуты блока (Имя, номер, оптимизация)
        var attrList = dbElement.Element("AttributeList") ?? dbElement.Descendants("AttributeList").FirstOrDefault();
        if (attrList != null)
        {
            var numElem = attrList.Elements().FirstOrDefault(e => e.Name.LocalName.EndsWith("Number", StringComparison.OrdinalIgnoreCase));
            if (numElem != null && int.TryParse(numElem.Value, out int dbNum))
            {
                result.Number = dbNum;
            }

            var nameElem = attrList.Elements().FirstOrDefault(e => e.Name.LocalName.Equals("Name", StringComparison.OrdinalIgnoreCase));
            if (nameElem != null)
            {
                result.Name = nameElem.Value;
            }

            var optElem = attrList.Elements().FirstOrDefault(e => e.Name.LocalName.EndsWith("Optimized", StringComparison.OrdinalIgnoreCase) || e.Name.LocalName.EndsWith("IsOptimized", StringComparison.OrdinalIgnoreCase));
            if (optElem != null && bool.TryParse(optElem.Value, out bool opt))
            {
                result.IsOptimized = opt;
            }
        }

        // 2. Чтение интерфейса переменных
        var members = dbElement.Descendants().Where(e => e.Name.LocalName == "Member");
        foreach (var m in members)
        {
            string name = m.Attribute("Name")?.Value ?? string.Empty;
            string dataType = m.Attribute("Datatype")?.Value ?? m.Attribute("DataType")?.Value ?? "Real";

            if (string.IsNullOrEmpty(name)) continue;

            // Комментарий
            string? comment = null;
            var commentElem = m.Descendants().FirstOrDefault(e => e.Name.LocalName == "MultiLanguageText" || e.Name.LocalName == "Text");
            if (commentElem != null)
            {
                comment = commentElem.Value;
            }

            result.Variables.Add(new TiaDbVariable
            {
                Name = name,
                Path = name,
                RawDataType = dataType,
                Comment = comment
            });
        }

        // 3. Расчет смещений в байтах
        S7MemoryLayoutCalculator.CalculateOffsets(result.Variables);

        return result;
    }

    public static TiaTagTable ParseTagTableXml(string xmlContent)
    {
        var doc = XDocument.Parse(xmlContent);
        var tableElement = doc.Descendants().FirstOrDefault(e => e.Name.LocalName == "SW.Tags.PlcTagTable" || e.Name.LocalName == "PlcTagTable");

        var result = new TiaTagTable();
        var attrList = tableElement?.Element("AttributeList");
        if (attrList != null)
        {
            var nameElem = attrList.Elements().FirstOrDefault(e => e.Name.LocalName == "Name");
            if (nameElem != null) result.Name = nameElem.Value;
        }

        var tags = doc.Descendants().Where(e => e.Name.LocalName == "SW.Tags.PlcTag" || e.Name.LocalName == "PlcTag");
        foreach (var t in tags)
        {
            string name = t.Attribute("Name")?.Value ?? string.Empty;
            string dataType = t.Attribute("Datatype")?.Value ?? t.Attribute("DataType")?.Value ?? "Bool";
            string logicalAddress = t.Attribute("LogicalAddress")?.Value ?? "%M0.0";

            if (string.IsNullOrEmpty(name)) continue;

            result.Tags.Add(new TiaPlcTag
            {
                Name = name,
                RawDataType = dataType,
                LogicalAddress = logicalAddress,
                S7DataType = S7MemoryLayoutCalculator.ParseDataType(dataType, out _, out _)
            });
        }

        return result;
    }

    /// <summary>
    /// Конвертирует распарсенный блок DB в список PlcTagDefinition для сервера
    /// </summary>
    public static List<PlcTagDefinition> ConvertToPlcTags(TiaDataBlock db, string plcId = "PLC-1")
    {
        var list = new List<PlcTagDefinition>();

        foreach (var v in db.Variables)
        {
            string tagId = $"{db.Name}.{v.Name}".ToLowerInvariant();
            list.Add(new PlcTagDefinition
            {
                Id = tagId,
                PlcId = plcId,
                Name = $"{db.Name}.{v.Name}",
                Description = v.Comment ?? string.Empty,
                Address = new PlcTagAddress
                {
                    Area = S7MemoryArea.DB,
                    DbNumber = db.Number,
                    StartByte = v.ByteOffset,
                    BitNumber = v.BitOffset,
                    DataType = v.S7DataType,
                    StringLength = v.ByteSize > 2 ? v.ByteSize - 2 : 254
                },
                ArchiveEnabled = true,
                ArchiveIntervalMs = 1000
            });
        }

        return list;
    }
}
