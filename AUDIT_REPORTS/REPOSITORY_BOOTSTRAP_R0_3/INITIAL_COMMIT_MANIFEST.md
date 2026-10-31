# INITIAL COMMIT MANIFEST (MISSION R0.3)

> **Project**: iCast (webOS IPTV Player)  
> **Target Commit**: First Official iCast Commit on `main`  
> **Base Commit**: `52b5dfaffa7db6207350d29b0ec5bad35f12915f` (lennylxx upstream v1.17.0)  
> **Date**: October 31, 2026  
> **Status**: **VERIFIED & AUDITED**  

---

## 1. Classification Methodology

In accordance with the R0.2 publication manifest and R0.3 governance guidelines, every file included in the working tree has been audited and classified under one of four governance tiers:

1. **OBLIGATORIO (Core Production & Packaging)**: Files strictly necessary for building, bundling, running, and packaging iCast for webOS 4+ TVs.
2. **RECOMENDADO (Governance, Compliance & CI)**: Statutory Apache 2.0 notices, developer guides, design assets, and CI automation.
3. **OPCIONAL (Audit Trail & Verification Records)**: Engineering evidence, hardware validation logs, and forensic audit reports.
4. **EXCLUIDO (Strictly Blocked by .gitignore)**: Local testbed automation scripts containing physical TV IPs, secrets, and generated artifacts.

---

## 2. Staged File Inventory

### Tier 1: Core Application & Platform Packaging (Obligatorio)
- `appinfo.json`: Application metadata (Preserves legacy ID `com.lennylxx.iptv`, updates app name to iCast, version `1.17.0`).
- `package.json`: Project manifest and scripts.
- `esbuild.config.mjs`: Chromium 53 bundle configuration with injected build constants.
- `build.sh`: Packaging script for webOS `.ipk`.
- `index.html`: Main HTML entry with obsidian/porcelain theme hooks.
- `src/app.ts`: Root application controller.
- `src/config/themes.ts`: Obsidian and Porcelain theme definitions.
- `src/components/player.ts`: Video playback controller.
- `src/components/player-pipeline.ts`: Native and MSE playback pipeline.
- `src/services/playlist-service.ts`: M3U playlist service with quota management.
- `src/services/service-http.ts`: Resilient HTTP client for webOS Luna bridge.
- `src/services/setup-client.ts`: Luna client for webOS service pairing.
- `src/services/upload-client.ts`: File upload client.
- `src/utils/url.ts`: URL parsing and normalization utilities.

### Tier 2: Bundled Service (Node.js 0.12.2 LAN Service) (Obligatorio)
- `bundled-service/src/compat.ts`: ES5/Node 0.12.2 compatibility layer.
- `bundled-service/src/compat.test.ts`: Compatibility tests.
- `bundled-service/src/lan/server.ts`: Hardened RFC1918 LAN pairing server.
- `bundled-service/src/lan/server.test.ts`: RFC1918 CORS origin and wildcard rejection tests.
- `bundled-service/src/lan/service.ts`: Luna service daemon logic.
- `bundled-service/src/lan/service.test.ts`: Luna service tests.
- `bundled-service/src/setup/setup-page.html`: LAN setup web interface.
- `bundled-service/src/setup/setup-page.test.ts`: Web interface tests.
- `bundled-service/src/upload/store.ts`: In-memory playlist upload store.
- `bundled-service/src/upload/store.test.ts`: Upload store tests.

### Tier 3: Stylesheets & Visual Design Foundations (Obligatorio & Recomendado)
- `assets/brand/icast-prism-monochrome.svg`: Official Monochrome Prism vector mark.
- `assets/brand/icast-icon.svg`: App launcher icon.
- `assets/brand/icast-logo-horizontal.svg`: Horizontal brand lockup.
- `css/tokens.css`: Design tokens (colors, typography, spacing, elevations).
- `css/materials.css`: Liquid Glass and Obsidian surface material classes.
- `css/components.css`: Modern UI component styling for 10-foot TV experience.
- `css/themes.css`: Obsidian Dark and Porcelain Light theme definitions.
- `css/legacy-webos-base.css`: Chromium 53 CSS layout fallbacks.

### Tier 4: Test Infrastructure & Colocated Tests (Recomendado)
- `tsconfig.test.json`: Dedicated test configuration with ES2022 typing.
- `src/components/settings.test.ts`: Fully typed settings component tests (0 diagnostics).
- `src/components/player-mp4.test.ts`: MP4 native video playback regression tests.
- `src/services/phone-setup.integration.test.ts`: LAN pairing integration tests.
- `src/services/storage-service.test.ts`: Storage service quota and eviction tests.
- `src/services/luna-log-hygiene.test.ts`: Luna service log hygiene tests.
- `src/utils/test-server.test.ts`: Test server unit tests.
- `src/utils/url.test.ts`: URL utility unit tests.
- `scripts/build-service.mjs`: Service bundler script.
- `scripts/test-server.ts`: Local RFC1918 mock server.
- `scripts/validate-package-resources.mjs`: Packaging resource validator.
- `scripts/validate-package-resources.test.mjs`: Resource validator tests.
- `scripts/eslint-focus-rules.test.mjs`: ESLint custom focus rule tests.
- `scripts/tv-diag.test.mjs`: Diagnostics tool tests.
- `scripts/tv-input.test.mjs`: Remote input tool tests.
- `scripts/fixtures/`: Synthetic test fixtures.

### Tier 5: Governance, Compliance & CI (Recomendado)
- `LICENSE`: Apache License 2.0 dual attribution (lennylxx & iCast contributors).
- `NOTICE`: Statutory Apache 2.0 Section 4(d) attribution and third-party notices.
- `README.md`: Master technical documentation with calibrated 5-tier webOS taxonomy.
- `CHANGELOG.md`: Version 1.17.0 changelog.
- `CODE_OF_CONDUCT.md`: Contributor Covenant v2.1.
- `SECURITY.md`: Security policy and vulnerability reporting instructions.
- `.editorconfig`: Formatting rules (UTF-8, LF, 2 spaces).
- `.gitignore`: Hardened ignore rules.
- `.github/PULL_REQUEST_TEMPLATE.md`: Standardized PR review checklist.
- `.github/workflows/ci.yml`: Minimal, read-only CI workflow.

### Tier 6: Forensic Audit Evidence (Opcional)
- `AUDIT_REPORTS/`: Comprehensive documentation of all project phases (M0 through R0.3).

---

## 3. Excluded Items Audit (.gitignore Enforcement)

The following items are strictly prevented from inclusion:
- `scripts/tv_*`: Physical TV automation tools containing hardcoded private IPs (`192.168.1.8`).
- `scripts/test_lan_pairing.py`: Ad-hoc Python test script containing private IPs.
- `scripts/synthetic_test.m3u`: Ad-hoc test playlist containing private IPs.
- `scripts/capture-m31-demo.mjs`: Transient demo capture script.
- `scripts/generate-checksums-*.mjs`: Transient checksum generators.
- `dist/`, `build/`, `*.ipk`: Regenerable build outputs.
- `node_modules/`: Upstream dependencies.

---

## 4. Verification Check

All staged files were verified against:
- `git diff --check`: 0 whitespace errors.
- `npm run typecheck`: 0 errors.
- `npx tsc -p tsconfig.test.json --noEmit`: 0 errors.
- `npm run lint`: 0 errors.
- `npm test`: 3,564 tests passed.
- `npm run build`: Chromium 53 clean.

