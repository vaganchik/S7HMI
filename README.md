# S7 Industrial HMI SCADA &bull; Mineral Wool Production Line

> **Высокопроизводительная промышленная SCADA/HMI система** для непрерывной линии производства минеральной (базальтовой) ваты на базе контроллеров **Siemens S7-1500 / S7-1200**, сервера на **.NET 8/10**, автономного **In-Memory / TimescaleDB** архиватора и клиентского интерфейса на **React 18 / Vite (ISA-101 60 FPS)**.

---

## ⚡ Быстрый старт (Запуск в 2 команды)

```bash
# 1. Запуск серверного ядра .NET (Zero-Dependency In-Memory Mock / REST / SignalR)
dotnet run --project src/S7Hmi.Server

# 2. Запуск веб-интерфейса Web-HMI (в отдельном терминале)
npm run dev --prefix apps/web-hmi
```

- **Веб-интерфейс SCADA:** 👉 [`http://localhost:3000`](http://localhost:3000)
- **Backend API & SignalR:** 👉 [`http://localhost:5000`](http://localhost:5000)

---

## 📚 Комплект проектной документации

Вся документация по системе структурирована в папке `docs/`:

1. **[Архитектура и протоколы (ARCHITECTURE.md)](file:///c:/Users/vagan/projects/S7HMI/docs/ARCHITECTURE.md)**:
   - 5-уровневая Clean Architecture.
   - PDU-пакетирование S7comm (сжатие 500 тегов в 3-6 сетевых пакетов).
   - Классификация тегов (Discrete COS, Analog Deadband, AlarmFlag).
   - Жизненный цикл аварий и Circuit Breaker базы данных.
2. **[Руководство оператора линии (OPERATOR_MANUAL.md)](file:///c:/Users/vagan/projects/S7HMI/docs/OPERATOR_MANUAL.md)**:
   - Мнемосхемы всех 7 переделов (Обзор, Центрифуги, КВО, Гофрировщик, Печь КП, Пилы, Плотность/ZC).
   - Унифицированный фейсплейт ручного управления механизмами.
   - Порядок квитирования аварий и просмотр хронологии инцидентов.
   - Эксплуатация модуля трендов (пресеты, мульти-оси Y1/Y2, инструмент «Рука», экспорт CSV/PNG).
3. **[Руководство разработчика (DEVELOPER_GUIDE.md)](file:///c:/Users/vagan/projects/S7HMI/docs/DEVELOPER_GUIDE.md)**:
   - Сборка и конфигурирование.
   - Переключение режимов хранилища (`InMemory` для проверки без БД ⇄ `Postgres` для продакшна).
   - Спецификация REST API и SignalR WebSocket Hub (`/hmihub`).
   - Модульное тестирование (`dotnet test`).
4. **[Настройка ПЛК Siemens в TIA Portal (SIEMENS_SETUP.md)](file:///c:/Users/vagan/projects/S7HMI/docs/SIEMENS_SETUP.md)**:
   - Снятие режима "Optimized block access" в DB.
   - Разрешение механизма доступа "PUT/GET communication".
   - Импорт схемы тегов через TIA Openness XML.
5. **[Индекс и источники (docs/INDEX.md)](file:///c:/Users/vagan/projects/S7HMI/docs/INDEX.md)**.

---

## 🌟 Ключевые возможности

- 🏭 **7 технологических экранов переделов линии** по стандартам ISA-101 с высокой эргономикой.
- ⚡ **Частота обновления 60 FPS** на клиенте через бинарный SignalR WebSocket стрим.
- 📈 **Промышленный модуль трендов (Trend Viewer)**: 6 заводских пресетов, пользовательские пресеты, мульти-оси Y1/Y2, инструмент «✋ Рука» для скролла по времени, масштабирование колесиком мыши, экспорт в CSV и снимок в PNG.
- 🔔 **Умная подсистема аварий**: звуковая сигнализация, квитирование, всплывающая карточка инцидента с историей предыдущих срабатываний.
- 💾 **3 режима хранилища архивации**:
  - **SQLite (по умолчанию)** — локальная встраиваемая БД `scada_history.db` в режиме WAL с сохранением на диск без установки СУБД;
  - **In-Memory Mock** — ультрабыстрый кольцевой буфер в ОЗУ;
  - **PostgreSQL / TimescaleDB** — промышленная кластерная база данных с гипертаблицами.
- 📄 **TIA Openness XML импортер**: загрузка схемы переменных из проекта TIA Portal за 1 клик.

---

## 🧪 Тестирование
```bash
dotnet test
```
*100% тестов пройдены (9 из 9).*
