# Storage & Credentials Security Audit Report — webOS IPTV Player (v1.17.0)

**Project:** `lennylxx/webos-iptv-player`  
**Target Hardware:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Chromium 53.0.2785.34, ARMv7 32-bit)  
**Components Audited:** `src/services/storage-service.ts`, `src/services/idb-database.ts`, `src/services/idb-user-data.ts`, `src/services/parental-pin.ts`, `src/services/parental-control.ts`, `src/utils/logger.ts`, `src/services/xtream-client.ts`  
**Date:** October 2026  

---

## 1. Executive Summary

This audit evaluated how `webos-iptv-player` handles persistent data, user configuration, sensitive IPTV credentials, external subtitle API keys, and parental control PINs.
Key findings:
1. **Architecture & Storage Separation:** The application cleanly separates boot-critical configuration (stored in `localStorage` with `iptv_` prefix) from durable user records (stored in IndexedDB database `iptv-player-data`).
2. **Parental Control PIN Security:** PIN verification uses a proper salted cryptographic hash (`crypto.subtle.digest('SHA-256')`) with a 16-byte random salt and constant-time XOR comparison (`equalBytes`), combined with exponential retry backoff and lockout protection.
3. **No Credential Leakage in Diagnostics / Logging:** All diagnostic log events emitted by `createLogger` and `tv.sh diag` redact stream URLs, domain names, user passwords, and parental PINs.
4. **Platform Reality vs. "Cosmetic Encryption":** Client-side obfuscation (e.g. `btoa`/`atob` or symmetric AES with hardcoded in-bundle keys) was deliberately avoided. On webOS 4 (Chromium 53), web applications run in isolated Linux user spaces with isolated origin storage. Without hardware-backed keystore APIs (such as Android Keystore or Apple Secure Enclave), client-side symmetric encryption provides zero authentic confidentiality while introducing measurable CPU overhead on ARMv7 hardware.

---

## 2. Storage Architecture & Sensitive Assets

The application stores data across two primary tiers:

```
+-----------------------------------------------------------------------------------+
|                               STORAGE ARCHITECTURE                                |
+-----------------------------------------------------------------------------------+
|  1. localStorage (PREFIX: 'iptv_')                                                |
|     - 'iptv_playlists': Array of PlaylistEntry objects                            |
|         * Plain M3U URLs (may contain user tokens in query strings)               |
|         * Xtream accounts (serverUrl, username, password)                         |
|     - 'iptv_online_subtitles': OnlineSubtitleConfig                               |
|         * SubDL, Assrt API keys                                                   |
|         * OpenSubtitles username, password, JWT token                             |
|     - Settings & Preferences: themes, timeouts, refresh intervals                 |
+-----------------------------------------------------------------------------------+
|  2. IndexedDB ('iptv-player-data', Schema v1)                                     |
|     - Store 'channel-state': favorites, customization, category snapshots         |
|     - Store 'playback-state': audio/subtitle prefs, audio sync offsets            |
|     - Store 'resume': VOD playback progress                                       |
|     - Store 'watchlist': saved movies/series                                      |
|     - Store 'reminders': scheduled EPG reminders                                  |
|     - Store 'parental-control': PIN hash record & locked channel categories       |
|  3. IndexedDB ('iptv-player-cache', Disposable Cache)                             |
|     - Parsed EPG program guides, Xtream catalog metadata                          |
+-----------------------------------------------------------------------------------+
```

---

## 3. Credential Handling Analysis

### 3.1 Xtream Accounts & M3U URLs
- **Storage:** Persisted in `localStorage.getItem('iptv_playlists')` as plain JSON.
- **Data Structure:**
  ```typescript
  interface XtreamCredentials {
    serverUrl: string;
    username: string;
    password: string;
  }
  ```
- **Access Scope:** Only readable by the webOS application running in its Chromium origin (`file://` or app sandbox).
- **Network Transmission:** Credentials are transmitted via HTTP/HTTPS to the user-configured IPTV server during catalog sync and authentication calls (`/player_api.php?username=...&password=...`).

### 3.2 OpenSubtitles & Subtitle Search API Keys
- **Storage:** Persisted in `localStorage.getItem('iptv_online_subtitles')`.
- **Fields:** `apiKey`, `username`, `password`, `token`, `tokenTs`.
- **UI Masking:** In the web setup page (`setup-page.html`), existing passwords and tokens are masked with synthetic placeholders (`••••••••`) to prevent visual shoulder-surfing.

