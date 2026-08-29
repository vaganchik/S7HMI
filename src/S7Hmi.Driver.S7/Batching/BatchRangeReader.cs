using S7Hmi.Core.Enums;
using S7Hmi.Core.Models;
using S7Hmi.Driver.S7.Converters;

namespace S7Hmi.Driver.S7.Batching;

/// <summary>
/// Описание непрерывного диапазона байт памяти ПЛК для пакетного чтения
/// </summary>
public class MemoryRangeChunk
{
    public S7MemoryArea Area { get; set; }
    public int DbNumber { get; set; }
    public int StartByte { get; set; }
    public int Length { get; set; }
    public List<PlcTagDefinition> Tags { get; } = [];
}

/// <summary>
/// Оптимизатор пакетного чтения переменных Siemens ПЛК
/// Объединяет разрозненные теги в компактные непрерывные блоки байт
/// </summary>
public class BatchRangeReader
{
    private readonly int _maxBatchSize;
    private readonly int _maxGapToleranceBytes;

    public BatchRangeReader(int maxBatchSize = 480, int maxGapToleranceBytes = 16)
    {
        _maxBatchSize = maxBatchSize;
        _maxGapToleranceBytes = maxGapToleranceBytes;
    }

    /// <summary>
    /// Группирует список тегов в минимальное количество непрерывных блоков чтения
    /// </summary>
    public IReadOnlyList<MemoryRangeChunk> CreateOptimizedChunks(IEnumerable<PlcTagDefinition> tags)
    {
        var result = new List<MemoryRangeChunk>();

        var groupedByArea = tags
            .GroupBy(t => (t.Address.Area, t.Address.DbNumber));

        foreach (var group in groupedByArea)
        {
            var sortedTags = group.OrderBy(t => t.Address.StartByte).ToList();
            if (sortedTags.Count == 0) continue;

            MemoryRangeChunk? currentChunk = null;

            foreach (var tag in sortedTags)
            {
                int tagStart = tag.Address.StartByte;
                int tagSize = tag.Address.GetByteSize();
                int tagEnd = tagStart + tagSize;

                if (currentChunk == null)
                {
                    currentChunk = new MemoryRangeChunk
                    {
                        Area = group.Key.Area,
                        DbNumber = group.Key.DbNumber,
                        StartByte = tagStart,
                        Length = tagSize
                    };
                    currentChunk.Tags.Add(tag);
                }
                else
                {
                    int currentEnd = currentChunk.StartByte + currentChunk.Length;
                    int newTotalLength = Math.Max(currentEnd, tagEnd) - currentChunk.StartByte;
                    int gap = tagStart - currentEnd;

                    if (newTotalLength <= _maxBatchSize && gap <= _maxGapToleranceBytes)
                    {
                        currentChunk.Length = newTotalLength;
                        currentChunk.Tags.Add(tag);
                    }
                    else
                    {
                        result.Add(currentChunk);
                        currentChunk = new MemoryRangeChunk
                        {
                            Area = group.Key.Area,
                            DbNumber = group.Key.DbNumber,
                            StartByte = tagStart,
                            Length = tagSize
                        };
                        currentChunk.Tags.Add(tag);
                    }
                }
            }

            if (currentChunk != null)
            {
                result.Add(currentChunk);
            }
        }

        return result;
    }

    /// <summary>
    /// Извлекает значения тегов из прочитанного буфера непрерывного блока
    /// </summary>
    public static void ExtractTagValuesFromBuffer(
        MemoryRangeChunk chunk,
        ReadOnlySpan<byte> buffer,
        DateTime timestamp,
        IDictionary<string, TagValue> outputValues)
    {
        foreach (var tag in chunk.Tags)
        {
            int relativeOffset = tag.Address.StartByte - chunk.StartByte;
            int tagSize = tag.Address.GetByteSize();

            if (relativeOffset >= 0 && relativeOffset + tagSize <= buffer.Length)
            {
                var slice = buffer.Slice(relativeOffset, tagSize);
                var val = S7DataConverter.ExtractValue(
                    slice,
                    tag.Address.DataType,
                    tag.Address.BitNumber,
                    tag.Address.StringLength);

                outputValues[tag.Id] = new TagValue
                {
                    TagId = tag.Id,
                    Value = val,
                    Quality = TagQuality.Good,
                    Timestamp = timestamp
                };
            }
            else
            {
                outputValues[tag.Id] = new TagValue
                {
                    TagId = tag.Id,
                    Value = null,
                    Quality = TagQuality.Bad,
                    Timestamp = timestamp,
                    ErrorMessage = $"Offset {tag.Address.StartByte} out of bounds for chunk start {chunk.StartByte}, len {buffer.Length}"
                };
            }
        }
    }
}
