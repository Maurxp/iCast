# LAN Security Audit Report — webOS IPTV Player (v1.17.0)

**Project:** `lennylxx/webos-iptv-player`  
**Target Hardware:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, API 4.1.0, ARMv7 32-bit, Node.js 0.12.2)  
**Component Audited:** `bundled-service/src/lan/server.ts` & LAN Setup Service  
**Date:** October 2026  
**Auditor:** Senior Embedded Software & Security Engineer  

---

## 1. Executive Summary

The bundled service (`com.lennylxx.iptv.service`) hosts an internal HTTP server (`bundled-service/src/lan/server.ts`) listening on `0.0.0.0` (all network interfaces) on an ephemeral port assigned by the OS. This server provides two core functionalities:
1. **Remote Phone Setup:** A web interface (`/setup`) allowing users on the local area network (LAN) to pair via a 4-digit PIN or QR code and configure playlists, Xtream accounts, EPG sources, and subtitle providers.
2. **M3U Playlist Uploads:** Endpoints (`/uploads`) allowing LAN clients to upload `.m3u` playlist files directly to the TV storage.

Our audit identified several critical security vulnerabilities in the pre-existing implementation:
- **Unauthenticated Read Access to Uploaded Playlists:** Both `GET /uploads` (list all uploaded playlists) and `GET /uploads/:id` (download raw `.m3u` file content) were completely unauthenticated. Any device on the same local network could list and exfiltrate all stored playlists and IPTV stream URLs without providing a pairing token.
- **Overly Permissive Cross-Origin Resource Sharing (CORS):** The server emitted `Access-Control-Allow-Origin: *` unconditionally on responses, allowing malicious websites visited by any browser in the local network to make cross-origin requests to the TV service.
- **Missing OPTIONS Preflight Handling:** CORS preflight `OPTIONS` requests were unhandled, returning default 404 responses.
- **Insecure File Creation Permissions:** Uploaded `.m3u` and `.json` metadata files in `dataDir` were written with default umask permissions (`0o666`), readable by any local process on the TV.

---

## 2. Threat Modeling & Attack Vectors

### 2.1 Threat Actor Profile
1. **Compromised LAN Devices:** IoT devices, smart home hubs, or compromised guest Wi-Fi devices scanning internal subnets.
2. **Malicious Web Pages (Drive-by Attacks via Web Browser):** A user on a phone or PC on the same LAN visits a malicious website. The site runs JavaScript executing `fetch('http://192.168.1.X:PORT/uploads')`.
3. **Local TV Process Sandbox Breach:** Other applications running on the TV attempting to read files in the IPTV service's data directory.

### 2.2 Attack Surface Analysis

| Endpoint | Method | Original Auth Requirement | Vulnerability Severity | Impact |
| :--- | :--- | :--- | :--- | :--- |
| `/uploads` | `GET` | **None** | **CRITICAL** | Any LAN client could enumerate all uploaded playlist names, channel counts, and download links. |
| `/uploads/:id` | `GET` | **None** | **CRITICAL** | Any LAN client could download raw `.m3u` files containing stream URLs and potential embedded credentials. |
| `/uploads` | `POST` | Setup Token (`?token=`) | Low | Mutation required token, but only supported query string. |
| `/uploads/:id` | `DELETE` | Non-loopback required Token | Moderate | Allowed loopback without token; remote required token in query string only. |
| `/setup-state` | `GET` | Setup Token (`?token=`) | Low | State snapshot was protected by token. |
| `/setup-state` | `PUT` | Loopback only | Low | Protected by loopback check. |
| `/setup-actions`| `GET` | Loopback only | Low | Protected by loopback check. |
| `/setup-actions`| `POST`| Setup Token (`?token=`) | Low | Protected by token. |
| `/info` | `GET` | Loopback only | Low | Protected by loopback check. |
| `/pair` | `POST` | 4-digit PIN | Low / Mitigated | Rate-limited (max 5 attempts, 60s lockout). |

---

## 3. Detailed Vulnerability Findings

### 3.1 Finding LAN-01: Information Disclosure via Unauthenticated `GET /uploads` (CVSS: 7.5)
- **File:** `bundled-service/src/lan/server.ts`, line 281 (original)
- **Vulnerability:**
  ```typescript
  // Original implementation:
  } else if (pathname === '/uploads') {
    const base = 'http://' + host;
    const items = uploads.list().map((m) => ({
      ...m,
      url: base + '/uploads/' + encodeURIComponent(m.id) + '.m3u',
    }));
    sendJson(200, items);
  ```
- **Exploitation:** An unauthenticated attacker sends `GET http://192.168.1.8:<port>/uploads`. The server responds with 200 OK and a JSON array of all stored playlists, their internal IDs, and URLs.

### 3.2 Finding LAN-02: Unauthenticated Exfiltration of Playlist Files via `GET /uploads/:id` (CVSS: 7.5)
- **File:** `bundled-service/src/lan/server.ts`, line 295 (original)
- **Vulnerability:**
  ```typescript
  // Original implementation:
  } else {
    try {
      send(200, 'audio/mpegurl; charset=utf-8', uploads.read(id));
    } catch {
      send(404, 'text/plain; charset=utf-8', 'Upload not found: ' + id);
    }
  }
  ```
- **Exploitation:** Any client could download the complete `.m3u` stream playlist. Many IPTV playlists contain sensitive session tokens or user authentication in stream URLs.

### 3.3 Finding LAN-03: Cross-Origin Resource Sharing (CORS) Misconfiguration (CVSS: 6.5)
- **File:** `bundled-service/src/lan/server.ts`, line 41 (original)
- **Vulnerability:**
  ```typescript
  // Original implementation:
  function send(status, contentType, body) {
    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      ...
    };
  ```
- **Exploitation:** `Access-Control-Allow-Origin: *` allowed any external website running in a browser on the user's LAN to make cross-origin fetch requests to the TV's LAN service, exfiltrating playlists and reading state.

### 3.4 Finding LAN-04: Insecure File Mode on Uploaded Playlists (CVSS: 4.0)
- **File:** `bundled-service/src/upload/store.ts`, line 69 (original)
- **Vulnerability:**
  ```typescript
  fs.writeFileSync(filePath, content, 'utf-8');
  fs.writeFileSync(metaPath, JSON.stringify(meta), 'utf-8');
  ```
- **Exploitation:** Files were created with default permissions (subject to umask `022`), resulting in `0o644` (world-readable) permissions on the Linux filesystem.

---

## 4. Audit Conclusion & Remediation Roadmap

The identified vulnerabilities posed significant privacy and information disclosure risks on shared local networks. Immediate remediation required:
1. Enforcing setup token authentication for non-loopback requests on `GET /uploads` and `GET /uploads/:id`.
2. Preserving unauthenticated loopback access for the on-device webOS application player pipeline.
3. Adding multi-transport token parsing (`?token=`, `Authorization: Bearer <token>`, and `X-Setup-Token: <token>`).
4. Restricting CORS origins strictly to loopback and RFC 1918 private IPv4 subnets, with explicit OPTIONS preflight support.
5. Hardening filesystem permissions to `0o600`.

