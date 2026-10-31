# DETALLE DE CORRECCIONES EN SERVICIO LUNA Y SERVIDOR HTTP — LUNA SERVICE FIXES
## webOS IPTV Player v1.17.0 — Misión 1B.2

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Node.js 0.12.2 / Chromium 53)  
**Rama:** `fix/mission-1b2-luna-trust`  
**Fecha:** 2026-10-29  

---

## 1. Archivos Modificados en la Misión 1B.2

1. `bundled-service/src/compat.ts`: Implementación de comparación de cadenas en tiempo constante `timingSafeEqualString`.
2. `bundled-service/src/compat.test.ts`: Pruebas unitarias para `timingSafeEqualString`.
3. `bundled-service/src/lan/service.ts`: Implementación de verificación de llamador `isAuthorizedCaller`, sanitización de respuestas `start`, `getInfo`, `stop` y `serviceEvents`.
4. `bundled-service/src/lan/service.test.ts`: Nueva suite de pruebas para métodos Luna y validación de llamadores no autorizados.
5. `bundled-service/src/lan/server.ts`: Eliminación de `appToken` en respuesta HTTP `GET /info`, integración de `timingSafeEqualString` en `POST /pair`, bloqueo global, caducidad y rotación.
6. `bundled-service/src/lan/server.test.ts`: Pruebas de reducción de tokens en `/info` y robustecimiento de emparejamiento PIN.
7. `src/app.ts`: Eliminación de volcado de respuestas con secretos en `log.info` al arrancar el servicio y registro seguro de eventos.
8. `src/services/luna-log-hygiene.test.ts`: Nueva suite de validación de higiene de logs y ausencia de filtraciones de secretos.

---

## 2. Diffs Detallados por Módulo

### 2.1 `bundled-service/src/lan/service.ts`

```diff
--- a/bundled-service/src/lan/service.ts
+++ b/bundled-service/src/lan/service.ts
@@ -23,10 +23,30 @@
 
 export type LunaMsg = {
   respond: (r: unknown) => void;
   isSubscription?: boolean;
+  applicationId?: string;
+  callerId?: string;
+  sender?: string;
   on?: (event: 'cancel', listener: () => void) => void;
 };
 
+function getCallerAppId(msg: LunaMsg): string | undefined {
+  const m = msg as Record<string, unknown>;
+  if (typeof m.applicationId === 'string' && m.applicationId.length > 0) return m.applicationId;
+  if (typeof m.callerId === 'string' && m.callerId.length > 0) return m.callerId;
+  if (typeof m.sender === 'string' && m.sender.length > 0) return m.sender;
+  return undefined;
+}
+
+function isAuthorizedCaller(msg: LunaMsg): boolean {
+  const caller = getCallerAppId(msg);
+  // Denegar acceso si el identificador inyectado por LS2 no corresponde a nuestra aplicación
+  if (caller !== undefined && caller !== 'com.lennylxx.iptv') return false;
+  return true;
+}
+
@@ -100,10 +120,6 @@
       server = r.server;
       actualPort = r.port;
       appToken = r.appToken;
-      setupToken = r.setupToken;
-      pairingCode = r.pairingCode;
       console.log('[lan] HTTP server ready on port ' + actualPort);
       if (!keepAliveCreated) {
         service.activityManager.create('keepAlive', () => { /* keep service alive */ });
@@ -111,10 +127,8 @@
       for (const m of pendingStarts) {
         m.respond({
+          returnValue: true,
           running: true,
           port: actualPort,
           appToken,
-          setupToken,
-          pairingCode,
         });
       }
@@ -132,12 +146,16 @@
   service.register('start', (msg) => {
+    if (!isAuthorizedCaller(msg)) {
+      msg.respond({ returnValue: false, errorCode: -1, errorText: 'Unauthorized' });
+      return;
+    }
     console.log('[lan] start method invoked');
     if (actualPort !== null) {
       msg.respond({
+        returnValue: true,
         running: true,
         port: actualPort,
         appToken,
-        setupToken,
-        pairingCode,
       });
     } else {
@@ -151,19 +169,20 @@
   service.register('getInfo', (msg) => {
+    if (!isAuthorizedCaller(msg)) {
+      msg.respond({ returnValue: false, errorCode: -1, errorText: 'Unauthorized' });
+      return;
+    }
     if (actualPort !== null) {
       const ip = getLanIp();
-      const setupUrl = 'http://' + ip + ':' + actualPort + '/setup?token=' + setupToken;
       const manualUrl = 'http://' + ip + ':' + actualPort;
       msg.respond({
+        returnValue: true,
+        running: true,
         ip,
         port: actualPort,
-        setupUrl,
         manualUrl,
-        pairingCode,
-        dataDir,
-        appToken,
-        setupToken,
       });
     } else {
-      msg.respond({ error: 'Server not ready' });
+      msg.respond({ returnValue: false, error: 'Server not ready' });
     }
   });
@@ -180,6 +199,10 @@
   service.register('stop', (msg) => {
+    if (!isAuthorizedCaller(msg)) {
+      msg.respond({ returnValue: false, errorCode: -1, errorText: 'Unauthorized' });
+      return;
+    }
     console.log('[lan] stop method invoked');
@@ -212,6 +235,10 @@
   service.register('serviceEvents', (msg) => {
+    if (!isAuthorizedCaller(msg)) {
+      msg.respond({ returnValue: false, errorCode: -1, errorText: 'Unauthorized' });
+      return;
+    }
     if (msg.isSubscription) {
```

