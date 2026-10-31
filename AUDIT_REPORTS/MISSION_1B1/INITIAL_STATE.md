# Initial State Report — Mission 1B.1 (Security Closure)

**Project:** `webos-iptv-player` (v1.17.0)  
**Branch:** `fix/mission-1b1-security-closure` (branched from `fix/mission-1b-hardening`)  
**Target Hardware:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, ARMv7, Chromium 53, Node.js 0.12.2)  
**Date:** October 2026  

---

## 1. Git State and Baseline Inventory

### 1.1 Branch & Commit Information
- Current Branch: `fix/mission-1b1-security-closure`
- Previous Working Branch: `fix/mission-1b-hardening`
- Base Commit: Baseline v1.17.0

### 1.2 Status of Files Modified from Mission 1B
The following files carry the initial security fixes and packaging enhancements from Mission 1B:
- `bundled-service/src/lan/server.ts`: Initial token verification, CORS headers, OPTIONS preflight.
- `bundled-service/src/upload/store.ts`: Initial `0o600` mode in `fs.writeFileSync`.
- `bundled-service/src/setup/setup-page.html`: Pairing phone client uses `authenticatedUrl("/uploads")`.
- `bundled-service/src/lan/server.test.ts`: Expanded to 48 unit tests.
- `bundled-service/src/setup/setup-page.test.ts`: 11 tests covering setup forms.
- `esbuild.config.mjs`: Integration of package resource validation.
- `css/legacy-webos-base.css`: Automatically regenerated flex-gap stylesheet.
- `scripts/validate-package-resources.mjs`: Automated package resource validator.
- `scripts/validate-package-resources.test.mjs`: 6 unit tests for package validator.
- `AUDIT_REPORTS/MISSION_1B/`: Full archive of Mission 1B deliverables and validated IPK package.

---

## 2. Identified Vulnerabilities to Resolve in Mission 1B.1

### 2.1 Frente A: The Loopback Auth Bypass & Malicious Web Pages on the TV
- `isLoopbackOrAuthorized()` previously granted access unconditionally whenever `checkLoopback(req)` was true.
- `getCorsOrigin()` reflected any `Origin` header when the connection was loopback.
- `/info` returned `setupUrl` (which contains `setupToken`) solely on the condition of `isLoopback(req)`.
- **The Threat:** On LG webOS, the TV includes a built-in web browser (the WebAppManager/WAM browser). If a user browses to a hostile web page (e.g. `http://malicious-website.com`), or if an unauthenticated local application executes on the TV, it can execute `fetch('http://127.0.0.1:<port>/info')`. Because the request originates from the TV's loopback interface, the server would return the full `/info` response including `setupToken` and `pairingCode`, allowing full extraction of playlists and settings.
- **Mission 1B.1 Objective:** Close this bypass so that untrusted web pages running inside the TV browser cannot obtain the token, read `/info`, or enumerate/download/mutate playlists.

### 2.2 Frente B: Flawed CORS Origin Prefix Matching
- In `server.ts`, `getCorsOrigin()` checked `host.indexOf('192.168.') === 0`, `host.indexOf('10.') === 0`, etc.
- **The Threat:** An attacker could register domains such as `http://192.168.attacker.example` or `http://10.attacker.example`. The string prefix check returned true, reflecting the attacker's origin!
- **Mission 1B.1 Objective:** Replace string prefix checking with strict RFC 1918 IPv4 parsing and validation. Handle `null` and absent `Origin` headers securely without returning wildcard `*`.

### 2.3 Frente C: Effective Filesystem Permissions (`0o600` / `0o700`)
- `fs.writeFileSync(file, content, { mode: 0o600 })` does not change permissions of pre-existing files when overwritten.
- **Mission 1B.1 Objective:** Explicitly enforce `0o700` directory permissions and `0o600` file permissions with `fs.chmodSync` on creation, overwrite, and startup, with POSIX-safe handling and robust error recovery.

### 2.4 Frente D: Build & Packaging Pipeline Order
- Ensure `scripts/validate-package-resources.mjs` validates both `dist/` and `build/bundled-service` immediately before `ares-package` runs, and add inspection of the generated `.ipk` archive contents.

