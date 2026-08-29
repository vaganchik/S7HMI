# S7 Communication Library Comparison & Technology Selection

## 1. Сравнительная таблица библиотек

| Критерий | `plcpeople/nodeS7` (`nodes7`) | `@st-one-io/nodes7` | `Snap7` / `node-snap7` | `node-snap7js` | `Apache PLC4X` | `node-opcua` (OPC UA) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Repository** | [github.com/plcpeople/nodeS7](https://github.com/plcpeople/nodeS7) | [github.com/st-one-io/nodes7](https://github.com/st-one-io/nodes7) | [github.com/mathiask88/node-snap7](https://github.com/mathiask88/node-snap7) | [github.com/sesenlik/node-snap7js](https://github.com/sesenlik/node-snap7js) | [github.com/apache/plc4x](https://github.com/apache/plc4x) | [github.com/node-opcua/node-opcua](https://github.com/node-opcua/node-opcua) |
| **License** | **MIT** | **GPL-3.0-or-later** | **LGPL-3.0 / MIT** | **MIT** | **Apache-2.0** | **MIT** |
| **Последний release** | v0.3.18 (2022) | v1.1.2 (2025) | v1.0.9 (2025) | v0.2.0 (2025) | v0.12.0 (2024) | v2.130+ (Active 2026) |
| **S7-300** | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) | NO (нет native OPC UA) |
| **S7-1200** | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) | YES (FW >= 4.4) |
| **S7-1500** | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) | YES (CONFIRMED) |
| **READ** | YES | YES | YES | YES | YES | YES |
| **WRITE** | YES | YES | YES | YES | YES | YES |
| **DB** | YES | YES | YES | YES | YES | YES |
| **M** | YES | YES | YES | YES | YES | YES |
| **I** | YES | YES | YES | YES | YES | YES |
| **Q** | YES | YES | YES | YES | YES | YES |
| **optimized DB** | NO | NO | NO | NO | Experimental (S7+ partial) | **YES (Native)** |
| **symbolic access** | NO (absolute only) | NO (absolute only) | NO (absolute only) | NO (absolute only) | Partial (PLC4X S7+) | **YES (Native)** |
| **reconnect** | Manual / Callback | Basic auto-reconnect | Manual / Client recreate | Basic | Driver managed | Robust auto-reconnect |
| **batching** | YES (Auto merge) | YES (ItemGroup) | YES (Cli_ReadMultiVars) | Basic | YES (PlcReadRequest) | YES (ReadRequest) |
| **PDU handling** | Auto split/merge | Auto split | Manual/Cli chunking | Basic | Auto fragmentation | Protocol managed |
| **TypeScript** | NO (JS only) | NO (Types in progress) | Partial (.d.ts exists) | Partial | TS driver experimental | **Full TypeScript** |
| **Native dependency**| **NO (Pure JS)** | **NO (Pure JS)** | **YES (C++ Addon, NAN)** | **NO (Pure JS)** | NO (Java/TS pure) | **NO (Pure JS)** |
| **Windows** | YES | YES | YES (требует build tools) | YES | YES | YES |
| **Linux** | YES | YES | YES (требует libsnap7) | YES | YES | YES |
| **Docker** | YES (Tiny image) | YES | Риск (требует build env) | YES | YES | YES |
| **ARM64** | YES (Zero issues) | YES | Риск (требует cross-comp)| YES | YES | YES |
| **Issues** | Устаревший API (callbacks) | Лицензия GPL-3.0 | Сегфолты при сбоях сокетов | Молодой проект (2025) | Сложная кодогенерация | S7-300 не поддерживается |
| **Production risks** | Callback-hell | Лицензионное заражение | Native crash всего Node-процесса | Недостаточно тестов | Экспериментальный TS SDK | Накладные расходы памяти |

---

## 2. Ответы на ключевые вопросы исследования (Section 45)

### 2.1 Какой технический путь оптимален для собственного Web-HMI сервера, одновременно работающего с S7-300, S7-1200 и S7-1500?
**Ответ:** 
Оптимальным решением является **разработка собственного чистого TypeScript-драйвера `S7ClassicDriver` в модульной архитектуре `packages/plc-s7` с интерфейсом `IPlcDriver`**.

