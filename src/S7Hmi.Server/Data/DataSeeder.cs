using S7Hmi.Archiver.Postgres.Repositories;
using S7Hmi.Core.Enums;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;
using S7Hmi.Core.Services;

namespace S7Hmi.Server.Data;

/// <summary>
/// Инициализатор демонстрационных тегов, аварийных уставок и исторических точек процесса
/// </summary>
public static class DataSeeder
{
    public static void SeedSampleData(ITagRegistry registry, IAlarmEngine alarmEngine, ITagHistoryRepository? historyRepo = null)
    {
        // 1. Регистрация технологических тегов линии минеральной ваты
        registry.RegisterTags([
            new PlcTagDefinition
            {
                Id = "furnace.zone1.temperature",
                PlcId = "PLC-1",
                Name = "Температура Зоны #1 КП",
                Description = "Температура камеры полимеризации в Зоне 1 (входная зона)",
                Category = TagCategory.Analog,
                EngineeringUnit = "°C",
                MinValue = 100,
                MaxValue = 300,
                Deadband = 0.5,
                Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 10, StartByte = 0, DataType = S7DataType.Real },
                ArchiveEnabled = true,
                ArchiveIntervalMs = 1000
            },
            new PlcTagDefinition
            {
                Id = "furnace.zone2.temperature",
                PlcId = "PLC-1",
                Name = "Температура Зоны #2 КП",
                Description = "Температура камеры полимеризации в Зоне 2 (основной нагрев)",
                Category = TagCategory.Analog,
                EngineeringUnit = "°C",
                MinValue = 100,
                MaxValue = 300,
                Deadband = 0.5,
                Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 10, StartByte = 4, DataType = S7DataType.Real },
                ArchiveEnabled = true,
                ArchiveIntervalMs = 1000
            },
            new PlcTagDefinition
            {
                Id = "furnace.zone3.temperature",
                PlcId = "PLC-1",
                Name = "Температура Зоны #3 КП",
                Description = "Температура камеры полимеризации в Зоне 3 (стабилизация)",
                Category = TagCategory.Analog,
                EngineeringUnit = "°C",
                MinValue = 100,
                MaxValue = 300,
                Deadband = 0.5,
                Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 10, StartByte = 8, DataType = S7DataType.Real },
                ArchiveEnabled = true,
                ArchiveIntervalMs = 1000
            },
            new PlcTagDefinition
            {
                Id = "furnace.zone4.temperature",
                PlcId = "PLC-1",
                Name = "Температура Зоны #4 КП",
                Description = "Температура камеры полимеризации в Зоне 4 (выходная зона)",
                Category = TagCategory.Analog,
                EngineeringUnit = "°C",
                MinValue = 100,
                MaxValue = 300,
                Deadband = 0.5,
                Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 10, StartByte = 12, DataType = S7DataType.Real },
                ArchiveEnabled = true,
                ArchiveIntervalMs = 1000
            },
            new PlcTagDefinition
            {
                Id = "spinner.1.current",
                PlcId = "PLC-1",
                Name = "Ток вала #1 центрифуги",
                Description = "Ток главного привода валка 1 прядильной машины",
                Category = TagCategory.Analog,
                EngineeringUnit = "A",
                MinValue = 0,
                MaxValue = 30,
                Deadband = 0.2,
                Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 20, StartByte = 0, DataType = S7DataType.Real },
                ArchiveEnabled = true
            },
            new PlcTagDefinition
            {
                Id = "kvo.drum.pressure",
                PlcId = "PLC-1",
                Name = "Разрежение барабана КВО",
                Description = "Перепад давления камеры волокноосаждения",
                Category = TagCategory.Analog,
                EngineeringUnit = "Pa",
                MinValue = -3500,
                MaxValue = 0,
                Deadband = 10,
                Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 30, StartByte = 0, DataType = S7DataType.Real },
                ArchiveEnabled = true
            },
            new PlcTagDefinition
            {
                Id = "line.main.speed",
                PlcId = "PLC-1",
                Name = "Главная скорость линии",
                Description = "Каскадная скорость технологической линии",
                Category = TagCategory.Analog,
                EngineeringUnit = "m/min",
                MinValue = 0,
                MaxValue = 5,
                Deadband = 0.02,
                Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 40, StartByte = 0, DataType = S7DataType.Real },
                ArchiveEnabled = true
            },
            new PlcTagDefinition
            {
                Id = "line.carpet.density",
                PlcId = "PLC-1",
                Name = "Плотность ковра",
                Description = "Объемная плотность минераловатного ковра",
                Category = TagCategory.Analog,
                EngineeringUnit = "kg/m³",
                MinValue = 40,
                MaxValue = 200,
                Deadband = 0.5,
                Address = new PlcTagAddress { Area = S7MemoryArea.DB, DbNumber = 40, StartByte = 4, DataType = S7DataType.Real },
                ArchiveEnabled = true
            }
        ]);

        // 2. Регистрация аварийных уставок
        alarmEngine.RegisterAlarms([
            new AlarmDefinition
            {
                Id = "alarm.furnace.zone2.high",
                TagId = "furnace.zone2.temperature",
                Condition = AlarmCondition.GreaterThan,
                Setpoint = 255.0,
                Severity = AlarmSeverity.Warning,
                Message = "Предупреждение: Высокая температура Зоны #2 КП (> 255 °C)"
            },
            new AlarmDefinition
            {
                Id = "alarm.furnace.zone2.critical",
                TagId = "furnace.zone2.temperature",
                Condition = AlarmCondition.GreaterThan,
                Setpoint = 265.0,
                Severity = AlarmSeverity.Critical,
                Message = "АВАРИЯ: Критический перегрев печи (> 265 °C)!"
            }
        ]);

        // 3. Заполнение базы данных тестовыми точками за последние 24 часа
        if (historyRepo != null)
        {
            SeedHistoricalPoints(historyRepo);
        }
    }

    private static void SeedHistoricalPoints(ITagHistoryRepository repo)
    {
        var now = DateTime.UtcNow;
        var startTime = now.AddHours(-24);
        var totalPoints = 720; // Каждые 2 минуты за 24 часа
        var stepSec = (now - startTime).TotalSeconds / totalPoints;

        var updates = new List<TagValueUpdate>();

        for (int i = 0; i <= totalPoints; i++)
        {
            var t = startTime.AddSeconds(i * stepSec);
            var rad = i * 0.05;

            // Зона 1: ~190.5 °C с плавными колебаниями
            var z1 = 190.5 + Math.Sin(rad) * 4.2 + Math.Cos(rad * 2.3) * 1.5;
            // Зона 2: ~245.0 °C
            var z2 = 245.0 + Math.Cos(rad * 0.8) * 3.8 + Math.Sin(rad * 1.7) * 1.2;
            // Зона 3: ~242.0 °C
            var z3 = 242.0 + Math.Sin(rad * 1.1) * 3.0 + Math.Cos(rad * 0.9) * 1.0;
            // Зона 4: ~239.5 °C
            var z4 = 239.5 + Math.Cos(rad * 1.4) * 3.5 + Math.Sin(rad * 0.6) * 1.1;

            // Другие параметры
            var spinCur = 14.2 + Math.Sin(rad * 1.5) * 1.4;
            var kvoPress = -2684.0 + Math.Sin(rad * 0.7) * 65.0;
            var spd = 1.43 + Math.Cos(rad * 0.3) * 0.04;
            var dens = 96.0 + Math.Sin(rad * 0.4) * 2.5;

            updates.Add(new TagValueUpdate("furnace.zone1.temperature", z1, TagQuality.Good, t));
            updates.Add(new TagValueUpdate("furnace.zone2.temperature", z2, TagQuality.Good, t));
            updates.Add(new TagValueUpdate("furnace.zone3.temperature", z3, TagQuality.Good, t));
            updates.Add(new TagValueUpdate("furnace.zone4.temperature", z4, TagQuality.Good, t));
            updates.Add(new TagValueUpdate("spinner.1.current", spinCur, TagQuality.Good, t));
            updates.Add(new TagValueUpdate("kvo.drum.pressure", kvoPress, TagQuality.Good, t));
            updates.Add(new TagValueUpdate("line.main.speed", spd, TagQuality.Good, t));
            updates.Add(new TagValueUpdate("line.carpet.density", dens, TagQuality.Good, t));
        }

        if (repo is SqliteHistoryRepository sqliteRepo)
        {
            sqliteRepo.AddBatchAsync(updates).GetAwaiter().GetResult();
        }
        else if (repo is InMemoryHistoryRepository inMemRepo)
        {
            inMemRepo.AddPoints(updates);
        }
    }
}
