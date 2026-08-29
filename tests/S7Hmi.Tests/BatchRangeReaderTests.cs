using FluentAssertions;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Models;
using S7Hmi.Driver.S7.Batching;
using Xunit;

namespace S7Hmi.Tests;

public class BatchRangeReaderTests
{
    [Fact]
    public void CreateOptimizedChunks_ShouldMergeAdjacentTagsInSameDb()
    {
        var reader = new BatchRangeReader(maxBatchSize: 480, maxGapToleranceBytes: 16);

        var tags = new List<PlcTagDefinition>
        {
            new() { Id = "tag1", Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 1, StartByte = 0, DataType = S7DataType.Real } }, // 0..4
            new() { Id = "tag2", Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 1, StartByte = 4, DataType = S7DataType.Real } }, // 4..8
            new() { Id = "tag3", Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 1, StartByte = 8, DataType = S7DataType.Int } },  // 8..10
            new() { Id = "other_db_tag", Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 2, StartByte = 0, DataType = S7DataType.Real } }
        };

        var chunks = reader.CreateOptimizedChunks(tags);

        chunks.Should().HaveCount(2);

        var db1Chunk = chunks.First(c => c.DbNumber == 1);
        db1Chunk.StartByte.Should().Be(0);
        db1Chunk.Length.Should().Be(10);
        db1Chunk.Tags.Should().HaveCount(3);

        var db2Chunk = chunks.First(c => c.DbNumber == 2);
        db2Chunk.StartByte.Should().Be(0);
        db2Chunk.Length.Should().Be(4);
        db2Chunk.Tags.Should().HaveCount(1);
    }
}
