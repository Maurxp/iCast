# Upstream Legal & Intellectual Property Audit — Mission R0.1

## 1. Upstream Project Provenance

- **Original Project Name**: webOS IPTV Player
- **Upstream Repository URL**: `https://github.com/lennylxx/webos-iptv-player`
- **Original Author / Licensor**: Lenny (`lennylxx`)
- **Primary License**: Apache License, Version 2.0 (January 2004)
- **Copyright Statement**: `Copyright 2026 lennylxx`

---

## 2. Legal Analysis of Apache License 2.0

The Apache License 2.0 is a permissive open-source license that grants users broad rights to use, modify, reproduce, and distribute the work and derivative works in source or binary form, subject to explicit statutory obligations.

### 2.1 Core Permissions
- **Commercial Use**: Permitted without royalty.
- **Modification**: Permitted. Derivative works can be authored and maintained independently.
- **Distribution**: Permitted in source and binary (e.g. webOS `.ipk`) format.
- **Sublicensing**: Permitted for derivative contributions.
- **Patent Grant**: Contributors grant an express patent license for their contributions.

### 2.2 Statutory Obligations for Derivative Works (Section 4)

When forking and distributing **iCast** as a derivative work of webOS IPTV Player, Section 4 mandates:

| Section | Statutory Requirement | Compliance Implementation in iCast |
| :--- | :--- | :--- |
| **4.a** | Must provide recipients with a copy of the License. | Retain full Apache-2.0 text in root `LICENSE`. |
| **4.b** | Must cause modified files to carry prominent notices stating changes. | Document modifications in `CHANGELOG.md`, `NOTICE`, and mission reports. |
| **4.c** | Must retain all copyright, patent, and attribution notices. | Retain `Copyright 2026 lennylxx` intact in `LICENSE` and add iCast attribution. |
| **4.d** | Must include a readable copy of attribution notices in a `NOTICE` file. | Create formal root `NOTICE` file documenting upstream origin and attribution. |
| **6.0** | Trademarks: Does not grant trademark permissions. | Rebranding from "webOS IPTV Player" to "iCast" is legally proactive and avoids trademark conflict. |

---

## 3. Third-Party Code, Libraries & Assets Inventory

An audit of all bundled third-party dependencies was conducted:

| Component | Upstream Origin / Author | Declared License | Distribution Location | Compliance Status |
| :--- | :--- | :--- | :--- | :--- |
| **Shaka Player** | Google LLC | Apache-2.0 | `vendor/shaka/` / dist | Clean (Preserves `licenses/shaka-player.txt`) |
| **CML-CMCD** | Streaming Video Tech Alliance | Apache-2.0 | Embedded in Shaka | Clean (`licenses/shaka-cml-cmcd.txt`) |
| **assjs / ass-compiler** | Zhenye Wei (`weizhenye`) | MIT | In-manifest bundle | Clean (`licenses/assjs.txt`, `ass-compiler.txt`) |
| **fflate** | 101arrowz | MIT | npm bundle | Clean (`licenses/fflate.txt`) |
| **iso-639-1** | Mei Qingguang | MIT | npm bundle | Clean (`licenses/iso-639-1.txt`) |
| **qrcode-generator** | Kazuhiko Arase | MIT | npm bundle | Clean (`licenses/qrcode-generator.txt`) |
| **Twemoji SVGs** | Twitter / JDecked | CC-BY 4.0 (Graphics) | 17 category icons | Clean (`licenses/twemoji.txt`, attribution in docs) |
| **LG Smart UI Font** | LG Electronics | System ROM Font | CSS reference only | Clean (Not redistributed; uses on-device system font) |

---

## 4. Proposed Legal Document Structure for iCast

To achieve 100% legal compliance and transparency, the repository must include:

### 4.1 Updated `LICENSE`
Preserve the complete Apache 2.0 text with dual copyright notice:
```text
Copyright 2026 lennylxx
Copyright 2026 iCast contributors (Maurxp and contributors)

Licensed under the Apache License, Version 2.0 (the "License");
...
```

### 4.2 New Root `NOTICE`
```text
iCast
Copyright 2026 iCast Contributors
https://github.com/Maurxp/iCast

This product is based on and includes software developed by
lennylxx (https://github.com/lennylxx/webos-iptv-player).
Copyright 2026 lennylxx.

This product includes software developed by Google LLC (Shaka Player).
This product includes software developed by Streaming Video Technology Alliance.
This product includes artwork from Twemoji (CC-BY 4.0).
```

### 4.3 README Acknowledgments
Every README must feature a dedicated **"Acknowledgments & Upstream Attribution"** section prominently thanking Lenny for the original foundation.

