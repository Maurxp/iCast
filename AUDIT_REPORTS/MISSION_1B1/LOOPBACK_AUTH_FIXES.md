# IMPLEMENTACIÓN Y CORRECCIONES DEL BYPASS DE LOOPBACK — LOOPBACK AUTH FIXES
## webOS IPTV Player v1.17.0 — Misión 1B.1

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Chromium 53 / Node.js 0.12.2)  
**Fecha:** 2026-10-29  
**Estado:** Modificado, Probado y Verificado  

---

## 1. Resumen de Defectos Corregidos

1. **Eliminación de `isLoopbackOrAuthorized`:** Anteriormente, cualquier solicitud con `isLoopback(req) === true` recibía autorización inmediata sin comprobar tokens. Esto permitía a cualquier script en `com.webos.app.browser` acceder a datos protegidos.
2. **Protección Integral de `/info`:** Anteriormente `/info` era anónimo en loopback. Ahora requiere estrictamente `appToken`.
3. **Distribución de `appToken` a través de Luna:** La aplicación webOS ahora recibe `appToken` en la respuesta IPC de Luna (`luna://com.lennylxx.iptv.service/start` y método `getInfo`).
4. **Clientes HTTP de la App Sincronizados:** `service-http.ts`, `upload-client.ts` y `setup-client.ts` ahora transmiten automáticamente el `appToken` tanto en encabezados `Authorization: Bearer` / `X-App-Token` como en parámetros de consulta de reproducción `<video>`.

---

## 2. Detalle de Modificaciones por Archivo

### 2.1 `bundled-service/src/lan/server.ts`
* **Generación de `appToken`:**
  ```typescript
  const appToken = crypto.randomBytes(16).toString('hex');
  ```
* **Extracción Unificada de Tokens:**
  Soporta encabezados `Authorization: Bearer <token>`, `X-App-Token: <token>`, `X-Setup-Token: <token>` y parámetro URL `?token=<token>`.
* **Comprobación Diferenciada de Autoridad:**
  * `isAuthorized(req, query)`: Verifica si el token presentado coincide con `setupToken` o `appToken`.
  * `isAppAuthorized(req, query)`: Verifica estrictamente si el token coincide con `appToken`.
* **Protección de Rutas Sensibles:**
  * `pathname === '/info'`: Requiere `isAppAuthorized` (403 si falta o si se usa `setupToken`).
  * `pathname === '/setup-state' && req.method === 'PUT'`: Requiere `isAppAuthorized`.
  * `pathname === '/setup-actions' && req.method === 'GET'`: Requiere `isAppAuthorized`.
  * `pathname.indexOf('/setup-actions/') === 0 && req.method === 'DELETE'`: Requiere `isAppAuthorized`.
  * `pathname === '/uploads'`: Requiere `isAuthorized`. Incluye el token activo en las URLs devueltas para reproducción de medios.
  * `pathname.indexOf('/uploads/') === 0`: `GET` (descarga) y `DELETE` requieren `isAuthorized`.
* **Firma de Retorno de `startServer`:**
  Devuelve `StartServerResult: { server, port, setupToken, appToken, pairingCode }`.

### 2.2 `bundled-service/src/lan/service.ts`
* El servicio Node registra internamente `appToken`, `setupToken` y `pairingCode` al llamar a `startServer`.
* En el método Luna `start`:
  ```typescript
  message.respond({
    running: true,
    port: lanServer.port,
    appToken: lanServer.appToken,
    setupToken: lanServer.setupToken,
    pairingCode: lanServer.pairingCode,
  });
  ```
* Se añadió el método Luna `getInfo` para consulta segura en caliente por parte de la app TV, retornando `appToken` junto a la configuración del servicio.

### 2.3 `src/services/service-http.ts`
* Incorporación de estado reactivo para `runtimeAppToken`:
  ```typescript
  let runtimeAppToken: string | null = null;

  export function setServicePort(port: number | null, appToken: string | null = null): void {
    runtimePort = port;
    runtimeAppToken = appToken;
  }
  ```
* Exportación de ayudantes de autenticación:
  * `serviceAuthToken(): string | null`
  * `serviceAuthHeaders(): Record<string, string>`
  * `serviceRequestOptions(extra?: RequestInit): RequestInit`: Incorpora de forma segura los encabezados `Authorization: Bearer <appToken>` y `X-App-Token: <appToken>`.

### 2.4 `src/app.ts`
* En el arranque del servicio bundled (`startBundledService`):
  ```typescript
  this.setupClient.startService((res) => {
    if (res.running && res.port) {
      setServicePort(res.port, res.appToken || null);
    }
  });
  ```

### 2.5 `src/services/upload-client.ts` y `src/services/setup-client.ts`
* Todas las peticiones `fetchWithTimeout` hacia el servicio local utilizan `serviceRequestOptions(...)`.
* En `UploadClient.list()`, cada subida incluye automáticamente `?token=<appToken>` en su propiedad `url` si el backend no lo tuviera adjunto, garantizando que el elemento `<video>` nativo de webOS reproduzca sin error 403.

---

## 3. Pruebas de Regresión y Validación Automatizada

Se implementaron pruebas exhaustivas en `bundled-service/src/lan/server.test.ts` organizadas en la suite `Loopback Protection against Hostile Web Pages (Frente A)`:

| Escenario Probado | Método y Ruta | Token Enviado | Resultado Esperado | Resultado Real |
| :--- | :---: | :---: | :---: | :---: |
| Intento de exfiltración de metadatos desde loopback | `GET /info` | Ninguno | `403 Forbidden` | `403 Forbidden` (Pasa) |
| Intento de acceso a `/info` con token de configuración | `GET /info` | `setupToken` | `403 Forbidden` | `403 Forbidden` (Pasa) |
| Acceso legítimo a `/info` desde la app webOS | `GET /info` | `appToken` (Bearer) | `200 OK` | `200 OK` (Pasa) |
| Intento de enumerar subidas desde loopback | `GET /uploads` | Ninguno | `403 Forbidden` | `403 Forbidden` (Pasa) |
| Intento de descargar archivo M3U desde loopback | `GET /uploads/p.m3u`| Ninguno | `403 Forbidden` | `403 Forbidden` (Pasa) |
| Intento de borrado de subida desde loopback | `DELETE /uploads/p`| Ninguno | `403 Forbidden` | `403 Forbidden` (Pasa) |
| Intento de leer acciones pendientes desde loopback | `GET /setup-actions`| Ninguno | `403 Forbidden` | `403 Forbidden` (Pasa) |
| Intento de inyectar acciones sin token | `POST /setup-actions`| Ninguno | `403 Forbidden` | `403 Forbidden` (Pasa) |
| Intento de alterar estado del sistema | `PUT /setup-state` | Ninguno | `403 Forbidden` | `403 Forbidden` (Pasa) |
| Acceso autorizado de la app a subidas | `GET /uploads` | `appToken` | `200 OK` | `200 OK` (Pasa) |
| Acceso autorizado del teléfono a subidas | `GET /uploads` | `setupToken` | `200 OK` | `200 OK` (Pasa) |

Resultado de la suite: **86 de 86 pruebas superadas en `server.test.ts`**.

