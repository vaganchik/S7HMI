# Архитектура системы S7 Industrial HMI SCADA

Данный документ описывает системную архитектуру, потоки данных, протоколы взаимодействия и принципы построения промышленной SCADA/HMI-системы для непрерывной линии производства минеральной (базальтовой) ваты на базе контроллеров Siemens S7-1200 / S7-1500.

---

## 1. Обзор архитектуры

Система построена по многоуровневой модульной архитектуре (Clean Architecture / Hexagonal Architecture) с разделением ответственности между низкоуровневым обменом с ПЛК, ядром обработки сигналов, очередью архивации и клиентским Web-HMI интерфейсом.

```mermaid
graph TB
    subgraph PLC_Layer["Уровень автоматизации (ПЛК)"]
        PLC["Siemens S7-1500 / S7-1200<br/>(Порт TCP 102, S7comm)"]
        SimPLC["Программный симулятор S7-1500<br/>(Встроенный генератор расплава и печи)"]
    end

    subgraph Backend_Layer[".NET 8/10 Сервер SCADA (S7Hmi.Server)"]
        Driver["Драйвер S7comm (S7Hmi.Driver.S7)<br/>Оптимизатор пакетов PDU (BatchRangeReader)"]
        Registry["Реестр тегов (TagRegistry)<br/>Кэш значений (TagDataCache)"]
        AlarmEng["Движок тревог и защит (AlarmEngine)<br/>Журнал инцидентов и квитирование"]
        ArchQueue["Очередь архивации (ChannelArchiverQueue)<br/>System.Threading.Channels (Backpressure)"]
        
        subgraph Storage_Layer["Слой хранения данных (S7Hmi.Archiver.Postgres)"]
            MockStore["In-Memory Mock Storage<br/>(Автономный кольцевой буфер 500k точек)"]
            PgStore["PostgreSQL / TimescaleDB<br/>(Бинарный импорт COPY, Гипертаблицы)"]
        end

        SignalR["SignalR Hub (HmiHub)<br/>WebSocket 60 FPS рассылка телеметрии"]
        RestApi["Модульные эндпоинты (Minimal API)<br/>/api/tags, /api/alarms, /api/openness"]
    end

    subgraph Frontend_Layer["Клиентский Web-HMI (React + TypeScript + Vite)"]
        UI_Overview["Главный обзор линии (Overview)"]
        UI_Screens["Мнемосхемы переделов (КВО, Печь, Пилы и др.)"]
        UI_Faceplate["Унифицированный фейсплейт механизма"]
        UI_Trends["Модуль трендов (Пресеты, Multi-Y, Pan-рука)"]
        UI_Alarms["Журнал аварий и карточка инцидента"]
    end

    PLC -->|ISO-on-TCP / S7comm| Driver
    SimPLC -.->|In-Memory loop| Driver
    Driver --> Registry
    Registry --> AlarmEng
    Registry --> ArchQueue
    ArchQueue --> MockStore
    ArchQueue --> PgStore
    AlarmEng --> SignalR
    Registry --> SignalR
    SignalR -->|WebSocket Live Stream| Frontend_Layer
    RestApi -->|HTTP JSON| Frontend_Layer
```

---

## 2. Оптимизация сетевого обмена с ПЛК (S7comm Protocol)

В отличие от стандартного побайтового чтения тегов, в системе реализован алгоритм **PDU Packing / Batch Range Optimization** (`BatchRangeReader.cs`):

1. **Группировка по блокам данных (DB):** Все запрашиваемые теги группируются по номеру DB.
2. **Слияние близких диапазонов:** Теги, расположенные в памяти близко друг к другу (с зазором менее 32 байт), объединяются в единый непрерывный интервал чтения.
3. **Фрагментация по лимиту PDU:** Полученные диапазоны нарезаются на чанки, не превышающие максимальный размер полезной нагрузки S7comm PDU (обычно 240–480 байт).
4. **Результат:** Вместо 200–500 раздельных сетевых запросов опрос всей технологической линии выполняется всего за **3–6 сетевых пакетов**, обеспечивая стабильный цикл опроса **100–200 мс** при RTT < 2 мс.

---

## 3. Классификация тегов и гибридная модель архивации

Все переменные процесса разделены на 3 категории (`TagCategory`):

```mermaid
graph LR
    A["Теги процесса"] --> B["Discrete (Дискретные)"]
    A --> C["Analog (Аналоговые)"]
    A --> D["AlarmFlag (Аварии)"]

    B --> B1["• Архивация строго по изменению (COS)<br/>• Минимизация размера базы данных"]
    C --> C1["• Архивация по зоне нечувствительности (Deadband)<br/>• ИЛИ по таймеру ArchiveIntervalMs (1..5 сек)"]
    D --> D1["• Фиксация времени появления, квитирования и снятия<br/>• Привязка к истории инцидентов"]
```

---

## 4. Жизненный цикл аварийного события (Alarms & Events)

Каждая аварийная уставка (`AlarmDefinition`) отслеживается конечным автоматом состояний:

```mermaid
stateDiagram-v2
    [*] --> Normal: Значение в норме
    Normal --> Active: Выход за уставку (Triggered)
    note right of Active: Запись в alarm_history<br/>ActiveTimestampUtc = NOW()<br/>Звуковая сигнализация в HMI
    
    Active --> Acknowledged: Квитирование оператором
    note right of Acknowledged: AckTimestampUtc = NOW()<br/>AckBy = "OperatorName"
    
    Acknowledged --> Cleared: Возврат параметра в норму
    note right of Cleared: ClearedTimestampUtc = NOW()<br/>Расчет длительности инцидента
    
    Active --> Cleared: Возврат в норму без квитирования
    Cleared --> Normal: Завершение инцидента
```

---

## 5. Гибкая конфигурация базы данных (In-Memory Mock ⇄ PostgreSQL)

В `appsettings.json` поддерживается мгновенное переключение режима хранения:
- **`ArchiverMode: "InMemory"`** — автономная работа без PostgreSQL (кольцевой буфер на 10 000 точек/тег, генерация демо-трендов).
- **`ArchiverMode: "Postgres"`** — промышленное сохранение в PostgreSQL с гипертаблицами TimescaleDB через бинарный импорт `Npgsql.BeginBinaryImportAsync(COPY ...)`.
