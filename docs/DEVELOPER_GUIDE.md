# Руководство разработчика и системного инженера (Developer Guide)

Настоящий документ содержит инструкции по сборке, конфигурированию, запуску и расширению серверной и клиентской частей системы S7 Industrial HMI SCADA.

---

## 1. Системные требования и зависимости

- **.NET SDK:** 8.0 или 10.0+
- **Node.js:** 18.x или 20.x+ (менеджер пакетов `npm`)
- **ОС:** Windows 10/11, Windows Server 2019/2022 или Linux (Ubuntu 22.04+)
- **СУБД (Опционально):** PostgreSQL 15+ с расширением TimescaleDB (для продакшн-архивации). В режиме проверки система работает без установки СУБД (In-Memory Ring Buffer).

---

## 2. Быстрый запуск проекта

### Шаг 1. Клонирование и восстановление зависимостей
```bash
git clone https://github.com/vagan/S7HMI.git
cd S7HMI
dotnet restore
npm install --prefix apps/web-hmi
```

### Шаг 2. Запуск сервера .NET (Backend)
```bash
dotnet run --project src/S7Hmi.Server
```
*Сервер запустится на `http://localhost:5000` (SignalR Hub: `/hmihub`, REST API: `/api/tags`, `/api/alarms`).*

### Шаг 3. Запуск веб-интерфейса (Frontend)
```bash
npm run dev --prefix apps/web-hmi
```
*Интерфейс откроется по адресу `http://localhost:3000`.*

---

## 3. Конфигурация хранилища (SQLite ⇄ In-Memory ⇄ PostgreSQL)

Система поддерживает 3 режима архивации технологических параметров в файле `src/S7Hmi.Server/appsettings.json`:

```json
{
  "ArchiverMode": "Sqlite", // "Sqlite" (по умолчанию, локальная БД) | "InMemory" (быстрый тест) | "Postgres" (TimescaleDB)
  "ArchiverSettings": {
    "DefaultIntervalMs": 1000, // Период архивации по умолчанию (1000 мс)
    "BatchSize": 1000,
    "BatchWaitMs": 500
  },
  "ConnectionStrings": {
    "Sqlite": "Data Source=scada_history.db;Cache=Shared;",
    "Postgres": "Host=localhost;Port=5432;Database=s7_scada;Username=postgres;Password=postgres;"
  }
}
```

- **`ArchiverMode: "Sqlite"` (Рекомендуемый / по умолчанию):** Встраиваемая база данных `scada_history.db` в режиме **WAL (Write-Ahead Logging)**. Данные надежно сохраняются на диск между перезапусками, при этом установка внешних СУБД **НЕ** требуется.
- **`ArchiverMode: "InMemory":`** Хранилище в оперативной памяти (кольцевой буфер `InMemoryHistoryRepository` на 10 000 точек/тег).
- **`ArchiverMode: "Postgres":`** Промышленная база данных PostgreSQL с гипертаблицами TimescaleDB и бинарным импортом `COPY`.

### Настройка интервала архивации в рантайме:
- `GET /api/archiver/settings` — получение текущего глобального интервала (мс).
- `POST /api/archiver/settings` — изменение глобального интервала (`{"defaultIntervalMs": 500}`).
- `PUT /api/tags/{id}/archive` — индивидуальная настройка тега (`{"archiveEnabled": true, "archiveIntervalMs": 250, "deadband": 0.2}`).

---

## 4. Спецификация REST API

### Теги и телеметрия:
- `GET /api/tags` — получить список всех зарегистрированных тегов ПЛК с их типами, адресами DB и инженерными единицами.
- `GET /api/tags/{tagId}/value` — получить текущее значение, качество и метку времени тега.
- `POST /api/tags/{tagId}/write` — записать значение в ПЛК.
  - *Тело запроса:* `{"value": 45.5}` или `{"value": true}`.
- `GET /api/history/{tagId}?fromUtc={...}&toUtc={...}&limit=5000` — получить архивные точки временного ряда.

### Аварии и события:
- `GET /api/alarms/active` — список текущих активных аварий.
- `GET /api/alarms/history?limit=100` — журнал всех произошедших аварийных событий.
- `POST /api/alarms/{alarmId}/acknowledge` — квитирование аварии оператором.
  - *Тело запроса:* `{"acknowledgedBy": "Иванов И.И."}`.
- `GET /api/alarms/{alarmId}/occurrences?limit=50` — хронология предыдущих срабатываний конкретной аварии с метками появления, квитирования и снятия.

---

## 5. Спецификация SignalR WebSocket Hub (`/hmihub`)

Клиент подключается по WebSocket протоколу SignalR:

### События от сервера к клиенту:
- `ReceiveTagUpdate(TagValueUpdate update)` — рассылка измененного значения тега.
- `ReceiveTagBatch(IReadOnlyList<TagValueUpdate> batch)` — пакетная рассылка обновлений (до 60 кадров/сек).
- `ReceiveAlarmTriggered(AlarmEvent evt)` — оповещение о срабатывании аварии.
- `ReceiveAlarmAcknowledged(AlarmEvent evt)` — оповещение о квитировании аварии.
- `ReceiveAlarmCleared(AlarmEvent evt)` — оповещение о нормализации параметра.
- `ReceivePlcStatus(PlcStatus status)` — диагностика связи с ПЛК (статус, RTT, счетчик ошибок).

---

## 6. Запуск модульных тестов
```bash
dotnet test
```
*Прогоняет 9 комплексных тестов движка тревог, парсера тегов, генерации меток времени и классификации тегов.*
