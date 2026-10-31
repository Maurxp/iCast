# README Compatibility & Asset Link Audit — Mission R0.2

## 1. Executive Summary

In response to Mission R0.2 directives, the root [`README.md`](file:///c:/Users/amaur/Desktop/webos-iptv-player/README.md) underwent a strict forensic audit to:
1. Eliminate any unsupported claim of fleet-wide compatibility (e.g. webOS 4–24).
2. Clearly separate physically validated hardware from simulation targets and planned fleet devices.
3. Validate that all asset paths, badges, and hyperlinks resolve properly on GitHub.

---

## 2. Refined Hardware Compatibility Taxonomy

The compatibility matrix in Section 2 of `README.md` was rewritten to establish absolute technical precision:

```markdown
| Category | Platform / Environment | Specifications | Validation Method | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Physical Hardware** | **LG 65UM7400PDA** | webOS TV Lite 4.10.2-29 • SoC Realtek RTD2870 • ARMv7 32-bit • 1GB RAM • Chromium 53.0.2785.34 • Node 0.12.2 | On-device deployment, physical Magic Remote / D-pad, hardware media decoding, Luna service | **VALIDATED ON DEVICE** |
| **Compatibility Floor** | webOS 4.x Runtime Baseline | Chromium 53 API ceiling • Node.js 0.12.2 runtime | Static gate: esbuild `chrome53`, Stylelint legacy selectors, ESLint compat gate | **AUTOMATED IN BUILD** |
| **Simulation** | Headless Linux / Windows | Chromium 53 simulation profile | Playwright test suite with polyfill removals and quirk assertions | **TESTED IN CI** |
| **Desktop Preview** | Chrome / Edge / Firefox | Modern desktop browser | Local development preview with desktop MSE fallback (`npm run preview`) | **DEVELOPMENT TOOL** |
| **Planned / Target Fleet** | LG webOS 5.x, 6.0, 22, 23, 24 | Newer webOS firmwares and modern Chromium engines (up to Chromium 108+) | Architectural backward compatibility objective | **PENDING PHYSICAL TESTBED** |
```

### Forensic Distinctions Enforced:
- **Physical Validation**: Limited strictly to **LG 65UM7400PDA** where actual physical hardware tests were executed during Missions M2.3 and M2.4.
- **Planned Fleet**: webOS 5 through 24 are explicitly classified as **"PENDING PHYSICAL TESTBED"**. No false assertions of universal testing exist.
- **Progressive Enhancement**: Stated strictly as an architectural capability via CSS `@supports` rules rather than verified hardware behavior.

---

## 3. GitHub Asset & Hyperlink Verification

Every link and media reference in `README.md` was checked for web resolution on GitHub:

| Reference | Target Path in Repository | GitHub Resolution Mechanism | Audit Status |
| :--- | :--- | :--- | :--- |
| **Header Logo** | `assets/brand/logo_horizontal_obsidian.svg` | Relative path (`<img src="...">`) | **VERIFIED (Renders SVG natively)** |
| **License Badge** | `LICENSE` | Relative link (`[License: Apache 2.0](LICENSE)`) | **VERIFIED** |
| **License File** | `[LICENSE](LICENSE)` | Root markdown link | **VERIFIED** |
| **Notice File** | `[NOTICE](NOTICE)` | Root markdown link | **VERIFIED** |
| **3P Notices** | `[THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt)` | Root text link | **VERIFIED** |
| **Contributing** | `[CONTRIBUTING.md](CONTRIBUTING.md)` | Root markdown link | **VERIFIED** |
| **Security** | `[SECURITY.md](SECURITY.md)` | Root markdown link | **VERIFIED** |
| **Changelog** | `[CHANGELOG.md](CHANGELOG.md)` | Root markdown link | **VERIFIED** |
| **Code of Conduct** | `[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)` | Root markdown link | **VERIFIED** |
| **Audit Reports** | `[AUDIT_REPORTS/](AUDIT_REPORTS/)` | Directory link | **VERIFIED** |
| **Licenses Dir** | `[licenses/](licenses/)` | Directory link | **VERIFIED** |
| **Upstream Repo** | `https://github.com/lennylxx/webos-iptv-player` | External HTTPS URL | **VERIFIED** |

All hyperlinks are relative or canonical HTTPS URLs. Zero broken links exist.

