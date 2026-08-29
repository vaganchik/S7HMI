using S7Hmi.Core.Enums;

namespace S7Hmi.TiaOpenness.Models;

/// <summary>
/// Переменная, извлеченная из блока данных Siemens TIA Portal
/// </summary>
public class TiaDbVariable
{
    /// <summary>Локальное имя переменной в DB</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Полный символьный путь переменной</summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>Строковое обозначение типа данных в TIA Portal (например, "Real", "Bool", "String[32]")</summary>
    public string RawDataType { get; set; } = "Real";

    /// <summary>Канонический тип данных Siemens S7</summary>
    public S7DataType S7DataType { get; set; } = S7DataType.Real;

    /// <summary>Рассчитанное байтовое смещение в неоптимизированном DB</summary>
    public int ByteOffset { get; set; }

    /// <summary>Битовое смещение (0..7 для булевых переменных)</summary>
    public int BitOffset { get; set; }

    /// <summary>Общий размер переменной в байтах</summary>
    public int ByteSize { get; set; }

    /// <summary>Комментарий / описание из проекта TIA Portal</summary>
    public string? Comment { get; set; }

    /// <summary>Начальное значение по умолчанию</summary>
    public string? InitialValue { get; set; }

    /// <summary>Инженерные единицы измерения</summary>
    public string? EngineeringUnit { get; set; }
}

/// <summary>
/// Описание глобального блока данных (Global DB), экспортированного через TIA Openness
/// </summary>
public class TiaDataBlock
{
    /// <summary>Номер блока данных (например, DB1, DB10)</summary>
    public int Number { get; set; }

    /// <summary>Символьное имя блока данных</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Заголовок блока</summary>
    public string? Title { get; set; }

    /// <summary>Комментарий к блоку данных</summary>
    public string? Comment { get; set; }

    /// <summary>Флаг оптимизированного доступа ("Optimized block access")</summary>
    public bool IsOptimized { get; set; } = false;

    /// <summary>Список переменных блока данных</summary>
    public List<TiaDbVariable> Variables { get; } = [];
}

/// <summary>
/// Элемент таблицы тегов контроллера ПЛК (PlcTag)
/// </summary>
public class TiaPlcTag
{
    public string Name { get; set; } = string.Empty;
    public string RawDataType { get; set; } = "Bool";
    public S7DataType S7DataType { get; set; } = S7DataType.Bool;
    public string LogicalAddress { get; set; } = "%M0.0";
    public string? Comment { get; set; }
}

/// <summary>
/// Таблица тегов контроллера ПЛК (PlcTagTable)
/// </summary>
public class TiaTagTable
{
    public string Name { get; set; } = string.Empty;
    public List<TiaPlcTag> Tags { get; } = [];
}
