# iCast — Premium 10-Foot IPTV Player for LG webOS TV

<p align="center">
  <img src="assets/brand/logo_horizontal_obsidian.svg" alt="iCast Logo" width="280">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License: Apache 2.0"></a>
  <img src="https://img.shields.io/badge/Platform-LG%20webOS%204%2B-red.svg" alt="webOS 4+">
  <img src="https://img.shields.io/badge/Engine-Chromium%2053-orange.svg" alt="Chromium 53">
  <img src="https://img.shields.io/badge/Arch-ARMv7%2032--bit-green.svg" alt="ARMv7">
  <img src="https://img.shields.io/badge/Service-Node.js%200.12.2-yellow.svg" alt="Node 0.12.2">
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue.svg" alt="TypeScript Strict">
</p>

---

## 1. Overview

**iCast** is an open-source, high-performance IPTV player engineered specifically for **LG Smart TVs running webOS**. Built in pure vanilla TypeScript without heavy web frameworks, iCast delivers a fluid, instant, 60 fps 10-foot living room experience even on legacy, resource-constrained television hardware.

The application is engineered strictly against the floor of the target webOS fleet (**webOS TV Lite 4.10.2** running Chromium 53 on 1GB RAM) with progressive enhancement CSS rules prepared for modern browser engines.

---

## 2. Hardware Compatibility Matrix

| Category | Platform / Environment | Specifications | Validation Method | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Physical Hardware** | **LG 65UM7400PDA** | webOS TV Lite 4.10.2-29 • SoC Realtek RTD2870 • ARMv7 32-bit • 1GB RAM • Chromium 53.0.2785.34 • Node 0.12.2 | On-device deployment, physical Magic Remote / D-pad, hardware media decoding, Luna service | **VALIDATED ON DEVICE** |
| **Compatibility Floor** | webOS 4.x Runtime Baseline | Chromium 53 API ceiling • Node.js 0.12.2 runtime | Static gate: esbuild `chrome53`, Stylelint legacy selectors, ESLint compat gate | **AUTOMATED IN BUILD** |
| **Simulation** | Headless Linux / Windows | Chromium 53 simulation profile | Playwright test suite with polyfill removals and quirk assertions | **TESTED IN CI** |
| **Desktop Preview** | Chrome / Edge / Firefox | Modern desktop browser | Local development preview with desktop MSE fallback (`npm run preview`) | **DEVELOPMENT TOOL** |
| **Planned / Target Fleet** | LG webOS 5.x, 6.0, 22, 23, 24 | Newer webOS firmwares and modern Chromium engines (up to Chromium 108+) | Architectural backward compatibility objective | **PENDING PHYSICAL TESTBED** |

---

## 3. Key Features

- **Architectural Dual-Ring Focus**: Universal 10-foot remote control navigation contract with a 2px inner separation halo, 2px outer crisp ring, 1.03x scale elevation, and 0.98x tactile active compression. Zero saturated neon blur.
- **Bi-Thematic Color Engine**:
  - **Obsidian (Default)**: Deep cinematic mineral palette (`#101114` base, `#EDEDEF` text, warm titanium accent `#C8BFAF`).
  - **Porcelain**: Refined gallery light palette (`#F3F2EF` base, `#252629` text, bronze champagne accent `#A99476`).
- **3-Tier Liquid Glass Materials**:
  - *Level 1 (Base)*: Solid mineral grounding, zero compositor overhead.
  - *Level 2 (Translucent)*: Optical alpha simulation with sub-pixel borders for navigation rails.
  - *Level 3 (Prominent)*: Elevated floating dialogs with specular top highlight and deep drop shadows.
- **Native Hardware Playback**: Direct TV pipeline acceleration for HLS, MPEG-DASH, and MP4 with multi-audio track parsing and ASS/SRT/WebVTT subtitle rendering.
- **Background Luna & LAN Service**: Bundled Node.js 0.12.2 micro-service (`bundled-service/`) enabling phone pairing and browser-based M3U uploads over local Wi-Fi with cryptographic tokens.
- **Xtream Codes & XMLTV Support**: Full VOD catalog navigation (Movies and Series with Continue Watching rails) alongside an EPG timeline grid.

