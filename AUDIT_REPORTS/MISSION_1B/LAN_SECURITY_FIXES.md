# LAN Security Hardening Implementation Report — webOS IPTV Player (v1.17.0)

**Project:** `lennylxx/webos-iptv-player`  
**Target Hardware:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Node.js 0.12.2)  
**Branch:** `fix/mission-1b-hardening`  
**Files Modified:**
- `bundled-service/src/lan/server.ts`
- `bundled-service/src/upload/store.ts`
- `bundled-service/src/setup/setup-page.html`
- `bundled-service/src/lan/server.test.ts`
- `bundled-service/src/setup/setup-page.test.ts`

---

## 1. Architectural Design of the Hardening Solution

### 1.1 Dual-Tier Access Control (Loopback vs. Non-Loopback)
To protect sensitive user playlists without breaking on-device playback:
- **Loopback Requests (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`):**
  The webOS TV application (`com.lennylxx.iptv`) runs locally on the television and accesses the service via loopback:
  - `UploadClient.list()` enumerates uploads for Settings UI.
  - `PlaylistService` and `PlayerPipeline` fetch `.m3u` contents via loopback HTTP (`http://127.0.0.1:<port>/uploads/<id>.m3u`).
  - **Decision:** Loopback clients are granted read access without requiring the pairing token. This prevents the TV player from needing to query or persist ephemeral setup tokens across process lifecycles.
- **External LAN Clients (Mobile Phones, Tablets, PCs):**
  Devices accessing the service over the local Wi-Fi / Ethernet interface:
  - Must provide a valid `setupToken`.
  - Token is verified against the cryptographically generated 6-byte hex token (`randomBytes(6).toString('hex')`).
  - Requests without a valid token return `403 Forbidden` (`{ "error": "Invalid setup token" }`).

### 1.2 Multi-Format Token Extraction
Tokens are accepted via three standard mechanisms:
1. Query parameter: `?token=<token>` (used by QR-code links and browser setup page).
2. HTTP Header: `Authorization: Bearer <token>` (standard RFC 6750 bearer token).
3. HTTP Header: `X-Setup-Token: <token>` (custom header alternative).

Implementation:
```typescript
function extractToken(req: http.IncomingMessage, query: (name: string) => string | null): string {
  const qToken = query('token');
  if (qToken) return qToken;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const match = /^Bearer\s+(\S+)$/i.exec(authHeader);
    if (match) return match[1];
  }
  const xToken = req.headers['x-setup-token'];
  if (typeof xToken === 'string' && xToken) return xToken;
  return '';
}
```

### 1.3 CORS Hardening & OPTIONS Preflight
- Instead of returning wildcard `*`, the server dynamically validates the `Origin` header:
  - Loopback (`localhost`, `127.0.0.1`, `file://`): allowed.
  - RFC 1918 Private IPv4 subnets (`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`): allowed.
  - Public / Internet Origins (e.g. `https://malicious-website.com`): **REJECTED** (no `Access-Control-Allow-Origin` header emitted).
- Implemented full HTTP `OPTIONS` preflight support returning `204 No Content` with:
  ```http
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, X-Setup-Token
  Access-Control-Max-Age: 86400
  ```

### 1.4 POSIX File Mode Hardening (`0o600`)
In `bundled-service/src/upload/store.ts`, all playlist writes now enforce strict owner-only read/write permissions:
```typescript
fs.writeFileSync(filePath, content, { encoding: 'utf-8', mode: 0o600 });
fs.writeFileSync(metaPath, JSON.stringify(meta), { encoding: 'utf-8', mode: 0o600 });
```

---

## 2. Code Changes and Diffs

### 2.1 `bundled-service/src/lan/server.ts`
```diff
--- a/bundled-service/src/lan/server.ts
+++ b/bundled-service/src/lan/server.ts
@@ -28,6 +28,10 @@ export type ServiceChangeEvent = 'uploads-changed' | 'setup-changed';
 
+export interface StartServerOptions {
+  isLoopback?: (req: http.IncomingMessage) => boolean;
+}
+
+function getCorsOrigin(req: http.IncomingMessage, checkLoopback: (req: http.IncomingMessage) => boolean): string {
+  const origin = req.headers.origin;
+  if (!origin || origin === 'null') return '*';
+  if (checkLoopback(req) || origin.indexOf('file://') === 0) return origin;
+  try {
+    const parsed = parseUrl(origin);
+    const host = parsed.hostname;
+    if (host === 'localhost' || host === '127.0.0.1' ||
+        host.indexOf('192.168.') === 0 || host.indexOf('10.') === 0 ||
+        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) {
+      return origin;
+    }
+  } catch {}
+  return '';
+}
+
+function hasValidToken(req: http.IncomingMessage, query: (name: string) => string | null, setupToken: string): boolean {
+  const token = extractToken(req, query);
+  return token !== '' && token === setupToken;
+}
+
+function isLoopbackOrAuthorized(req: http.IncomingMessage, query: (name: string) => string | null, setupToken: string, checkLoopback: (req: http.IncomingMessage) => boolean): boolean {
+  if (checkLoopback(req)) return true;
+  return hasValidToken(req, query, setupToken);
+}
```

### 2.2 Endpoint Protection Updates
```diff
+      if (req.method === 'OPTIONS') {
+        const allowedOrigin = getCorsOrigin(req, checkLoopback);
+        const headers: Record<string, string | number> = {
+          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
+          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Setup-Token',
+          'Access-Control-Max-Age': 86400,
+        };
+        if (allowedOrigin) headers['Access-Control-Allow-Origin'] = allowedOrigin;
+        res.writeHead(204, headers);
+        res.end();
+        return;
+      }

       } else if (pathname === '/uploads') {
+        if (!isLoopbackOrAuthorized(req, query, setupToken, checkLoopback)) {
+          sendJson(req, res, 403, { error: 'Invalid setup token' }, checkLoopback);
+          return;
+        }
         const base = 'http://' + host;
+        const tokenQuery = checkLoopback(req) ? '' : ('?token=' + encodeURIComponent(setupToken));
         const items = uploads.list().map((m) => ({
           ...m,
-          url: base + '/uploads/' + encodeURIComponent(m.id) + '.m3u',
+          url: base + '/uploads/' + encodeURIComponent(m.id) + '.m3u' + tokenQuery,
         }));
         sendJson(req, res, 200, items, checkLoopback);

       } else if (pathname.indexOf('/uploads/') === 0) {
         ...
         if (req.method === 'DELETE') {
-          if (!isLoopback(req) && query('token') !== setupToken) {
+          if (!isLoopbackOrAuthorized(req, query, setupToken, checkLoopback)) {
             sendJson(req, res, 403, { error: 'Invalid setup token' }, checkLoopback);
             return;
           }
         } else {
+          if (!isLoopbackOrAuthorized(req, query, setupToken, checkLoopback)) {
+            sendJson(req, res, 403, { error: 'Invalid setup token' }, checkLoopback);
+            return;
+          }
           try {
             send(req, res, 200, 'audio/mpegurl; charset=utf-8', uploads.read(id), checkLoopback);
```

### 2.3 Setup Page Pairing Integration (`setup-page.html`)
Line 2378 updated to pass the authenticated URL when listing uploads from the paired phone:
```diff
--- a/bundled-service/src/setup/setup-page.html
+++ b/bundled-service/src/setup/setup-page.html
@@ -2375,7 +2375,7 @@
   async function refreshUploads() {
     try {
-      const res = await fetch("/uploads");
+      const res = await fetch(authenticatedUrl("/uploads"));
       if (!res.ok) return;
       const list = await res.json();
```

---

## 3. Verification & Test Coverage

A comprehensive suite of 12 new regression and security unit tests was added to `bundled-service/src/lan/server.test.ts`:
1. `rejects GET /uploads without token when request is non-loopback` -> **PASSED** (403)
2. `rejects GET /uploads with invalid token when request is non-loopback` -> **PASSED** (403)
3. `allows GET /uploads with valid query token when non-loopback and includes token in URLs` -> **PASSED** (200)
4. `allows GET /uploads with Bearer authorization header when non-loopback` -> **PASSED** (200)
5. `allows GET /uploads with X-Setup-Token header when non-loopback` -> **PASSED** (200)
6. `rejects GET /uploads/:id.m3u without token when non-loopback` -> **PASSED** (403)
7. `allows GET /uploads/:id.m3u with valid token when non-loopback` -> **PASSED** (200)
8. `allows GET /uploads and GET /uploads/:id.m3u without token on loopback` -> **PASSED** (200)
9. `rejects DELETE /uploads/:id without token when non-loopback` -> **PASSED** (403)
10. `strictly blocks /info and /setup-actions from non-loopback even with token` -> **PASSED** (403)
11. `handles CORS OPTIONS preflight with status 204 and correct headers` -> **PASSED** (204)
12. `restricts CORS origin: omits Access-Control-Allow-Origin for untrusted public origin` -> **PASSED** (No header)

Total tests in `server.test.ts`: **48/48 PASSED**.