---

### 2.2 `bundled-service/src/lan/server.ts`

```diff
--- a/bundled-service/src/lan/server.ts
+++ b/bundled-service/src/lan/server.ts
@@ -16,6 +16,7 @@
   padStart,
   parseUrl,
   secureRandomInt,
+  timingSafeEqualString,
 } from '../compat';
@@ -28,6 +29,8 @@
 export interface StartServerOptions {
   isLoopback?: (req: http.IncomingMessage) => boolean;
   appToken?: string;
   setupToken?: string;
+  rotateOnSuccess?: boolean;
+  pairingTtlMs?: number;
 }
@@ -43,4 +46,6 @@
 const PAIRING_MAX_FAILURES = 5;
 const PAIRING_LOCK_MS = 60 * 1000;
+const GLOBAL_PAIRING_MAX_FAILURES = 20;
+const GLOBAL_PAIRING_LOCK_MS = 5 * 60 * 1000;
@@ -261,9 +266,8 @@
         sendJson(req, res, 200, {
           ip,
           port: parseInt(hostPort, 10) || boundPort,
           setupUrl: 'http://' + ip + ':' + hostPort + '/setup?token=' + setupToken,
           manualUrl: 'http://' + ip + ':' + hostPort,
-          pairingCode,
+          pairingCode: currentPairingCode(),
           dataDir,
-          appToken: isAppAuthorized(req, query) ? appToken : undefined,
         });
@@ -273,6 +277,17 @@
       } else if (pathname === '/pair' && req.method === 'POST') {
+        const now = Date.now();
+        if (globalBlockedUntil > now) {
+          sendJson(req, res, 429, {
+            error: 'Too many pairing attempts',
+            retryAfter: Math.ceil((globalBlockedUntil - now) / 1000),
+          });
+          return;
+        }
+        if (globalBlockedUntil > 0 && globalBlockedUntil <= now) {
+          globalBlockedUntil = 0;
+          globalFailures = 0;
+        }
         const client = req.socket.remoteAddress || 'unknown';
-        const now = Date.now();
         let current = pairingAttempts[client];
         if (current && current.blockedUntil > now) {
+          globalFailures += 1;
+          if (globalFailures >= GLOBAL_PAIRING_MAX_FAILURES) {
+            globalBlockedUntil = now + GLOBAL_PAIRING_LOCK_MS;
+            pairingCode = padStart(String(secureRandomInt(10000)), 4, '0');
+            pairingCodeCreatedAt = now;
+            try { onChange?.('setup-changed'); } catch { /* ignore */ }
+          }
           sendJson(req, res, 429, {
@@ -295,10 +310,25 @@
         }
-        if (submitted !== pairingCode) {
+        const expectedCode = currentPairingCode();
+        if (!timingSafeEqualString(submitted, expectedCode)) {
           const failures = (current?.failures || 0) + 1;
-          const blockedUntil = failures >= PAIRING_MAX_FAILURES ? now + PAIRING_LOCK_MS : 0;
+          globalFailures += 1;
+          if (globalFailures >= GLOBAL_PAIRING_MAX_FAILURES) {
+            globalBlockedUntil = now + GLOBAL_PAIRING_LOCK_MS;
+            pairingCode = padStart(String(secureRandomInt(10000)), 4, '0');
+            pairingCodeCreatedAt = now;
+            try { onChange?.('setup-changed'); } catch { /* ignore */ }
+            sendJson(req, res, 429, {
+              error: 'Too many pairing attempts',
+              retryAfter: Math.ceil(GLOBAL_PAIRING_LOCK_MS / 1000),
+            });
+            return;
+          }
+          let blockedUntil = 0;
+          if (failures >= PAIRING_MAX_FAILURES) {
+            const multiplier = Math.min(5, Math.pow(2, failures - PAIRING_MAX_FAILURES));
+            blockedUntil = now + Math.min(300 * 1000, PAIRING_LOCK_MS * multiplier);
+          }
@@ -306,6 +336,12 @@
         delete pairingAttempts[client];
+        globalFailures = 0;
+        if (options?.rotateOnSuccess) {
+          pairingCode = padStart(String(secureRandomInt(10000)), 4, '0');
+          pairingCodeCreatedAt = now;
+          try { onChange?.('setup-changed'); } catch { /* ignore */ }
+        }
         sendJson(req, res, 200, { token: setupToken });
```

