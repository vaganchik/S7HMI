const fs = require('fs');

const researchContent = `# S7 Communication Technical Research Report

## 1. Задача
Разработка промышленно надежного коммуникационного ядра сервера для взаимодействия с контроллерами Siemens семейства S7 (S7-300, S7-1200, S7-1500) по Industrial Ethernet. Сервер является фундаментом будущей Web-HMI/SCADA системы и обеспечивает циклический опрос тегов, группировку и оптимизацию запросов, контроль качества данных (Quality), управление метками времени (Timestamps), безопасную запись уставок и команд, автоматическое восстановление связи (Reconnect State Machine) и выдачу данных клиентам через WebSocket и REST API.

---

## 2. S7-300
### 2.1 Архитектура и коммуникационные интерфейсы
- Контроллеры SIMATIC S7-300 являются классической модульной платформой.
- Коммуникация осуществляется либо через встроенный интерфейс PN (например, CPU 315-2 PN/DP, CPU 317-2 PN/DP), либо через внешний коммуникационный процессор CP 343-1 (Lean, Standard, Advanced).

### 2.2 Адресация Rack / Slot
- Для CPU со встроенным Ethernet: **Rack 0, Slot 2**.
- Для CPU с коммуникационным процессором CP 343-1: TCP-соединение устанавливается с IP-адресом CP 343-1, но в параметрах TSAP/соединения указывается слот CPU (обычно **Rack 0, Slot 2**), либо слот самого CP (например, **Slot 4**), через который коммуникационный стек контроллера маршрутизирует запросы по внутренней шине K-Bus к CPU.
- *Source: docs/siemens/s7-300/GH_CP343-1-EX30_72.pdf, Section 4.*

### 2.3 Ограничения PDU и памяти
- Размер PDU по умолчанию: **240 байт** (в некоторых старших CPU до 480 байт).
- Максимальный размер полезной нагрузки при чтении за один запрос: **222 байта**.
- S7-300 работает исключительно с абсолютной адресацией (DB, M, I, Q, T, C). Все блоки данных (DB) по умолчанию являются стандартными (non-optimized).
- *Validity Status: CONFIRMED.*

---

## 3. S7-1200
### 3.1 Архитектура и сетевые интерфейсы
- Контроллеры SIMATIC S7-1200 имеют встроенный интерфейс PROFINET (RJ45).
- Начиная с аппаратной версии Hardware Release 3/4 и прошивки Firmware >= V4.0, Siemens внедрил усиленные параметры безопасности.

### 3.2 Адресация Rack / Slot
- Для всех CPU S7-1200 адрес всегда: **Rack 0, Slot 1**.
- TSAP: Remote TSAP = \`0x03.00\` или \`0x03.01\` (в зависимости от типа подключения PG/OP или S7 Basic). Local TSAP = \`0x03.01\` (или \`0x01.00\`).
- *Source: docs/siemens/s7-1200/82212115_S7_communication_S7-1500_S7-1200_en.pdf, Section 2.*

### 3.3 Ограничения PDU
- Согласованный размер PDU: **240 байт**.
- *Validity Status: CONFIRMED.*

---

## 4. S7-1500
### 4.1 Архитектура и производительность
- SIMATIC S7-1500 — флагманская линейка контроллеров с высокой производительностью коммуникационного процессора.
- Поддерживает одновременную работу классического S7 Communication, Secure Open User Communication (TLS), OPC UA Server (Data Access, Alarms & Conditions) и Web-сервера.

### 4.2 Адресация Rack / Slot
- Для CPU S7-1500 адрес всегда: **Rack 0, Slot 1**.
- *Source: docs/siemens/s7-1500/82212115_s7_communication_s7-1500_en.pdf, Section 2.*

### 4.3 PDU Negotiation
- S7-1500 поддерживает согласование PDU размером до **960 байт** (в отличие от 240 байт у S7-300/1200).
- Это позволяет передавать до **930+ байт данных** в одном запросе Read Area, сокращая сетевые накладные расходы почти в 4 раза.
- *Validity Status: CONFIRMED.*

---

## 5. S7 Communication Protocol Stack
Протокол S7 Communication инкапсулируется по следующей модели:

```text
+-------------------------------------------------------+
|  Application Layer: S7 Communication (S7Comm / 0x32)   |
+-------------------------------------------------------+
|  Session Layer: ISO 8073 / RFC 905 (COTP Class 0)    |
+-------------------------------------------------------+
|  Transport Encapsulation: RFC 1006 (TPKT Header)     |
+-------------------------------------------------------+
|  Transport Layer: TCP (Port 102)                      |
+-------------------------------------------------------+
|  Network Layer: IPv4 / Industrial Ethernet            |
+-------------------------------------------------------+
```

### Фазы взаимодействия:
1. **TCP Handshake:** Установка стандартного сокета TCP к IP-адресу PLC на порт 102.
2. **COTP Connection Request (CR):**
   - Передача параметров Source TSAP (Calling TSAP) и Destination TSAP (Called TSAP).
   - Расчет TSAP: \`TSAP = (ConnectionType << 8) | (Rack << 5) | Slot\`.
   - Для PG-соединения: ConnectionType = \`0x01\`. Для OP/HMI-соединения: ConnectionType = \`0x02\` или \`0x03\`.
3. **COTP Connection Confirm (CC):**
   - PLC подтверждает класс транспорта (Class 0) и размер TPDU.
4. **S7 Communication Setup (PDU Negotiation):**
   - Клиент отправляет Function \`0xF0\` (Setup Communication) с желаемым размером PDU (например, 960 или 480 байт) и Max AMQ Caller / Callee.
   - PLC возвращает подтвержденный согласованный размер PDU.
5. **Data Exchange (Job / Ack-Data):**
   - Чтение переменных (Function \`0x04\` Read Var).
   - Запись переменных (Function \`0x05\` Write Var).

---

## 6. ISO-on-TCP (RFC 1006) & COTP (RFC 905)
### 6.1 TPKT Header (RFC 1006)
- **байт 0:** Версия (всегда \`0x03\`).
- **байт 1:** Зарезервировано (всегда \`0x00\`).
- **байт 2-3:** Общая длина пакета, включая TPKT header (16-bit Big-Endian).

### 6.2 COTP Header (RFC 905)
- **Длина заголовка (Length Indicator - LI):** 1 байт.
- **PDU Type:** \`0xE0\` (CR), \`0xD0\` (CC), \`0xF0\` (DT).
- **Data Transfer (DT):** LI = \`0x02\`, Code = \`0xF0\`, TPDU-NR + EOT = \`0x80\`.
- *Source: docs/protocol/rfc1006/rfc1006.txt and docs/protocol/rfc1006/rfc905.txt.*

---

## 7. PUT/GET Mechanism
- Механизм PUT/GET представляет собой одностороннюю (one-way) службу S7 Communication: клиент инициирует чтение (\`GET\` / Read Var) или запись (\`PUT\` / Write Var), а серверная сторона (PLC) обрабатывает запрос в фоновом системном цикле операционной системы CPU без необходимости вызова специальных коммуникационных блоков в пользовательской программе PLC.
- Для S7-300 данный механизм всегда активен.
- Для S7-1200 (FW >= 4.0) и S7-1500 (FW >= 1.5) требуется явная активация в TIA Portal:
  \`CPU Properties -> Protection & Security -> Connection mechanisms -> Permit access with PUT/GET communication from remote partner\`.
- *Source: docs/siemens/s7-1500/82212115_s7_communication_s7-1500_en.pdf, page 8.*

---

## 8. Optimized DB vs Non-Optimized (Standard) DB
### 8.1 Non-Optimized (Standard) DB
- Обладает фиксированной структурой памяти с байтовыми смещениями (Byte Offset: 0.0, 2.0, 4.0, ...).
- Доступна для адресации по прямому смещению \`DB{n}.DB{type}{offset}\` через классический протокол S7Comm.
- Обязательна для опроса контроллеров S7-1200 и S7-1500 через классические драйверы S7.

### 8.2 Optimized DB
- Переменные не имеют фиксированных байтовых смещений; компилятор TIA Portal оптимизирует размещение элементов для максимальной скорости доступа внутреннего RISC-процессора и предотвращения фрагментации памяти.
- Доступ возможен только по символьным именам через проприетарный протокол S7CommPlus (закрытый/шифрованный в новых прошивках) или через встроенный сервер **OPC UA**.
- *Вывод:* Для работы универсального классического S7-драйвера блоки данных HMI в S7-1200/1500 должны создаваться со снятым флагом "Optimized block access".
- *Source: docs/siemens/s7-1200/82212115_S7_communication_S7-1500_S7-1200_en.pdf, Section 3.2.*

---

## 9. Security Assessment (S7-1200/1500 Protection & Firewalls)
1. **Отсутствие шифрования в Classic S7Comm:**
   - Данные передаются в открытом виде по TCP/102.
   - Любое устройство в сети может перехватить трафик или отправить модифицированные пакеты.
2. **Отсутствие аутентификации пользователя:**
   - После включения PUT/GET любой клиент, знающий IP, Rack, Slot и номер DB, может выполнять чтение и запись.
3. **Рекомендуемая архитектура изоляции:**
   - Физическое или виртуальное (VLAN) разделение технологической сети (PLC VLAN) и сети верхнего уровня (HMI/SCADA VLAN).
   - Межсетевой экран (Firewall), разрешающий трафик TCP/102 *исключительно* между IP-адресом сервера SCADA и IP-адресами контроллеров.
   - Браузеры пользователей взаимодействуют исключительно с SCADA-сервером по HTTPS/WSS (TLS).
- *Source: docs/research/SECURITY.md.*

---

## 10. Data Types & Big-Endian Representation
Все контроллеры Siemens S7 используют порядок байт **Big-Endian (Motorola format)**.

| Siemens Type | Длина (бит/байт) | Диапазон / Формат | Node.js Buffer Encoding / Decoding |
| :--- | :--- | :--- | :--- |
| **BOOL** | 1 бит | 0 или 1 (false/true) | Битовая маска \`(buf[byte] & (1 << bit)) !== 0\` |
| **BYTE** | 8 бит (1 байт) | 0 .. 255 | \`buf.readUInt8(offset)\` |
| **USINT** | 8 бит (1 байт) | 0 .. 255 | \`buf.readUInt8(offset)\` |
| **SINT** | 8 бит (1 байт) | -128 .. 127 | \`buf.readInt8(offset)\` |
| **WORD** | 16 бит (2 байта) | 0 .. 65535 | \`buf.readUInt16BE(offset)\` |
| **UINT** | 16 бит (2 байта) | 0 .. 65535 | \`buf.readUInt16BE(offset)\` |
| **INT** | 16 бит (2 байта) | -32768 .. 32767 | \`buf.readInt16BE(offset)\` |
| **DWORD** | 32 бит (4 байта) | 0 .. 4294967295 | \`buf.readUInt32BE(offset)\` |
| **UDINT** | 32 бит (4 байта) | 0 .. 4294967295 | \`buf.readUInt32BE(offset)\` |
| **DINT** | 32 бит (4 байта) | -2147483648 .. 2147483647 | \`buf.readInt32BE(offset)\` |
| **REAL** | 32 бит (4 байта) | IEEE 754 Single Float | \`buf.readFloatBE(offset)\` |
| **LREAL** | 64 бит (8 байт) | IEEE 754 Double Float | \`buf.readDoubleBE(offset)\` |
| **CHAR** | 8 бит (1 байт) | ASCII символ | \`String.fromCharCode(buf.readUInt8(offset))\` |
| **STRING** | 2 + N байт | S7 Header: [MaxLen, ActLen] + N chars | \`buf.toString('latin1', offset + 2, offset + 2 + actLen)\` |

---

## 11. PDU и производительность (Batching & Merging)
- Запрос 1 тега отдельным TCP-пакетом создает накладные расходы в 20–40 раз больше размера полезных данных.
- **Алгоритм оптимизации:**
  1. Группировка тегов по PLC.
  2. Группировка по типу области (DB, M, I, Q) и номеру блока DB.
  3. Сортировка по возрастанию смещения байт.
  4. Объединение соседних диапазонов: если зазор между тегами меньше порога накладных расходов заголовка (обычно <= 16 байт), диапазон объединяется в один непрерывный блок.
  5. Разделение полученных диапазонов на фрагменты, не превышающие максимальный размер PDU.
  6. Формирование Multi-Variable Read пакета (до 20 несвязанных элементов в одном запросе).
- *Source: docs/research/PERFORMANCE.md.*

---

## 12. Анализ библиотек
Детальный сравнительный анализ представлен в документе [LIBRARY_COMPARISON.md](file:///docs/research/LIBRARY_COMPARISON.md).
- Исследованы: \`nodes7\` (plcpeople), \`@st-one-io/nodes7\`, \`Snap7\` / \`node-snap7\`, \`node-snap7js\`, \`Apache PLC4X\`, \`node-opcua\`.

---

## 13. Рекомендуемая библиотека и технологический выбор
- **Выбор ядра:** Чистая реализация протокола на TypeScript/Node.js (\`plc-s7\` на базе чистого асинхронного сокета TCP/RFC 1006/COTP с архитектурным заимствованием принципов \`nodes7\`), оформленная в виде модульного драйвера, реализующего единый интерфейс \`IPlcDriver\`.
- **Обоснование:**
  1. 100% переносимость: отсутствие native C++ биндингов исключает проблемы с компиляцией на Windows, Linux, Alpine, ARM64 (Raspberry Pi, industrial IPC), Docker.
  2. Полный контроль над асинхронным жизненным циклом, тайм-аутами и Reconnect State Machine.
  3. MIT-совместимость без лицензионных рисков GPL-заражения коммерческого кода.
  4. Поддержка строгой типизации TypeScript.

---

## 14. Альтернативные варианты (S7CommPlus & OPC UA)
- **S7CommPlus:** Проприетарный протокол Siemens для символьного доступа к S7-1200/1500. В новых версиях прошивок (TIA V17+ FW >= 2.9 / 4.5) протокол использует криптографические подписи и TLS-сертификаты с привязкой к оборудованию (Session Key Handshake), что делает его нестабильным для open-source реверс-инжиниринга.
- **OPC UA:** Официальный промышленный стандарт. S7-1500 (и S7-1200 с FW >= 4.4) имеют встроенный OPC UA Server. Поддерживает символьный доступ к Optimized DB, сертификаты безопасности, шифрование и стандартизированную модель данных. В архитектуре сервера выделен драйвер \`OpcUaDriver\` для последующей реализации.

---

## 15. Производственные риски и меры снижения
1. **Риск случайной записи физических выходов или сбоя процесса:**
   - По умолчанию запись отключена (\`WRITE_ENABLED=false\`).
   - Dry-Run режим.
   - Проверка границ значений (Min / Max / Datatype).
   - Логирование всех операций записи с указанием источника, старого и нового значений.
2. **Риск потери связи и зависания очереди:**
   - Тайм-ауты на каждый сетевой запрос (Read/Write Timeout = 2000 ms).
   - Backoff-стратегия переподключения (1s, 2s, 5s, 10s, 30s max).
   - Немедленный перевод всех тегов в статус качества \`DISCONNECTED\` / \`BAD\` при обрыве TCP.
3. **Риск непоследовательного считывания связанных данных (Data Inconsistency):**
   - Документирование применения буферных DB с флагом транзакции (Sequence counter / Handshake bit).

---

## 16. Рекомендуемая архитектура сервера
- Модульная архитектура Monorepo:
  - \`packages/plc-core\`: Базовые типы, интерфейс \`IPlcDriver\`, \`TagCache\`, \`Quality\`, \`PollingEngine\`, \`WriteManager\`.
  - \`packages/plc-s7\`: Реализация \`S7ClassicDriver\` (RFC 1006, COTP, S7Comm PDU Builder, PDU Optimizer, Data Types Encoders/Decoders).
  - \`packages/tag-model\`: Модель конфигурации PLC и Tag Catalog с валидацией адресов и диапазонов.
  - \`apps/plc-server\`: Исполняемый сервер на Fastify/Express + WebSocket, REST API, structured logging (Pino), сбор диагностических метрик.
`;

fs.writeFileSync('docs/research/S7_COMMUNICATION_RESEARCH.md', researchContent, 'utf-8');
console.log('docs/research/S7_COMMUNICATION_RESEARCH.md successfully generated');
