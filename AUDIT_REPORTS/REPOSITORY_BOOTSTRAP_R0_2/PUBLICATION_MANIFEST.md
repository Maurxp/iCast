# Publication Manifest & Security Classification — Mission R0.2

## 1. File Classification Taxonomy

Every item in the workspace is classified into four operational tiers:

- **Obligatorio (Mandatory)**: Essential for compiling, bundling, testing, or legally distributing iCast.
- **Recomendado (Recommended)**: Mission audit reports and forensic evidence.
- **Opcional (Optional)**: Development utilities and screenshot capture scripts.
- **Excluido (Excluded)**: Local testbed scripts containing device IPs, generated binaries, and environment files.

---

## 2. Complete Inventory & Classification Table

### 2.1 Tier 1: Obligatorio (Mandatory Production Assets)

| File / Directory Path | Classification | Category / Functional Role | Justification |
| :--- | :--- | :--- | :--- |
| `appinfo.json` | **Obligatorio** | webOS Manifest | App ID `com.lennylxx.iptv` & package metadata |
| `build.sh` | **Obligatorio** | Build Script | Official packaging script for webOS `.ipk` |
| `package.json` & `package-lock.json` | **Obligatorio** | npm Manifest | Dependency lockfile and build script definitions |
| `esbuild.config.mjs` | **Obligatorio** | Bundler Config | Chromium 53 bundle compiler & compat gate |
| `index.html` | **Obligatorio** | Application Canvas | Entry HTML, stylesheet cascade & Anti-FOUC boot |
| `tsconfig.json` | **Obligatorio** | TypeScript Config | Production compiler configuration (ES2018 floor) |
| `tsconfig.test.json` | **Obligatorio** | TypeScript Config | Test & IDE compiler configuration (ES2022) |
| `eslint.config.mjs` | **Obligatorio** | Linter Config | Chromium 53 JavaScript API compat rules |
| `stylelint.config.mjs` | **Obligatorio** | Linter Config | Chromium 53 CSS selector compat rules |
| `vitest.config.ts` | **Obligatorio** | Test Harness | Vitest configuration for unit & integration tests |
| `src/` (All source & test files) | **Obligatorio** | Client Application | Core player, navigation, services, parsers, UI |
| `css/` (All stylesheets) | **Obligatorio** | Stylesheets | Tokens, materials, themes, components, views |
| `assets/brand/` (5 SVG files) | **Obligatorio** | Brand Identity | Isotype B (Obsidian/Porcelain), App icon, lockups |
| `bundled-service/` | **Obligatorio** | Background Service | Node.js 0.12.2 Luna & LAN upload service |
| `licenses/` | **Obligatorio** | Legal Notices | Standalone licenses (Twemoji, Shaka, ASS, MIT) |
| `LICENSE` | **Obligatorio** | Legal | Apache License 2.0 with dual copyright |
| `NOTICE` | **Obligatorio** | Legal | Formal Apache 2.0 attribution statement |
| `THIRD_PARTY_NOTICES.txt` | **Obligatorio** | Legal | Third-party intellectual property disclosures |
| `README.md` | **Obligatorio** | Documentation | Root project documentation & hardware matrix |
| `.gitignore` | **Obligatorio** | Governance | Hardened repository exclusions |
| `.editorconfig` | **Obligatorio** | Governance | Code formatting & whitespace standards |
| `CONTRIBUTING.md` | **Obligatorio** | Governance | Contribution rules & synthetic data policy |
| `CHANGELOG.md` | **Obligatorio** | Governance | Chronological version history |
| `SECURITY.md` | **Obligatorio** | Governance | Responsible vulnerability disclosure policy |
| `CODE_OF_CONDUCT.md` | **Obligatorio** | Governance | Contributor Covenant v2.1 |
| `.github/workflows/ci.yml` | **Obligatorio** | CI Automation | Minimal reliable build, lint & test gate |
| `.github/PULL_REQUEST_TEMPLATE.md`| **Obligatorio** | Governance | Standardized PR quality checklist |
| `.github/ISSUE_TEMPLATE/` | **Obligatorio** | Governance | Bug report & feature request templates |
| `scripts/build-service.mjs` | **Obligatorio** | Build Script | Service compilation & packaging helper |
| `scripts/test-server.ts` | **Obligatorio** | Test Infrastructure | Hardened RFC1918 test stream server |
| `scripts/validate-package-resources.*`| **Obligatorio**| Test Tooling | IPK package resource integrity validator |
| `scripts/fixtures/` | **Obligatorio** | Test Fixtures | Synthetic stream fixtures for unit tests |
| `scripts/eslint-focus-rules.test.mjs`| **Obligatorio**| Test Suite | Focus scope linter rule test |
| `scripts/tv-diag.test.mjs` | **Obligatorio** | Test Suite | Diagnostic logging assertion tests |
| `scripts/tv-input.test.mjs` | **Obligatorio** | Test Suite | Remote control key handler unit tests |

