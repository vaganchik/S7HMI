# Industrial S7 Server Architecture Specification

## 1. Обзор архитектуры

Архитектура сервера обмена данными спроектирована по принципам модульности, слабой связанности (Loose Coupling), высокой надежности и масштабируемости.

```text
+-----------------------------------------------------------------------------------+
|                              Web HMI Clients (Browser)                            |
+-----------------------------------------------------------------------------------+
                                   ▲                ▲
                       WebSocket   │                │  REST API
                   (JSON / Subscriptions)           │ (Read/Write/Config/Diagnostics)
                                   ▼                ▼
+-----------------------------------------------------------------------------------+
|                        Application Layer: apps/plc-server                         |
|  - Fastify / Express HTTP Server                                                  |
|  - WebSocket Server (Pub/Sub on Change-of-Value & Quality)                        |
|  - REST Endpoints (/api/plcs, /api/tags, /api/diagnostics)                        |
|  - Structured Logger (Pino) & Metrics Exporter                                    |
+-----------------------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------------------+
|                      Domain / Core Layer: packages/plc-core                       |
|  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐  |
|  │       TagCache        │  │     PollingEngine     │  │     WriteManager      │  |
|  │ - Current Values      │  │ - Scheduled Poll Loop │  │ - Write Enable Guard  │  |
|  │ - Quality Codes       │  │ - Contiguous Merging  │  │ - Range & Type Checks │  |
|  │ - UTC Timestamps      │  │ - PDU Splitter        │  │ - Audit Logging       │  |
|  │ - Change Detection    │  │ - Backoff Reconnect   │  │ - Dry-Run Simulation  │  |
|  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘  |
|                                  │                                                |
|                                  ▼                                                |
|                      IPlcDriver Abstract Interface                                |
|    - connect(): Promise<void>                                                     |
|    - disconnect(): Promise<void>                                                  |
|    - readItems(items: PlcReadItem[]): Promise<PlcReadResult[]>                    |
|    - writeItems(items: PlcWriteItem[]): Promise<PlcWriteResult[]>                 |
|    - getStatus(): PlcConnectionStatus                                             |
+-----------------------------------------------------------------------------------+
          │                                  │                           │
          ▼                                  ▼                           ▼
+-----------------------+          +-------------------+       +--------------------+
|   packages/plc-s7     |          |   MockPlcDriver   |       |    OpcUaDriver     |
|   (S7ClassicDriver)   |          |  (Unit/Sim Test)  |       |   (Future Plugin)  |
| - RFC 1006 (TPKT)     |          +-------------------+       +--------------------+
| - COTP (ISO 8073)     |
| - S7Comm PDU Builder  |
| - S7 Type Encoders    |
+-----------------------+
          │
          ▼ TCP Port 102
+-----------------------------------------------------------------------------------+
|                 Industrial Ethernet / PLC Hardware (S7-300 / 1200 / 1500)         |
+-----------------------------------------------------------------------------------+
```

---

## 2. Структура пакетов (Monorepo Layout)

```text
/
├── apps/
│   └── plc-server/               # Серверное приложение (HTTP, WebSocket, CLI)
│       ├── src/
│       │   ├── api/              # REST контроллеры
│       │   ├── ws/               # WebSocket обработчик и брокер подписок
│       │   ├── config/           # Загрузка и валидация YAML-конфигураций
│       │   ├── diagnostics/      # Сбор метрик опроса, задержек и ошибок
│       │   └── index.ts          # Точка входа приложения
│       └── package.json
│
├── packages/
│   ├── plc-core/                 # Ядро взаимодействия и абстракции
│   │   ├── src/
│   │   │   ├── driver/           # Интерфейсы IPlcDriver, IPlcConnection
│   │   │   ├── cache/            # TagCache, TagEntry, Quality status
│   │   │   ├── polling/          # PollingEngine, Scheduler, Batch Planner
│   │   │   ├── writing/          # WriteManager, WriteValidator, AuditLogger
│   │   │   └── types/            # Канонические типы данных, статусы
│   │   └── package.json
│   │
│   ├── plc-s7/                   # Реализация классического протокола S7
│   │   ├── src/
│   │   │   ├── protocol/         # RFC1006, COTP, S7Comm кодеры/декодеры
│   │   │   ├── types/            # Siemens data types (BOOL, REAL, DINT и др.)
│   │   │   ├── optimizer/        # Слияние смещений и расчет PDU
│   │   │   ├── driver/           # S7ClassicDriver реализация IPlcDriver
│   │   │   └── connection/       # Reconnect State Machine на net.Socket
│   │   └── package.json
│   │
│   └── tag-model/                # Модель тегов и схема конфигурации
│       ├── src/
│       │   ├── parser/           # Парсер S7 адресов ("DB10,REAL4", "M0.0", etc.)
│       │   ├── schema/           # Zod/JSON-Schema валидатор YAML
│       │   └── types/            # Определения тегов, групп, конфигураций
│       └── package.json
│
├── docs/                         # Локальная документация и источники
└── package.json                  # Workspaces root
```