1. **Почему выбран этот путь:**
   - **Надежность и стабильность процесса Node.js:** Нативные C++ аддоны (как `node-snap7`) при сетевых таймаутах, сбоях памяти или резких обрывах сокета на нестабильном оборудовании могут вызывать `Segmentation Fault / Access Violation`, что приводит к мгновенному падению всего Node.js процесса. Чистый JavaScript/TypeScript сетевой стек на сокетах Node.js `net.Socket` перехватывает любые сбои штатным `error` событием без краха процесса.
   - **Кроссплатформенность без нативных компиляторов:** Сервер моментально собирается и разворачивается на Windows, Linux, Alpine Docker и ARM64 (Raspberry Pi, industrial IPC) без `node-gyp`, Python, gcc, Visual Studio Build Tools.
   - **Лицензионная чистота:** Использование лицензии MIT/Apache без ограничений и рисков заражения GPL-3.0 (что является фатальным недостатком `@st-one-io/nodes7` для коммерческих SCADA систем).
   - **Полная интеграция со строгой типизацией TypeScript:** Строгие типы для адресов, групп опроса, PDU, статусов качества.

2. **Какие ограничения будут на S7-1200/1500:**
   - В контроллерах S7-1200 и S7-1500 опрос через S7 Classic требует наличия стандартных (Non-Optimized) блоков данных (DB) с известными байтовыми смещениями.
   - В аппаратной конфигурации TIA Portal обязательно должно быть разрешено удаленное PUT/GET-взаимодействие.
   - Уровень защиты CPU в TIA Portal должен разрешать HMI/Read/Write доступ.

3. **Нужно ли отключать optimized DB:**
   - **ДА**, для блоков данных, которые должны читаться или записываться через классический драйвер S7. В свойствах блока данных (`DB -> Properties -> Attributes`) флаг **"Optimized block access" должен быть снят**.

4. **Нужно ли разрешать PUT/GET:**
   - **ДА**. В свойствах CPU (`CPU Properties -> Protection & Security -> Connection mechanisms`) необходимо выставить флаг **"Permit access with PUT/GET communication from remote partner"**.

5. **Какие риски безопасности это создаёт:**
   - Трафик классического S7Comm передается по открытому протоколу TCP/102 без шифрования и аутентификации.
   - Любое устройство в той же подсети, зная номер DB и адрес, может прочитать или изменить значение.
   - **Решение:** Промышленная сетевая сегментация (PLC VLAN + Firewall) и запрет прямого сетевого доступа операторов/браузеров к порту 102 контроллеров. Вся авторизация и валидация выполняются SCADA-сервером.

6. **Как мы позже сможем перейти на symbolic access без переделки всей SCADA:**
   - Благодаря слою канонической модели тегов (`TagModel`) и абстрактному интерфейсу `IPlcDriver`:
     ```text
     Web HMI  <--->  Tag Cache & API  <--->  IPlcDriver
                                                ├── S7ClassicDriver (MVP - S7-300/1200/1500)
                                                ├── OpcUaDriver     (Future - S7-1200/1500 Symbolic)
                                                └── S7PlusDriver    (Future)
     ```
   - Верхний уровень SCADA и Web-интерфейс работают только с идентификаторами тегов (например, `furnace.temperature`), не зная, по какому протоколу (S7 Classic, OPC UA или Modbus) получено значение. При переходе на OPC UA заменяется только конфигурация драйвера конкретного PLC.

7. **Какие CPU/firmware необходимо проверить на реальном железе:**
   - **S7-300:** CPU 315-2 PN/DP (FW >= 3.2), CPU 314C + CP 343-1 Lean.
   - **S7-1200:** CPU 1212C / 1214C / 1215C (FW 4.2, FW 4.5, FW 4.6).
   - **S7-1500:** CPU 1511-1 PN, 1515-2 PN, 1518 (FW 2.8, FW 2.9, FW 3.0+).