---

### 2.3 `src/app.ts`

```diff
--- a/src/app.ts
+++ b/src/app.ts
@@ -501,8 +501,12 @@
       lunaRequest(`luna://${CONFIG.SERVICE_ID}`, {
         method: 'stop',
         parameters: {},
-        onSuccess: (resp: unknown) => log.info('Bundled service stop onSuccess:', JSON.stringify(resp)),
-        onFailure: (err: unknown) => log.warn('Bundled service stop onFailure:', JSON.stringify(err)),
+        onSuccess: () => log.info('Bundled service stop onSuccess'),
+        onFailure: (err: unknown) => {
+          const errText = (err && typeof err === 'object' && 'errorText' in err)
+            ? String((err as { errorText: unknown }).errorText)
+            : 'unknown error';
+          log.warn('Bundled service stop onFailure:', errText);
+        },
       });
@@ -557,11 +561,19 @@
-            if (resp && typeof resp === 'object' && 'port' in resp) {
-              const p = (resp as { port?: unknown }).port;
-              const token = (resp as { appToken?: unknown }).appToken;
-              if (typeof p === 'number') {
-                setServicePort(p, typeof token === 'string' ? token : null);
-              }
-            }
-            log.info('Bundled service start onSuccess:', JSON.stringify(resp));
+            let p: number | null = null;
+            let token: string | null = null;
+            let running = false;
+            if (resp && typeof resp === 'object') {
+              const r = resp as { port?: unknown; appToken?: unknown; running?: unknown };
+              if (typeof r.port === 'number') p = r.port;
+              if (typeof r.appToken === 'string') token = r.appToken;
+              if (typeof r.running === 'boolean') running = r.running;
+              if (p !== null) {
+                setServicePort(p, token);
+              }
+            }
+            log.info('Bundled service start onSuccess: running=' + running + ', port=' + p + ', hasToken=' + Boolean(token));
@@ -573,1 +585,4 @@
-            log.error('Bundled service start onFailure:', JSON.stringify(err));
+            const errObj = (err && typeof err === 'object' && 'errorText' in err)
+              ? String((err as { errorText: unknown }).errorText)
+              : 'unknown error';
+            log.error('Bundled service start onFailure:', errObj);
@@ -696,2 +711,5 @@
-          log.info('serviceEvents push:', JSON.stringify(resp));
+          const evt = (resp && typeof resp === 'object' && 'event' in resp)
+            ? String((resp as { event: unknown }).event)
+            : (resp && typeof resp === 'object' && (resp as { subscribed?: unknown }).subscribed ? 'subscribed' : 'unknown');
+          log.info('serviceEvents push: event=' + evt);
@@ -709,1 +727,4 @@
-          log.warn('serviceEvents subscription failed:', JSON.stringify(err));
+          const errText = (err && typeof err === 'object' && 'errorText' in err)
+            ? String((err as { errorText: unknown }).errorText)
+            : 'unknown error';
+          log.warn('serviceEvents subscription failed:', errText);
```

