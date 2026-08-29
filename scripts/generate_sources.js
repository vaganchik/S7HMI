const fs = require('fs');
const path = require('path');

const sourcesContent = `# Documentation Sources Catalog

This catalog documents all official manuals, RFC standards, protocol specifications, application guides, and open-source library sources collected and used for the S7 Communication Server development.

---

## 1. Siemens Official Manuals & Application Examples

### 1.1 S7 Communication with PUT/GET (Application Example)
- **Title:** How do you configure and program an S7 connection and the "PUT" and "GET" instructions for data transfer between two S7 CPUs?
- **Vendor / Author:** Siemens AG (Industry Online Support)
- **Document ID / Entry ID:** 82212115
- **Revision:** Version 2.0 (05/2016)
- **Published:** 2016-05
- **URLs:**
  - Entry: https://support.industry.siemens.com/cs/document/82212115/
  - S7-1500 PDF: https://cache.industry.siemens.com/dl/files/115/82212115/att_108330/v2/82212115_s7_communication_s7-1500_en.pdf
  - S7-1500 & S7-1200 PDF: https://cache.industry.siemens.com/dl/files/115/82212115/att_1039292/v2/82212115_S7_communication_S7-1500_S7-1200_en.pdf
  - S7-300 Sequencer PDF: https://cache.industry.siemens.com/dl/files/115/82212115/att_1039290/v2/82212115_S7_communication_S7-300_Sequencer_en.pdf
- **Access Date:** 2026-08-28
- **Local Files & SHA256:**
  - docs/siemens/s7-1500/82212115_s7_communication_s7-1500_en.pdf (878,724 bytes)  
    SHA256: 42e7565d96e58be4ed49b66f08c53ef75de85981ee9f458e613509d31aad6f4a
  - docs/siemens/s7-1200/82212115_S7_communication_S7-1500_S7-1200_en.pdf (1,177,641 bytes)  
    SHA256: dea4c423458504314addcc73f12ee813ec3e5ef2890323bd340eecfbc881e291
  - docs/siemens/s7-300/82212115_S7_communication_S7-300_Sequencer_en.pdf (1,023,296 bytes)  
    SHA256: f8de75e0821ebdf33e52bc63d1d16dce1af2d34219cc2bfe8fcd473e37c9ab66
- **Usage:** Basis for S7 PUT/GET communication requirements, passive CPU server configuration, standard DB formatting, TSAP definitions, and TIA Portal security flags.
- **Validity Status:** CONFIRMED.

---

### 1.2 S7-1500 / ET 200 Communication (Function Manual)
- **Title:** SIMATIC S7-1500, ET 200MP, ET 200SP, ET 200AL, ET 200pro, ET 200eco PN Communication Function Manual
- **Vendor / Author:** Siemens AG
- **Document ID / Entry ID:** 59192925 (Doc ID: A5E03735815)
- **Published:** 2023 / 2024
- **URL:** https://support.industry.siemens.com/cs/document/59192925/
- **Access Date:** 2026-08-28
- **Usage:** Analysis of S7-1500 connection resources, PG/HMI communication channels, PDU size limits (up to 960 bytes negotiated), Secure Open User Communication (TLS), and OPC UA server options.
- **Validity Status:** CONFIRMED.

---

### 1.3 S7-1200 System Manual
- **Title:** SIMATIC S7-1200 Programmable Controller System Manual
- **Vendor / Author:** Siemens AG
- **Document ID / Entry ID:** 109797241 (Doc ID: A5E02486680)
- **Published:** 2021 / 2024
- **URL:** https://support.industry.siemens.com/cs/document/109797241/
- **Access Date:** 2026-08-28
- **Usage:** S7-1200 rack/slot specifications (Rack 0, Slot 1), TSAP settings (0x03.01 for client, 0x03.00 for server), standard DB offset alignment, PDU size constraints (240 bytes).
- **Validity Status:** CONFIRMED.

---

### 1.4 S7-300 Communication & CP 343-1 Manual
- **Title:** SIMATIC NET: S7-300 – Industrial Ethernet CP 343-1 Manual Part B
- **Vendor / Author:** Siemens AG
- **Document ID / Entry ID:** 24485272 (Doc ID: C79000-G8900-C201)
- **Published:** 2011 / 2018
- **URL:** https://cache.industry.siemens.com/dl/files/272/24485272/att_973781/v1/GH_CP343-1-EX30_72.pdf
- **Access Date:** 2026-08-28
- **Local File & SHA256:**
  - docs/siemens/s7-300/GH_CP343-1-EX30_72.pdf (773,860 bytes)  
    SHA256: 60baacfdb012f06d44ab926af65477e81d36e4e12d8123cfc5a653a627aa9663
- **Usage:** S7-300 CPU slot assignment (Rack 0, Slot 2 for CPU; Slot 4+ for CP343-1), connection limits, PDU size limitations (240 / 480 bytes max), and routing via CP backplane bus.
- **Validity Status:** CONFIRMED.

---

## 2. Standards & RFCs

### 2.1 RFC 1006 (ISO Transport Service on top of the TCP)
- **Title:** ISO Transport Services on top of the TCP (Version: 3)
- **Vendor / Author:** M.T. Rose, D.E. Cass (IETF Network Working Group)
- **Document ID:** RFC 1006 / STD 35
- **Published:** May 1987
- **URL:** https://www.rfc-editor.org/rfc/rfc1006.txt
- **Access Date:** 2026-08-28
- **Local File & SHA256:**
  - docs/protocol/rfc1006/rfc1006.txt (30,798 bytes)  
    SHA256: 855adb9556880a3c71fb24c79f174026e763ff02b1ec19d7248a5a2005883f53
- **Usage:** Defines TPKT header format (4 bytes: 0x03, Reserved 0x00, Length 2 bytes Big-Endian), encapsulation over TCP Port 102.
- **Validity Status:** CONFIRMED.

---

### 2.2 RFC 905 (ISO Connection Oriented Transport Protocol - COTP)
- **Title:** ISO Transport Protocol Specification (ISO DP 8073)
- **Vendor / Author:** ISO / IETF Network Working Group
- **Document ID:** RFC 905
- **Published:** April 1984
- **URL:** https://www.rfc-editor.org/rfc/rfc905.txt
- **Access Date:** 2026-08-28
- **Local File & SHA256:**
  - docs/protocol/rfc1006/rfc905.txt (249,214 bytes)  
    SHA256: b15fd8a58189016a039c3409eb8f4cd1d9e02d10d9bc2a6fda6a5b5179e084bd
- **Usage:** Defines COTP TPDU types: Connection Request (CR, 0xE0), Connection Confirm (CC, 0xD0), Data Transfer (DT, 0xF0), Calling/Called TSAP parameter encoding (0xC1, 0xC2), TPDU Size (0xC0).
- **Validity Status:** CONFIRMED.

---

## 3. Protocol Dissectors & Specifications

### 3.1 Wireshark S7comm Dissector
- **Title:** Wireshark S7 Communication Protocol Dissector (packet-s7comm.c, packet-s7comm.h, packet-s7comm_szl_ids.h)
- **Vendor / Author:** Wireshark Development Team / Thomas Wiens
- **Published:** Open Source (GPL-2.0-or-later)
- **URL:** https://raw.githubusercontent.com/wireshark/wireshark/master/epan/dissectors/packet-s7comm.c
- **Access Date:** 2026-08-28
- **Local Files & SHA256:**
  - docs/protocol/s7comm/packet-s7comm.c (483,085 bytes)  
    SHA256: 0ddad2cf57a6758e008157bd0a33868b7b980fa7d9bf6fbd3ab942c6ce773691
  - docs/protocol/s7comm/packet-s7comm.h (2,754 bytes)  
    SHA256: 83e986145860567779d8a4df29f03226077513811dc4bd2f3165cca807efee4c
  - docs/protocol/s7comm/packet-s7comm_szl_ids.h (861 bytes)  
    SHA256: 98a69207e6e1bb05016ee8aff41fc07f12c1b22826579b662f7e6e832a5f364a
- **Usage:** Exhaustive reference for S7Comm PDU layout: Header (0x32), ROSCTR (1=Job, 2=Ack, 3=Ack-Data, 7=UserData), Parameter Functions (0x04 Read Var, 0x05 Write Var, 0xF0 Setup Comm), Syntax IDs, Memory Area IDs (0x84 DB, 0x83 Merker, 0x81 Inputs, 0x82 Outputs), Item Return Codes (0xFF Success, 0x05 Address out of range, 0x0A Object does not exist).
- **Validity Status:** CONFIRMED.

---

## 4. Open-Source Library Repositories & Sources

### 4.1 plcpeople/nodeS7 (nodes7)
- **Title:** Routine to communicate with Siemens S7 PLCs
- **Repository:** https://github.com/plcpeople/nodeS7
- **Version / Commit:** v0.3.18
- **License:** MIT
- **Local Files & SHA256:**
  - docs/libraries/nodes7/plcpeople_nodeS7_README.md (10,960 bytes)  
    SHA256: a2fabfb6a90a807f77b13bedef750263c70406a458244ade1acab86491126776
  - docs/libraries/nodes7/plcpeople_nodeS7.js (113,058 bytes)  
    SHA256: a10b18982ee42eafb0547b3247ac03938b3b31bd2b60df7eb0804b9a019263e2
- **Usage:** Pure JS reference for S7 item translation, PDU optimization (merging contiguous offsets), and binary variable decoding.
- **Validity Status:** CONFIRMED.

---

### 4.2 @st-one-io/nodes7
- **Title:** Modern JavaScript library to communicate with Siemens S7 PLCs
- **Repository:** https://github.com/st-one-io/nodes7
- **Version:** v1.1.2
- **License:** GPL-3.0-or-later
- **Local Files & SHA256:**
  - docs/libraries/nodes7/st-one-io_nodes7_README.md (2,197 bytes)  
    SHA256: aeb0f40d8000683322b13617066e0f8d4ecde4300c553640e79b7016e23a8123
  - docs/libraries/nodes7/st-one-io_index.js (677 bytes)  
    SHA256: dec98852cceee89bf7f3fed2992a8578b9334b0a8c00da472d18aa87f6dcc29f
  - docs/libraries/nodes7/st-one-io_s7connection.js (27,057 bytes)  
    SHA256: 5760de43f67861e7d5fc8e278bb79e8c65e3fc10f758b82ec83a5855606df68d
  - docs/libraries/nodes7/st-one-io_s7endpoint.js (37,488 bytes)  
    SHA256: 575865adf86ae4b9f66b176a93397bee9fe72ef70be2567f3208a15b003a7214
  - docs/libraries/nodes7/st-one-io_s7item.js (19,885 bytes)  
    SHA256: 395e21751160bb6f39a3d59705d2c77944469d33335bbaa7a39d23750a2f83c1
  - docs/libraries/nodes7/st-one-io_s7itemGroup.js (24,014 bytes)  
    SHA256: ae71d7545a88d68c7083ac9185bf270a02371fff579c36e338fa9f12b0f418d5
  - docs/libraries/nodes7/st-one-io_s7parser.js (19,999 bytes)  
    SHA256: 9689aa10e2e8d4529d89f9e165be4bb83a7db8c3367fa62d2061d1ff30c7d5ff
  - docs/libraries/nodes7/st-one-io_s7serializer.js (15,043 bytes)  
    SHA256: c3a7ffe628375b01e27ab5a904450935053e3e3f31d0f53c291b18622a39b627
  - docs/libraries/nodes7/st-one-io_addressParser.js (13,998 bytes)  
    SHA256: 144abe38dfa9c0992fd09f0f88283c56ef7b86eeaf723e7a4f5acd6461dac0c2
  - docs/libraries/nodes7/st-one-io_constants.json (62,699 bytes)  
    SHA256: d6170c7d7162fe742fcc0c5035430258fb9cdca9c8b8e15b468b95a30ca105bb
  - docs/libraries/nodes7/st-one-io_errors.js (3,020 bytes)  
    SHA256: 59d7b2b5c112f965ecba09c8d479f4453bb8ee327fabdecc6587a7e176e0d420
- **Usage:** Promise-based architecture reference, ISO-on-TCP framing, item grouping.
- **Validity Status:** CONFIRMED. Note: License is GPL-3.0; architectural design and custom implementations must avoid license contagion.

---

### 4.3 Snap7 & node-snap7
- **Title:** Snap7 C/C++ Ethernet Communication Suite & Node.js Bindings
- **Repository:** https://github.com/SCADACS/snap7 and https://github.com/mathiask88/node-snap7
- **Version:** Snap7 v1.4.2 / node-snap7 v1.0.9
- **License:** LGPL-3.0 / MIT
- **Local Files & SHA256:**
  - docs/libraries/snap7/snap7_README.md (472 bytes)  
    SHA256: 099687ba5d7dc0957205c2f224b3e64309c9787d6c8514f912600c203ba6384a
  - docs/libraries/snap7/snap7.h (40,997 bytes)  
    SHA256: 98458bbc74838d3f31ebd16b91cac973597577901ba232f504007851b1bf7d4a
  - docs/libraries/snap7/node-snap7_README.md (3,879 bytes)  
    SHA256: 7c97cdc8b13bdfc3633097eacd02b75a71366c5bf6bb4661100e482c185b54f6
  - docs/libraries/snap7/node-snap7_client.md (36,541 bytes)  
    SHA256: 07a25bd1e89acf50724901c1f07c7dd09736c69d94d618f2b08437df713f6b95
  - docs/libraries/snap7/node-snap7_server.md (11,833 bytes)  
    SHA256: 2d341ddfd3800eaf7b91dea39ff996038cf693aaef44e9de3b1fd1c13245e56f
  - docs/libraries/snap7/node-snap7.js (2,166 bytes)  
    SHA256: 173f9be278d768eda70ae5cb92e7902acf44513a54bb0799320e1d67f6af1ae7
  - docs/libraries/snap7/node-snap7_binding.gyp (2,516 bytes)  
    SHA256: da7c4f8d7f4fd5abca9f67a879117c5115844822b3dc157c4d8597dcf12fc779
- **Usage:** In-depth evaluation of native C/C++ Snap7 client/server capabilities, MultiRead/MultiWrite operations, TSAP construction, and native compilation risks.
- **Validity Status:** CONFIRMED.
`;

fs.writeFileSync('docs/SOURCES.md', sourcesContent, 'utf-8');
console.log('docs/SOURCES.md successfully generated');
