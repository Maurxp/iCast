# Build & IPK Packaging Audit — webOS IPTV Player (v1.17.0)

**Project:** `lennylxx/webos-iptv-player`  
**Target Hardware:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Chromium 53.0.2785.34)  
**Deliverable Tested:** `com.lennylxx.iptv_1.17.0_all.ipk`  
**Date:** October 2026  

---

## 1. Executive Summary & Problem Statement

During the initial baseline packaging audit (Mission 1A), inspection of the built webOS application package revealed an inconsistency:
- `dist/index.html` contained the HTML tag:
  ```html
  <script src="js/preview-libs.js"></script>
  ```
- However, the packaging command in `build.sh` executed:
  ```bash
  ares-package --no-minify -e "*preview-libs.js" dist build/bundled-service -o .
  ```
- Because `ares-package` excluded `js/preview-libs.js` from the archive, the packaged `index.html` contained a dangling `<script>` tag referencing a missing file.

When launched on an LG webOS TV, Chromium 53 attempted to parse and load `js/preview-libs.js`, throwing `net::ERR_FILE_NOT_FOUND`. While non-fatal (because `preview-libs.js` is only needed for desktop browser MSE fallback), this error polluted the DevTools console, triggered uncaught resource loading events, and represented a build hygiene failure.

---

## 2. Root Cause Analysis

### 2.1 The Preview Build Toggle
In `esbuild.config.mjs`:
```javascript
const isPreview = process.argv.includes('--preview');
...
const indexHtml = readFileSync('index.html', 'utf8');
const previewLibsMarker = '<!-- preview-libs -->';
const outputIndexHtml = indexHtml.replace(
  previewLibsMarker,
  isPreview ? '<script src="js/preview-libs.js"></script>' : '',
);
writeFileSync('dist/index.html', outputIndexHtml);
```
- In desktop preview mode (`npm run preview`), `isPreview` is `true`. The marker `<!-- preview-libs -->` is replaced by `<script src="js/preview-libs.js"></script>`, and `esbuild` bundles `src/preview-libs.ts` (containing hls.js and mpegts.js) into `dist/js/preview-libs.js`.
- In production mode (`npm run build`), `isPreview` is `false`. The marker is replaced by empty string `''`, and `rmSync('dist/js/preview-libs.js', { force: true })` deletes the file.

### 2.2 Mechanism of Failure
The defect occurred whenever a developer or CI pipeline:
1. Ran `npm run preview` (or started the local preview server).
2. Subsequently ran `ares-package` or packaging commands that read from the existing `dist/` directory without running a clean production `npm run build`.
3. Even when `build.sh` was invoked, if `dist/` was not completely cleaned or if a build step failed silently, stale artifacts in `dist/` were packaged into the IPK.

---

## 3. Engineering Solution: Automated Package Resource Validator

To guarantee that no broken links or misplaced preview libraries can ever be packaged into a release IPK, we engineered an automated validator: `scripts/validate-package-resources.mjs`.

### 3.1 Architecture of `validate-package-resources.mjs`
The validator executes static analysis across the package directories before packaging:

```
+-----------------------------------------------------------------------------------+
|                        PACKAGE RESOURCE VALIDATOR PIPELINE                        |
+-----------------------------------------------------------------------------------+
| 1. appinfo.json Validation:                                                       |
|    - Parses JSON, verifies required fields ('id', 'version').                     |
|    - Verifies 'main' entry point ('index.html') exists on disk.                   |
|    - Verifies 'icon' ('icon.png') exists on disk.                                 |
|    - Verifies 'largeIcon' ('largeIcon.png') exists on disk.                       |
+-----------------------------------------------------------------------------------+
| 2. index.html Static Reference Verification:                                      |
|    - Scans for all <script src="..."> tags.                                       |
|    - Scans for all <link rel="stylesheet|icon" href="..."> tags.                 |
|    - Rejects any reference matching '*preview-libs.js*' as FATAL.                 |
|    - Asserts that every local relative path resolves to an existing file in dist. |
+-----------------------------------------------------------------------------------+
| 3. Service Directory Verification (build/bundled-service):                        |
|    - Verifies package.json and 'main' entry script ('index.js').                  |
|    - Verifies services.json and valid service ID.                                 |
|    - Verifies setup/setup-page.html exists on disk.                               |
+-----------------------------------------------------------------------------------+
```

### 3.2 Integration into the Build Pipeline
1. **At esbuild Completion (`esbuild.config.mjs`):**
   ```javascript
   if (!isPreview) {
     const { validatePackageResources } = await import('./scripts/validate-package-resources.mjs');
     const validation = validatePackageResources('dist');
     if (!validation.valid) {
       throw new Error('Package resource validation failed:\n' + validation.errors.map((e) => `  - ${e}`).join('\n'));
     }
   }
   ```
2. **In Packaging (`build.sh`):**
   ```bash
   node scripts/validate-package-resources.mjs dist build/bundled-service
   ```
3. **Automated Unit Testing (`scripts/validate-package-resources.test.mjs`):**
   A 6-test suite verifies:
   - Valid bundle passes with 0 errors.
   - Reference to `preview-libs.js` fails immediately.
   - Missing script fails with descriptive error.
   - Missing stylesheet fails with descriptive error.
   - Missing icon fails with descriptive error.
   - Missing service setup HTML fails with descriptive error.

---

## 4. Packaging Verification Results

Execution of `node scripts/validate-package-resources.mjs dist build/bundled-service`:
```
[Package Resource Validator] Validating dist and build/bundled-service...
[Package Resource Validator] Verified 26 resources.
[OK] All package resources are valid and verified.
```

Packaging with `ares-package --no-minify -e '*preview-libs.js' dist build/bundled-service`:
- Produced IPK: `AUDIT_REPORTS/MISSION_1B/package/com.lennylxx.iptv_1.17.0_all.ipk`
- Unpacked `dist/index.html` verification:
  - Total script tags: 2 (`js/shaka-player.dash.js`, `js/app.js`).
  - Total stylesheet tags: 1 (`css/legacy-webos-base.css`).
  - References to `preview-libs.js`: **0 (NONE)**.
  - Dangling resource references: **0 (NONE)**.