---

## 4. Architecture & Engineering Principles

```
iCast Architecture
├── Client App (src/) ──► Vanilla TypeScript + DOM morph reconciler (Zero framework)
│   ├── Navigation ─────► Spatial geometric D-pad routing + FocusRing owner stack
│   ├── Media Pipeline ─► Native HTML5 video plane (webOS) + MSE desktop fallback
│   └── Services ───────► StorageService (IndexedDB + localStorage quota safety)
│
├── Bundled Service ────► Node.js 0.12.2 CommonJS micro-service on Luna bus
│   ├── LAN Server ─────► RFC1918 private IPv4 server for local playlist uploads
│   └── Luna Client ────► Background activity reminders & alerts
│
└── Design System ──────► CSS Custom Properties (Tokens + Materials + Themes)
    ├── tokens.css ─────► 8pt modular grid, squircle radii, 10-foot typography scale
    ├── materials.css ──► Liquid Glass 3-tier optical simulation surfaces
    └── themes.css ─────► Obsidian & Porcelain theme definitions
```

### Critical webOS Platform Constraints:
- **Chromium 53 Target**: Modern CSS selectors like `:focus-visible`, `:focus-within`, `:has()` and Flexbox `gap` fail or crash rules on webOS 4. Build transforms automatically generate legacy-compatible fallbacks.
- **Single Focus Ring Invariant**: Only the active surface on the Focus owner stack (`src/navigation/focus-scope.ts`) paints a ring. Pointer clicks never steal remote control key ownership.
- **Technical App ID**: Preserved strictly as `com.lennylxx.iptv` in `appinfo.json` to prevent database sandbox wipes on deployed televisions.

---

## 5. Development Quickstart

### Prerequisites
- **Node.js**: v20.x or v22.x LTS (for build tooling and testing).
- **webOS CLI**: `@webos-tools/cli@3.2.5` (`npm install -g @webos-tools/cli@3.2.5`).
- **Operating System**: Linux, macOS, or Windows.

### Installation
```bash
# Clone the repository
git clone https://github.com/Maurxp/iCast.git
cd iCast

# Install exact locked dependencies
npm ci
```

### Essential Commands
```bash
npm run typecheck              # Strict TypeScript static analysis (tsc --noEmit)
npm run lint                   # Stylelint + ESLint Chromium 53 compatibility gate
npm run build                  # Compile production bundle into dist/
npm test                       # Run Vitest unit and integration test suite
npm run preview                # Build and launch local preview at http://localhost:3000
npm run service:smoke          # Verify bundled service on real Node.js 0.12.2 runtime
./build.sh                     # Package the deployable webOS .ipk package
```

---

## 6. Project Governance & Standards

- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Contribution standards, intellectual property rules, and synthetic test data requirements.
- **[SECURITY.md](SECURITY.md)**: Responsible disclosure policy and local TV security context.
- **[CHANGELOG.md](CHANGELOG.md)**: Complete chronological history of updates.
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)**: Contributor Covenant v2.1.
- **Forensic Audit & Architecture Records**: Comprehensive engineering mission logs, performance analyses, and hardware validation records are maintained locally by project maintainers.

---

## 7. Upstream Acknowledgments & Attribution

**iCast** is built upon the foundational codebase of **webOS IPTV Player** created by **Lenny (`lennylxx`)**:
- Upstream Repository: [https://github.com/lennylxx/webos-iptv-player](https://github.com/lennylxx/webos-iptv-player)
- Original Author: **Lenny (`lennylxx`)**

We express our sincere gratitude to Lenny and all contributors for authoring the original high-performance player engine, parser routines, and webOS platform integrations.

Third-party intellectual property notices (including Shaka Player, Twemoji, ASS subtitle compiler, and fflate) are maintained in [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) and the [`licenses/`](licenses/) directory.

---

## 8. License

This project is licensed under the **Apache License, Version 2.0**.

- See the full license text in [LICENSE](LICENSE).
- See attribution and third-party notices in [NOTICE](NOTICE) and [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt).

```
Copyright 2026 lennylxx
Copyright 2026 iCast contributors (https://github.com/Maurxp/iCast)
```
