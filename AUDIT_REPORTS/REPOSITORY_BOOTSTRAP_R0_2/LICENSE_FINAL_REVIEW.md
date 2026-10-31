# Final Intellectual Property & License Review — Mission R0.2

## 1. Statutory Compliance Verification (Apache License 2.0)

A comprehensive legal audit was conducted across all intellectual property documents in the repository:

| Document | Primary Function | Upstream Status | iCast Status | Compliance Audit |
| :--- | :--- | :--- | :--- | :--- |
| [`LICENSE`](file:///c:/Users/amaur/Desktop/webos-iptv-player/LICENSE) | Main repository license text | Apache-2.0 (lennylxx) | Apache-2.0 (Dual attribution) | **100% Compliant** |
| [`NOTICE`](file:///c:/Users/amaur/Desktop/webos-iptv-player/NOTICE) | Attribution of upstream & 3P work | Missing | Created in root | **100% Compliant (Sec 4.d)** |
| [`THIRD_PARTY_NOTICES.txt`](file:///c:/Users/amaur/Desktop/webos-iptv-player/THIRD_PARTY_NOTICES.txt) | Bundled binary component disclosures | Maintained | Preserved intact | **100% Compliant** |
| [`licenses/SOURCES.txt`](file:///c:/Users/amaur/Desktop/webos-iptv-player/licenses/SOURCES.txt) | Dependency provenance log | Maintained | Preserved intact | **100% Compliant** |

---

## 2. Textual Integrity Analysis of `LICENSE`

The root [`LICENSE`](file:///c:/Users/amaur/Desktop/webos-iptv-player/LICENSE) file preserves all 176 lines of the standard Apache License 2.0 terms and conditions.

At lines 178–180, the copyright declaration establishes dual authorship:
```text
Copyright 2026 lennylxx
Copyright 2026 iCast contributors (https://github.com/Maurxp/iCast)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
```

### Legal Assessment:
- The original copyright `Copyright 2026 lennylxx` is retained without alteration, satisfying Section 4(c).
- The derivative copyright `Copyright 2026 iCast contributors` establishes legal ownership of new contributions, satisfying standard open-source conventions without obscuring upstream origin.

---

## 3. Analysis of the `NOTICE` File

Under Apache License 2.0 Section 4(d), if a work or derivative work distributes a `NOTICE` file, it must contain readable attribution notices.

The newly created [`NOTICE`](file:///c:/Users/amaur/Desktop/webos-iptv-player/NOTICE) file:
1. **Identifies the Derivative Relationship**:
   *"This product is a derivative work based on webOS IPTV Player developed by lennylxx (https://github.com/lennylxx/webos-iptv-player)."*
2. **Lists Bundled Third-Party Components**:
   - Google LLC (Shaka Player) under Apache 2.0.
   - Streaming Video Technology Alliance (CML-CMCD) under Apache 2.0.
   - Twemoji under Creative Commons Attribution 4.0 International (CC-BY 4.0).
3. **Cross-References License Manifests**:
   Explicitly directs users to `THIRD_PARTY_NOTICES.txt` and `licenses/` for exact terms.

---

## 4. Third-Party Licenses Inventory (`licenses/`)

Every bundled asset in the application was cross-checked against its standalone license in `licenses/`:

- **`licenses/twemoji.txt`**: CC-BY 4.0 license text from Twitter/JDecked. Satisfies attribution for the 17 category icons in `assets/`.
- **`licenses/ass-compiler.txt`**: MIT license from Zhenye Wei for ASS subtitle compilation.
- **`licenses/qrcode-generator.txt`**: MIT license from Kazuhiko Arase for pairing QR codes.
- **`licenses/SOURCES.txt`**: Records SHA-256 provenance hashes for all redistributed third-party files.

---

## 5. Trademark and Branding Conclusion (Section 6)

Section 6 of the Apache License states:
> *"This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor..."*

Renaming the derivative project from *"webOS IPTV Player"* to **iCast**:
1. Eliminates potential trademark conflicts with LG Electronics regarding "webOS".
2. Clearly delineates the independent project identity from Lenny's personal project.
3. Completely adheres to Section 6 restrictions while preserving 100% of the copyright attribution.

