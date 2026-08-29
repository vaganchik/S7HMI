namespace S7Hmi.Core.Enums;

/// <summary>
/// Тип процессора контроллера Siemens
/// </summary>
public enum S7CpuType
{
    S7200 = 0,
    S7300 = 10,
    S7400 = 20,
    S71200 = 30,
    S71500 = 40,
    Logo0BA8 = 50
}

/// <summary>
/// Область памяти контроллера Siemens
/// </summary>
public enum S7MemoryArea
{
    DB = 0x84,        // Data Block
    Inputs = 0x81,    // Process Inputs (I / E)
    Outputs = 0x82,   // Process Outputs (Q / A)
    Flags = 0x83,     // Bit Memory / Merkers (M)
    Timers = 0x1D,    // S7 Timers (T)
    Counters = 0x1C   // S7 Counters (C)
}

/// <summary>
/// Тип данных переменной Siemens
/// </summary>
public enum S7DataType
{
    Bool,
    Byte,
    Char,
    Word,
    DWord,
    Int,      // 16-bit signed integer
    DInt,     // 32-bit signed integer
    LInt,     // 64-bit signed integer
    UInt,     // 16-bit unsigned integer
    UDInt,    // 32-bit unsigned integer
    Real,     // 32-bit IEEE 754 float
    LReal,    // 64-bit IEEE 754 double
    String,   // S7 Classic String [MaxLen(1B), ActLen(1B), Chars...]
    WString,  // S7 Wide String
    Time,     // TIME (32-bit ms)
    DateAndTime // DT (8 bytes S7 BCD format)
}

/// <summary>
/// Статус качества значения тега (OPC/SCADA standard)
/// </summary>
public enum TagQuality
{
    Good = 192,         // 0xC0 - Good Non-specific
    Bad = 0,            // 0x00 - Bad Non-specific
    Uncertain = 64,     // 0x40 - Uncertain Non-specific
    Offline = 8,        // Device offline / Not connected
    Timeout = 12,       // Polling timeout
    ConfigError = 16    // Address / Type parsing error
}

/// <summary>
/// Уровень критичности аварии (Alarm Severity)
/// </summary>
public enum AlarmSeverity
{
    Info = 100,
    Warning = 300,
    Critical = 700,
    Fatal = 900
}

/// <summary>
/// Состояние аварийного события
/// </summary>
public enum AlarmState
{
    Active = 1,
    Acknowledged = 2,
    Cleared = 3
}

/// <summary>
/// Категория типа тега в SCADA
/// </summary>
public enum TagCategory
{
    Discrete = 1,   // Дискретные сигналы (BOOL): пуск/стоп, концевики, клапаны
    Analog = 2,     // Аналоговые величины (REAL, INT): температуры, давления, токи
    AlarmFlag = 3   // Аварийные битовые флаги ПЛК
}