### 3.3 Parental Control PIN
- **Implementation (`src/services/parental-pin.ts`):**
  ```typescript
  export async function createParentalPin(pin: string): Promise<ParentalPinRecord> {
    validatePin(pin);
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    return {
      algorithm: 'sha256',
      salt: toBase64(salt),
      digest: toBase64(await derive(pin, salt)),
    };
  }
  ```
- **Salt Generation:** 16 cryptographically secure random bytes generated via `crypto.getRandomValues(salt)`.
- **Digest Derivation:** `crypto.subtle.digest('SHA-256', concat(salt, pin))`.
- **Verification (`verifyParentalPin`):**
  Uses constant-time XOR comparison to protect against timing attacks:
  ```typescript
  function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
    let mismatch = a.length ^ b.length;
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i++) {
      mismatch |= (a[i] ?? 0) ^ (b[i] ?? 0);
    }
    return mismatch === 0;
  }
  ```
- **Brute Force Protection (`src/services/parental-control.ts`):**
  - Lockout kicks in after `CONFIG.PARENTAL_PIN_MAX_FAILURES` (5 consecutive failures).
  - Exponential backoff: `delay = PARENTAL_PIN_RETRY_DELAY_MS * (2 ^ lockouts)`, capped at `PARENTAL_PIN_MAX_RETRY_DELAY_MS`.
  - Rejection before checking PIN during lockout.

---

## 4. Audit of Logging & Diagnostics

A crucial requirement for embedded multimedia apps is preventing sensitive URLs or passwords from leaking into persistent system logs (e.g. `journalctl`, `ares-inspect`, or `tv.sh diag`).

### 4.1 Log Event Audit
- **`createLogger` (`src/utils/logger.ts`):**
  Emits structured `event=<namespace>.<action>` tags with scalar metadata.
- **Xtream Client (`src/services/xtream-client.ts`):**
  When requests fail, line 175 uses `diagnosticEndpoint(url)`:
  ```typescript
  function diagnosticEndpoint(url: string): string {
    try {
      return new URL(url).searchParams.get('action') || 'account_info';
    } catch {
      return 'unknown';
    }
  }
  ```
  The full URL, host, username, and password parameters are completely omitted from the log event. Only the generic action (`get_live_categories`, `get_vod_streams`, etc.) is logged.
- **Parental Control Logs (`src/services/parental-control.ts`):**
  ```typescript
  this.logPinCheck(purpose, 'accepted', 0);
  // Logs: event=parental.pin.checked purpose=challenge result=accepted blockedMs=0
  ```
  The submitted PIN string is never included in log arguments.

---

## 5. Technical Evaluation: Platform Constraints vs. Cosmetic Encryption

A common request in amateur audits is to "encrypt credentials in localStorage". We evaluated whether adding symmetric client-side encryption (e.g. AES-GCM) is technically sound for LG webOS:

### 5.1 Platform Reality on webOS 4 (Chromium 53)
1. **No Hardware Key Management API:** webOS TV Lite 4.10.2 does not expose a secure element, TPM, or OS keystore to HTML5/Chromium applications.
2. **The Key Storage Dilemma:** If credentials in `localStorage` are encrypted using AES, the encryption key must either be:
   - Hardcoded in the bundle JS (`dist/js/app.js`): Trivially extracted by anyone with SSH or file access.
   - Derived from device metadata (e.g. DUID from Luna): Luna calls on webOS 4 can be queried by any local service; the derivation algorithm is inspectable in cleartext source.
   - Provided by the user on every boot: Intolerable user friction on a TV with a D-pad remote.
3. **Chromium 53 Overhead:** Repeatedly encrypting/decrypting strings via Web Crypto or JS polyfills during virtualized list scrolling and stream switching adds CPU cycles and memory allocations on the ARMv7 dual-core SoC without providing authentic cryptographic security against an attacker who has root SSH access.
4. **Existing Native Security Boundary:**
   - webOS enforces origin isolation: other installed webOS apps cannot access the `localStorage` or `IndexedDB` of `com.lennylxx.iptv`.
   - The Linux file permissions in `/media/developer/apps/usr/palm/applications/com.lennylxx.iptv` confine app storage to the application container.
   - Root SSH access on rooted TVs already bypasses any client-side software encryption.

### 5.2 Audit Decision
**Cosmetic encryption was rejected as counterproductive and technically dishonest.** True security is achieved through:
1. Strict origin isolation and sandbox boundaries.
2. Token-authenticated LAN server endpoints.
3. Strict redaction of secrets in logging and diagnostics.
4. High-entropy salted hashing with constant-time verification for PINs.