---

### 2.2 Tier 2: Recomendado (Audit & Provenance Reports)

| Directory Path | Classification | Category / Content |
| :--- | :--- | :--- |
| `AUDIT_REPORTS/MISSION_2_2/` | **Recomendado** | Multimedia stabilization & security audits |
| `AUDIT_REPORTS/MISSION_2_3/` | **Recomendado** | Physical hardware validation logs (LG 65UM7400PDA) |
| `AUDIT_REPORTS/MISSION_2_4/` | **Recomendado** | WebAppMgr & CDP security assessment |
| `AUDIT_REPORTS/MISSION_3_0/` | **Recomendado** | Initial visual identity exploration reports |
| `AUDIT_REPORTS/MISSION_3_0_1/` | **Recomendado** | Monochromatic Prism B refinement reports |
| `AUDIT_REPORTS/MISSION_3_1/` | **Recomendado** | M3.1 Visual Foundations reports & screenshots |
| `AUDIT_REPORTS/REPOSITORY_BOOTSTRAP/` | **Recomendado** | R0.1 Initial governance & bootstrap reports |
| `AUDIT_REPORTS/REPOSITORY_BOOTSTRAP_R0_2/`| **Recomendado** | R0.2 Final publication readiness reports |

---

### 2.3 Tier 3: Opcional (Developer Automation Utilities)

| File Path | Classification | Role |
| :--- | :--- | :--- |
| `scripts/capture-m31-demo.mjs` | **Opcional** | Headless Playwright script to capture showroom screenshots |
| `scripts/generate-checksums-*.mjs` | **Opcional** | Cryptographic SHA-256 generator utilities for audit reports |

---

### 2.4 Tier 4: Excluido (Local Testbed Scripts with Private IPs)

| File Path | Classification | Reason for Exclusion |
| :--- | :--- | :--- |
| `scripts/tv_cdp.mjs` | **EXCLUIDO** | Contains local physical TV IP (`192.168.1.8`) |
| `scripts/tv_inspect_dom.mjs` | **EXCLUIDO** | Ad-hoc CDP DOM inspection script |
| `scripts/tv_get_screen_text.mjs` | **EXCLUIDO** | Ad-hoc CDP screen text readout script |
| `scripts/tv_read_keys.mjs` | **EXCLUIDO** | Ad-hoc remote control key logger |
| `scripts/tv_inspect_ch2.mjs` | **EXCLUIDO** | Ad-hoc channel DOM inspector |
| `scripts/tv_inspect_channel_dom.mjs` | **EXCLUIDO** | Ad-hoc channel list DOM inspector |
| `scripts/tv_read_app_state.mjs` | **EXCLUIDO** | Ad-hoc application state inspector |
| `scripts/tv_test_arrow_down.mjs` | **EXCLUIDO** | Ad-hoc D-pad down test script |
| `scripts/tv_test_codecs.mjs` | **EXCLUIDO** | Ad-hoc hardware codec evaluation script |
| `scripts/tv_test_dpad.mjs` | **EXCLUIDO** | Ad-hoc remote D-pad input simulator |
| `scripts/tv_test_extra_codecs.mjs` | **EXCLUIDO** | Ad-hoc multimedia stream test script |
| `scripts/tv_test_playback.mjs` | **EXCLUIDO** | Ad-hoc playback automation script |
| `scripts/tv_baseline.sh` | **EXCLUIDO** | Ad-hoc shell script with local device flags |
| `scripts/tv_do_install.sh` | **EXCLUIDO** | Ad-hoc installation wrapper script |
| `scripts/tv_phase_c.sh` | **EXCLUIDO** | Ad-hoc validation shell script |
| `scripts/tv_exec.py` | **EXCLUIDO** | Local python bridge script |
| `scripts/test_lan_pairing.py` | **EXCLUIDO** | Contains local TV URL (`http://192.168.1.8:43992`) |
| `scripts/synthetic_test.m3u` | **EXCLUIDO** | Contains local stream IP (`http://192.168.1.6:8088`) |
| `dist/`, `build/` | **EXCLUIDO** | Regenerable build artifacts (managed by `.gitignore`) |
| `*.ipk`, `*.manifest.json` | **EXCLUIDO** | Packaged binaries (managed by `.gitignore`) |

---

## 3. Exclusion Hardening in `.gitignore`

To prevent accidental staging of the local testbed scripts in Tier 4, `.gitignore` includes:
```gitignore
# Local testbed automation & private network scripts
scripts/tv_*
scripts/test_lan_pairing.py
scripts/synthetic_test.m3u
```

