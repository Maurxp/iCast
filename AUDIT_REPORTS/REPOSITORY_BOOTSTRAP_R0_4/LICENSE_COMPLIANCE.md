# AUDIT REPORT: LICENSE & STATUTORY COMPLIANCE (MISSION R0.4)

> **Project**: iCast (webOS IPTV Player)  
> **Original Upstream**: `https://github.com/lennylxx/webos-iptv-player.git`  
> **Original Author**: Lenny (`lennylxx`)  
> **Derivative Work Author**: iCast Contributors (`Maurxp`)  
> **Primary License**: Apache License, Version 2.0 (January 2004)  
> **Date**: October 31, 2026  
> **Status**: **100% STATUTORY COMPLIANCE CONFIRMED**  

---

## 1. Statutory Framework: Apache License 2.0

The upstream repository is licensed under the **Apache License, Version 2.0**. As a derivative work incorporating substantial enhancements (Monochrome Prism design system, Obsidian/Porcelain themes, hardened RFC1918 LAN services, and TypeScript test typing), **iCast** must comply with all requirements set forth in Section 4 (*Redistribution*):

```
+-----------------------------------------------------------------------------------+
|                        APACHE LICENSE 2.0 STATUTORY AUDIT                         |
+-----------------------------------------------------------------------------------+
| Requirement             | Obligation                                 | Status     |
+-------------------------+--------------------------------------------+------------+
| Section 4(a)            | Provide a copy of the License.             | SATISFIED  |
| Section 4(b)            | State prominently that files were modified.| SATISFIED  |
| Section 4(c)            | Retain all original copyright notices.     | SATISFIED  |
| Section 4(d)            | Distribute readable NOTICE file.           | SATISFIED  |
| Section 6 (Trademarks)  | No unauthorized use of licensor's marks.   | SATISFIED  |
+-------------------------+--------------------------------------------+------------+
```

---

## 2. File-by-File License Audit

### 2.1. Root `LICENSE`
* **Integrity of Terms**: Sections 1 through 9 of the Apache 2.0 text are preserved **100% verbatim**, with zero alterations, deletions, or synthetic clauses.
* **Appendix Attribution**:
  ```text
  END OF TERMS AND CONDITIONS

  Copyright 2026 lennylxx
  Copyright 2026 iCast contributors (https://github.com/Maurxp/iCast)

  Licensed under the Apache License, Version 2.0 (the "License");
  ...
  ```
* **Statutory Justification**: Section 4 permits the addition of the contributor's copyright statement to their modifications. Placing the dual copyright in the appendix strictly preserves the body of the license while unambiguously acknowledging both original and derivative authorship.

### 2.2. Root `NOTICE`
The official Apache 2.0 `NOTICE` file was created in the root directory:
```text
iCast
Copyright 2026 iCast Contributors
https://github.com/Maurxp/iCast

This product is a derivative work based on webOS IPTV Player developed by
lennylxx (https://github.com/lennylxx/webos-iptv-player).
Copyright 2026 lennylxx.

This product includes software developed by Google LLC (Shaka Player).
Copyright 2016 Google LLC. Licensed under the Apache License, Version 2.0.

This product includes software developed by the Streaming Video Technology
Alliance (Common Media Library CMCD).
Copyright 2023 Streaming Video Technology Alliance. Licensed under the Apache License, Version 2.0.

This product includes artwork from Twemoji.
Copyright 2020 Twitter, Inc and other contributors.
Licensed under Creative Commons Attribution 4.0 International (CC-BY 4.0).

For full third-party notices and licenses, see THIRD_PARTY_NOTICES.txt
and the licenses/ directory.
```
* **Statutory Justification**: Complies with Section 4(d) by maintaining attribution notices in a distinct `NOTICE` file that does not modify the terms of the license.

### 2.3. Root `README.md`
* Section 8 (*Acknowledgments & Upstream Heritage*) acknowledges Lenny's original repository (`https://github.com/lennylxx/webos-iptv-player`), explicitly stating that iCast is an independent derivative work developed under Apache 2.0.

### 2.4. Third-Party Licenses (`THIRD_PARTY_NOTICES.txt` & `licenses/`)
All third-party notices bundled with the upstream application have been preserved in their original directories:
* `licenses/shaka-player.txt` (Apache-2.0)
* `licenses/cmcd-validator.txt` (Apache-2.0)
* `licenses/twemoji.txt` (CC-BY-4.0)
* `licenses/ass-compiler.txt` (MIT)

---

## 3. Trademark Disclaimers (Section 6)

* **iCast Brand Identity**: The adoption of the name **iCast** and the **Monochrome Prism** vector icon eliminates any trademark ambiguity with LG Electronics (`webOS`) or Lenny's original repository (`webOS IPTV Player`).
* **Preservation of Platform ID**: The technical identifier `com.lennylxx.iptv` is retained exclusively within `appinfo.json` for internal webOS application runtime sandbox continuity (preventing user data loss on physical TVs). It is not utilized as a public-facing product name or trademark.

---

## 4. Certification

The licensing architecture of iCast conforms with absolute rigor to the statutory mandates of the Apache License, Version 2.0.