---

## 3. Модель качества данных (Quality Codes)

Каждое значение тега в кеше сопровождается кодом качества и меткой времени UTC:

| Код качества | Описание | Условие возникновения |
| :--- | :--- | :--- |
| **GOOD (192 / 0xC0)** | Данные актуальны и достоверны | Успешно прочитаны из PLC в текущем цикле опроса |
| **BAD (0 / 0x00)** | Ошибка данных или ответа PLC | PLC вернул ошибку адреса (0x05) или блок не существует (0x0A) |
| **STALE (64 / 0x40)** | Данные устарели | Пропущен цикл опроса или значение не обновлялось дольше `staleThresholdMs` |
| **DISCONNECTED (24 / 0x18)** | Нет связи с PLC | TCP-сокет закрыт, таймаут соединения, сбой сети |
| **CONFIG_ERROR (4 / 0x04)** | Ошибка конфигурации тега | Неверный синтаксис адреса, недопустимый тип данных или смещение |
| **WRITE_ERROR (8 / 0x08)** | Ошибка записи значения | Ошибка при выполнении команды PUT/Write Var |

---

## 4. Конвейер опроса (Polling Engine Pipeline)

1. **Планирование:** Регулярный интервал опроса для каждой группы тегов (например, `fast`: 100 ms, `normal`: 500 ms, `slow`: 2000 ms).
2. **Планировщик PDU (Batch Optimizer):**
   - Группировка тегов по блокам (например, `DB100`, `DB101`, `Merker`).
   - Слияние непрерывных и близко расположенных областей байт (GAP threshold <= 16 байт).
   - Разбиение на фрагменты в соответствии с согласованным размером PDU контроллера.
3. **Исполнение запроса (IPlcDriver):**
   - Асинхронная передача сетевого запроса с контролем таймаута (2000 ms).
4. **Декодирование и обновление кеша:**
   - Извлечение значений согласно типам (`REAL`, `DINT`, `BOOL`).
   - Сравнение со старыми значениями (Deadband / Change detection).
   - Обновление `TagCache` с установкой качества `GOOD` и `timestamp = Date.now()`.
5. **Публикация в WebSocket:**
   - Рассылка обновленных тегов подписчикам по событию изменения (Change-of-Value).

---

## 5. Конвейер безопасной записи (Write Security Pipeline)

1. **Глобальный предохранитель:** Проверка переменной окружения `WRITE_ENABLED=true`. Если false — немедленный возврат ошибки `WRITE_DISABLED_GLOBALLY`.
2. **Dry-Run режим:** Если включен `DRY_RUN_MODE=true` — валидация выполняется полностью, логируется команда, но фактический сетевой пакет записи в PLC не отправляется.
3. **Валидация адреса и типа:** Проверка, что тег объявлен с флагом `allowWrite: true`, и новое значение соответствует типу и попадает в границы `[minValue, maxValue]`.
4. **Аудит-лог:** Запись в структурированный лог: `{ timestamp, user, plcId, tagId, address, oldValue, newValue, success }`.
5. **Запись в буферный DB:** Рекомендуется производить запись в специализированный интерфейсный блок данных (HMI Command DB), откуда логика PLC копирует проверенные значения в исполнительные контуры.
