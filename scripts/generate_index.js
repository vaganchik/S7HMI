const fs = require('fs');

const indexContent = `# Industrial S7 Knowledge & Engineering Index

This index maps technical PLC communication concepts, protocol requirements, and architectural mechanisms to the authoritative documentation stored locally in this repository.

---

## 1. PLC Connection & Hardware Addressing

### S7-300 (Modular S7-300 Architecture)
- **CPU Direct Interface (PN-CPU):** Rack \`0\`, Slot \`2\`
- **Communications Processor (CP 343-1):** Rack \`0\`, Slot \`4\` (or slot of CP module in rack 0)
- **Protocol:** S7 Communication over ISO-on-TCP (RFC 1006 / COTP Class 0).
- **Default Port:** TCP port \`102\`
- **Local Sources:**
  - [CP 343-1 Manual Part B](file:///docs/siemens/s7-300/GH_CP343-1-EX30_72.pdf)
  - [S7 Communication with PUT/GET S7-300](file:///docs/siemens/s7-300/82212115_S7_communication_S7-300_Sequencer_en.pdf)
  - [S7-300 HMI Configuration Guide](file:///docs/siemens/S7_300_CONFIGURATION_FOR_HMI.md)

### S7-1200 (Compact S7-1200 Architecture)
- **CPU Interface:** Rack \`0\`, Slot \`1\`
- **Protocol:** S7 Communication over ISO-on-TCP (RFC 1006).
- **TSAP Rules:** Local TSAP \`0x03.01\` (or \`0x01.00\` for PG/OP), Remote TSAP \`0x03.00\` / \`0x03.01\`
- **Local Sources:**
  - [S7 Communication with PUT/GET S7-1500/1200](file:///docs/siemens/s7-1200/82212115_S7_communication_S7-1500_S7-1200_en.pdf)
  - [S7-1200 / S7-1500 Configuration Guide](file:///docs/siemens/S7_1200_1500_CONFIGURATION_FOR_HMI.md)

### S7-1500 (Advanced S7-1500 Architecture)
- **CPU Interface:** Rack \`0\`, Slot \`1\`
- **Protocol:** S7 Communication over ISO-on-TCP (RFC 1006) or OPC UA.
- **Local Sources:**
  - [S7-1500 Communication Function Manual](file:///docs/siemens/s7-1500/82212115_s7_communication_s7-1500_en.pdf)
  - [S7-1200 / S7-1500 Configuration Guide](file:///docs/siemens/S7_1200_1500_CONFIGURATION_FOR_HMI.md)

---

## 2. Protocol Stack (ISO-on-TCP & S7Comm)

### Layer 4 / Encapsulation: RFC 1006 (TPKT)
- **Header:** 4 bytes [\`0x03\`, \`0x00\`, \`Length_High\`, \`Length_Low\`]
- **Port:** TCP \`102\`
- **Source:** [RFC 1006 Specification](file:///docs/protocol/rfc1006/rfc1006.txt)

### Layer 5 / Session: ISO 8073 / RFC 905 (COTP Class 0)
- **Connection Request (CR):** Code \`0xE0\`, Parameter \`0xC1\` (Calling TSAP), Parameter \`0xC2\` (Called TSAP), Parameter \`0xC0\` (TPDU Size).
- **Connection Confirm (CC):** Code \`0xD0\`
- **Data Transfer (DT):** Code \`0xF0\`, EOT flag (\`0x80\`)
- **Source:** [RFC 905 Specification](file:///docs/protocol/rfc1006/rfc905.txt)

### Layer 7 / Application: S7Comm
- **Protocol ID:** \`0x32\`
- **Message Types (ROSCTR):**
  - \`0x01\`: Job (Client Request)
  - \`0x02\`: Ack (PLC Acknowledge without data)
  - \`0x03\`: Ack-Data (PLC Response with payload)
  - \`0x07\`: UserData (Diagnostics, SZL reads)
- **Function Codes:**
  - \`0xF0\`: Setup Communication (PDU negotiation)
  - \`0x04\`: Read Variable
  - \`0x05\`: Write Variable
- **Memory Area Codes:**
  - \`0x84\`: DB (Data Block)
  - \`0x83\`: Flags / Merker (M)
  - \`0x81\`: Inputs (I / E - Eingang)
  - \`0x82\`: Outputs (Q / A - Ausgang)
  - \`0x1C\`: Counters (C / Z - Zähler)
  - \`0x1D\`: Timers (T)
- **Sources:**
  - [Wireshark S7comm Dissector](file:///docs/protocol/s7comm/packet-s7comm.c)
  - [Wireshark S7comm Header](file:///docs/protocol/s7comm/packet-s7comm.h)

---

## 3. Siemens Memory Architecture & Data Types

### Memory Addressing Syntax
- **Data Blocks:** \`DB{number}.DB{type}{byte}[.bit]\` (e.g., \`DB100.DBX0.0\`, \`DB100.DBB2\`, \`DB100.DBW4\`, \`DB100.DBD6\`)
- **Merker / Flags:** \`M{byte}.{bit}\`, \`MB{byte}\`, \`MW{byte}\`, \`MD{byte}\`
- **Inputs:** \`I{byte}.{bit}\`, \`IB{byte}\`, \`IW{byte}\`, \`ID{byte}\`
- **Outputs:** \`Q{byte}.{bit}\`, \`QB{byte}\`, \`QW{byte}\`, \`QD{byte}\`

### Endianness & Data Encoding
- **Byte Order:** Big-Endian (Motorola format / Network byte order) throughout all Siemens S7 CPUs.
- **Elementary Types:**
  - \`BOOL\`: 1 bit. In Bit Read/Write, Transport Size = \`0x01\` (BIT). In Byte/DB block reads, extracted from byte.
  - \`BYTE\` / \`USINT\`: 1 byte unsigned (0..255).
  - \`SINT\`: 1 byte signed (-128..127).
  - \`WORD\` / \`UINT\`: 2 bytes unsigned (0..65535, Big-Endian).
  - \`INT\`: 2 bytes signed (-32768..32767, Big-Endian two's complement).
  - \`DWORD\` / \`UDINT\`: 4 bytes unsigned (0..4294967295, Big-Endian).
  - \`DINT\`: 4 bytes signed (-2147483648..2147483647, Big-Endian two's complement).
  - \`REAL\`: 4 bytes IEEE 754 Single Precision Floating Point (Big-Endian).
  - \`LREAL\`: 8 bytes IEEE 754 Double Precision Floating Point (Big-Endian).
  - \`CHAR\`: 1 byte ASCII character.
  - \`STRING\`: S7 String header (Byte 0 = Max length, Byte 1 = Actual length) followed by actual characters.
- **Source:** [Research Report Section 10](file:///docs/research/S7_COMMUNICATION_RESEARCH.md#10-data-types)

---

## 4. Hardware Configuration & Security Requirements

### S7-1200 / S7-1500 PUT/GET Authorization
- **Requirement:** TIA Portal CPU Properties -> *Protection & Security* -> *Connection mechanisms* -> check **"Permit access with PUT/GET communication from remote partner"**.
- **Reason:** Firmware >= V4.0 (S7-1200) and >= V1.5 (S7-1500) disables PUT/GET by default for cybersecurity.
- **Source:** [S7-1200/1500 HMI Configuration](file:///docs/siemens/S7_1200_1500_CONFIGURATION_FOR_HMI.md)

### Optimized Block Access
- **Requirement:** Data Blocks accessed via Classic S7Comm absolute addressing must have **"Optimized block access" disabled** (Standard DB with defined byte offsets).
- **Reason:** Optimized DBs randomize/reorder internal memory allocations, omit standard byte offsets, and require symbolic access via S7CommPlus or OPC UA.
- **Source:** [Research Report Section 8](file:///docs/research/S7_COMMUNICATION_RESEARCH.md#8-optimized-db)

---

## 5. Polling Engine, PDU Optimization & Data Consistency

### PDU Negotiation & Multi-Variable Limits
- **S7-300 / CP 343-1:** PDU size is typically \`240\` bytes. Max data payload per read response ~ \`222\` bytes.
- **S7-1200:** PDU size is \`240\` bytes.
- **S7-1500:** PDU size can negotiate up to \`960\` bytes.
- **Optimization Strategy:** Contiguous memory reads merged into range requests; disjoint requests batched up to max items per PDU (typically 20 items per request).
- **Source:** [Performance & Polling Guide](file:///docs/research/PERFORMANCE.md)

### Data Consistency (Siemens Atomicity)
- Elementary types up to 32 bits (BOOL, BYTE, WORD, DWORD, INT, REAL) are read/written consistently by CPU microcode.
- Multi-byte structures or correlated process variables across different DB offsets are not atomically synchronized across PLC cycle boundaries without handshake mechanisms (Sequence counter / Lock byte pattern).
- **Source:** [Research Report Section 11 & 16](file:///docs/research/S7_COMMUNICATION_RESEARCH.md)

---

## 6. Architectural Decision Records (ADRs)

1. [ADR-001: Selection of S7 Communication Driver](file:///docs/adr/ADR-001-plc-driver-library.md)
2. [ADR-002: Canonical Tag Model & Address Representation](file:///docs/adr/ADR-002-tag-model.md)
3. [ADR-003: Multi-PLC Polling Engine & PDU Batch Optimization](file:///docs/adr/ADR-003-polling-strategy.md)
4. [ADR-004: Industrial Write Security & Command Pipeline](file:///docs/adr/ADR-004-write-security.md)
5. [ADR-005: S7 Classic vs. Symbolic / OPC UA Evolution](file:///docs/adr/ADR-005-s7classic-vs-symbolic.md)
`;

fs.writeFileSync('docs/INDEX.md', indexContent, 'utf-8');
console.log('docs/INDEX.md successfully generated');
