# REDUCCIÓN DE EXPOSICIÓN DE TOKENS HTTP Y CICLO DE VIDA DE URLs — HTTP TOKEN EXPOSURE
## webOS IPTV Player v1.17.0 — Misión 1B.2 Frente D

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Chromium 53 / Node.js 0.12.2)  
**Fecha:** 2026-10-29  

---

## 1. Eliminación de `appToken` en la Respuesta de `GET /info`

### 1.1 El Problema de Exposición Redundante
En la implementación de la Misión 1B.1, la ruta HTTP interna `/info` en `bundled-service/src/lan/server.ts` devolvía:
```typescript
sendJson(req, res, 200, {
  ip,
  port: parseInt(hostPort, 10) || boundPort,
  setupUrl: 'http://' + ip + ':' + hostPort + '/setup?token=' + setupToken,
  manualUrl: 'http://' + ip + ':' + hostPort,
  pairingCode,
  dataDir,
  appToken: isAppAuthorized(req, query) ? appToken : undefined,
});
```
* **Análisis de Riesgo:**
  Para que la petición a `/info` fuera exitosa, el cliente **ya debía conocer y enviar `appToken`** (mediante el encabezado `Authorization: Bearer <appToken>` o `X-App-Token`).
  Devolver nuevamente el `appToken` en el cuerpo JSON de la respuesta era una redundancia peligrosa. Si cualquier intermediario, proxy de depuración en red local o script cliente realizaba una captura de la respuesta HTTP, el token volvía a transmitirse innecesariamente por la red.

### 1.2 Corrección Implementada
Se eliminó la propiedad `appToken` de la respuesta JSON de `GET /info`:
```typescript
sendJson(req, res, 200, {
  ip,
  port: parseInt(hostPort, 10) || boundPort,
  setupUrl: 'http://' + ip + ':' + hostPort + '/setup?token=' + setupToken,
  manualUrl: 'http://' + ip + ':' + hostPort,
  pairingCode: currentPairingCode(),
  dataDir,
});
```
* **Impacto en el Cliente TV:**
  La interfaz `ServiceInfo` en `src/services/setup-client.ts`:
  ```typescript
  export interface ServiceInfo {
    ip: string;
    port: number;
    setupUrl: string;
    manualUrl: string;
    pairingCode: string;
    dataDir?: string;
  }
  ```
  no requería ni utilizaba `appToken`. La pantalla de Ajustes (`src/components/settings.ts`) consume exclusivamente `setupUrl` (para renderizar el código QR), `manualUrl` y `pairingCode`. Por tanto, el cambio reduce la superficie de exposición a cero sin alterar la experiencia de usuario.

---

## 2. Ciclo de Vida de URLs de Video y Listas M3U Subidas

### 2.1 Requisitos de Reproducción en Chromium 53 (webOS 4)
En LG webOS 4 (Chromium 53), la reproducción de listas o medios locales a través del elemento `<video>` nativo o llamadas `fetch()` tiene restricciones particulares:
1. Las etiquetas `<video src="...">` del navegador nativo no permiten configurar encabezados HTTP personalizados (`Authorization: Bearer` o `X-App-Token`).
2. Para que el pipeline multimedia nativo de webOS reproduzca un archivo subido servido por el servidor HTTP local sin fallar con error `403 Forbidden`, la URL debe autenticarse mediante un parámetro de consulta (`query parameter`):
   ```text
   http://127.0.0.1:54321/uploads/my-list.m3u?token=d8e20f4c91a03e1...
   ```

### 2.2 Reconciliación Dinámica ante Reinicio del Servicio
Dado que el puerto HTTP y los tokens del servicio se regeneran aleatoriamente cada vez que el servicio Node.js se reinicia (por ejemplo, tras reanudar la app desde segundo plano):
1. **Identificador Estable de Subida:** Cada lista subida tiene un `uploadId` persistido en disco (slug del nombre de archivo, e.g. `my-list`).
2. **Reconciliación en `UploadClient.reconcile()`:**
   Al arrancar el servicio:
   * La app TV invoca `startBundledService()` y obtiene el nuevo `port` y el nuevo `appToken`.
   * Ejecuta `setServicePort(port, appToken)`.
   * Invoca `UploadClient.reconcile()`.
   * `UploadClient` consulta `GET /uploads`, obtiene las URLs actualizadas con el nuevo puerto y token:
     ```typescript
     const previous = prevUpload.find((p) => uploadIdFromUrl(p.url) === u.id);
     return {
       id: previous?.id ?? genPlaylistId(),
       name: u.name,
       url: u.url, // URL actualizada con nuevo puerto y token
       source: 'upload',
       ...
     };
     ```
   * Si la URL ha cambiado por el reinicio del puerto o token, `StorageService.setPlaylists(...)` actualiza el registro en almacenamiento persistente de forma transparente.
3. **Ausencia de Desincronización:**
   Este ciclo garantiza que:
   * La expiración o cambio de token ante reinicios no rompe la reproducción de canales de listas subidas.
   * Las peticiones continúan autenticadas sin degradar la seguridad.

---

## 3. Matriz de Exposición de Tokens HTTP

| Endpoint | Método | Tokens Requeridos | Tokens Expuestos en Respuesta | Estado de Hardening |
| :--- | :---: | :--- | :---: | :---: |
| `/info` | `GET` | `appToken` (Bearer o X-App-Token) | **Ninguno** (`appToken` eliminado) | ✅ Seguro |
| `/pair` | `POST` | `pairingCode` (PIN de 4 dígitos) | `setupToken` (al validar PIN) | ✅ Protegido por rate-limiting |
| `/setup-state` | `PUT` | `appToken` | **Ninguno** | ✅ Seguro |
| `/setup-state` | `GET` | `appToken` o `setupToken` | **Ninguno** (credenciales filtradas) | ✅ Seguro |
| `/setup-actions` | `GET` / `DELETE`| `appToken` | **Ninguno** | ✅ Seguro |
| `/setup-actions` | `POST`| `setupToken` o `appToken` | **Ninguno** | ✅ Seguro |
| `/uploads` | `GET` | `setupToken` o `appToken` | URLs firmadas con token activo | ✅ Seguro (mínimo necesario para `<video>`) |
| `/uploads/:id` | `GET` / `DELETE`| `setupToken` o `appToken` | Contenido M3U / estado | ✅ Seguro |

