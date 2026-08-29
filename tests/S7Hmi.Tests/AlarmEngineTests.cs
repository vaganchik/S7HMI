using S7Hmi.Core.Enums;
using S7Hmi.Core.Models;
using S7Hmi.Core.Services;
using Xunit;

namespace S7Hmi.Tests;

public class AlarmEngineTests
{
    [Fact]
    public void AlarmEngine_Tracks_Activation_Ack_And_Cleared_Timestamps()
    {
        var engine = new AlarmEngine();
        engine.RegisterAlarm(new AlarmDefinition
        {
            Id = "alarm.temp.high",
            TagId = "furnace.temp",
            Condition = AlarmCondition.GreaterThan,
            Setpoint = 100.0,
            Severity = AlarmSeverity.Critical,
            Message = "Перегрев"
        });

        // 1. Срабатывание аварии
        engine.Evaluate([new TagValueUpdate("furnace.temp", 120.0, TagQuality.Good, DateTime.UtcNow)]);

        var activeList = engine.GetActiveAlarms();
        Assert.Single(activeList);
        var active = activeList[0];
        Assert.Equal(AlarmState.Active, active.State);
        Assert.True((DateTime.UtcNow - active.ActiveTimestamp).TotalSeconds < 2);

        // 2. Квитирование оператором
        bool ackResult = engine.AcknowledgeAlarm(active.Id, "Operator-Ivan");
        Assert.True(ackResult);
        Assert.Equal(AlarmState.Acknowledged, active.State);
        Assert.NotNull(active.AcknowledgedTimestamp);
        Assert.Equal("Operator-Ivan", active.AcknowledgedBy);

        // 3. Нормализация (снятие аварии)
        engine.Evaluate([new TagValueUpdate("furnace.temp", 80.0, TagQuality.Good, DateTime.UtcNow)]);
        Assert.Empty(engine.GetActiveAlarms());
        Assert.Equal(AlarmState.Cleared, active.State);
        Assert.NotNull(active.ClearedTimestamp);

        // 4. Проверка выдачи предыдущих инцидентов этой аварии
        var occurrences = engine.GetAlarmOccurrences("alarm.temp.high");
        Assert.Single(occurrences);
        Assert.Equal("alarm.temp.high", occurrences[0].AlarmId);
        Assert.NotNull(occurrences[0].AcknowledgedTimestamp);
        Assert.NotNull(occurrences[0].ClearedTimestamp);
    }

    [Fact]
    public void PlcTagDefinition_Infers_Correct_Category()
    {
        var boolTag = new PlcTagDefinition
        {
            Id = "motor.run",
            Address = new PlcTagAddress { DataType = S7DataType.Bool }
        };
        Assert.Equal(TagCategory.Discrete, boolTag.Category);

        var realTag = new PlcTagDefinition
        {
            Id = "furnace.temp",
            Address = new PlcTagAddress { DataType = S7DataType.Real }
        };
        Assert.Equal(TagCategory.Analog, realTag.Category);
    }

    [Fact]
    public void AlarmEngine_Triggers_On_Small_Change_If_Threshold_Exceeded()
    {
        var engine = new AlarmEngine();
        engine.RegisterAlarm(new AlarmDefinition
        {
            Id = "alarm.temp.high",
            TagId = "furnace.temp",
            Condition = AlarmCondition.GreaterThan,
            Setpoint = 100.0,
            Severity = AlarmSeverity.Critical,
            Message = "Перегрев"
        });

        engine.Evaluate([new TagValueUpdate("furnace.temp", 100.1, TagQuality.Good, DateTime.UtcNow)]);

        var activeList = engine.GetActiveAlarms();
        Assert.Single(activeList);
        Assert.Equal("alarm.temp.high", activeList[0].AlarmId);
    }
}
