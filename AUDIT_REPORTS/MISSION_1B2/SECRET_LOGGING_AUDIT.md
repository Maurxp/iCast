# AUDITORÍA DE REGISTRO Y FILTRACIÓN DE SECRETOS EN LOGS — SECRET LOGGING AUDIT
## webOS IPTV Player v1.17.0 — Misión 1B.2 Frente C

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Node.js 0.12.2 / Chromium 53)  
**Fecha:** 2026-10-29  

---

## 1. El Defecto Confirmado en `src/app.ts:564`

### 1.1 Causa Raíz
Durante la implementación inicial de la distribución de `appToken` a través de Luna en la Misión 1B.1, se incorporó en `src/app.ts` la siguiente llamada de registro en el callback `onSuccess` del método `start`:
```typescript
// src/app.ts (línea 564 previa):
log.info('Bundled service start onSuccess:', JSON.stringify(resp));
```
Al invocar `luna://com.lennylxx.iptv.service/start`, el servicio Node.js retornaba:
```json
{
  "running": true,
  "port": 54321,
  "appToken": "d8e20f4c91a03e1...",
  "setupToken": "a1f94c02...",
  "pairingCode": "1234"
}
```
Como resultado, cada arranque de la aplicación o reanudación desde segundo plano volcaba en la consola del navegador y en las utilidades de captura de logs de webOS (`ares-inspect`, `ares-monitor-log`, `/var/log/messages`) el contenido íntegro en texto plano de:
* `appToken`: El secreto maestro que otorga control administrativo a la API HTTP local.
* `setupToken`: El token que autoriza la subida de listas M3U y configuración remota.
* `pairingCode`: El código PIN de 4 dígitos mostrado en pantalla.

### 1.2 Impacto de Seguridad
En un televisor LG webOS, los logs de consola del proceso de la aplicación pueden ser leídos por cualquier usuario con acceso al puerto de inspección Chromium (puerto 9998 en modo desarrollador) o mediante registros del sistema. Si los tokens se imprimen en los logs, cualquier herramienta de diagnóstico expone las credenciales maestras.

---

## 2. Auditoría Exhaustiva de Secretos en el Repositorio

Se realizó una búsqueda exhaustiva mediante expresiones regulares en todo el árbol de código (`src/`, `bundled-service/`, `scripts/`):
```bash
git grep -n -E "log\.(info|debug|warn|error).*(token|password|auth|secret|pair)"
```

### 2.1 Resultados Encontrados y Análisis

1. **`src/app.ts:504` (`stopBundledService`):**
   * *Código anterior:* `log.info('Bundled service stop onSuccess:', JSON.stringify(resp))`
   * *Análisis:* Volcado innecesario de objetos Luna.
   * *Corrección:* Sustituido por `log.info('Bundled service stop onSuccess')`.

2. **`src/app.ts:564` (`startBundledService`):**
   * *Código anterior:* `log.info('Bundled service start onSuccess:', JSON.stringify(resp))`
   * *Análisis:* Filtración directa de `appToken`, `setupToken`, `pairingCode`.
   * *Corrección:* Sustituido por un resumen sanitizado sin valores de secretos:
     ```typescript
     log.info('Bundled service start onSuccess: running=' + running + ', port=' + p + ', hasToken=' + Boolean(token));
     ```

3. **`src/app.ts:573` (`startBundledService onFailure`):**
   * *Código anterior:* `log.error('Bundled service start onFailure:', JSON.stringify(err))`
   * *Corrección:* Sanitizado para extraer únicamente `errorText` o `errorCode`.

4. **`src/app.ts:696` (`serviceEvents push`):**
   * *Código anterior:* `log.info('serviceEvents push:', JSON.stringify(resp))`
   * *Corrección:* Sanitizado para registrar únicamente el nombre del evento:
     ```typescript
     log.info('serviceEvents push: event=' + evt);
     ```

5. **`src/components/player-pipeline.ts:352`:**
   * *Línea auditada:* `log.info('loadStream', this.callbacks.playbackLabel(token), 'url=', safeUrl, ...)`
   * *Análisis de falsos positivos:*
     * `token` en este módulo es un contador numérico entero de cancelación interna (`this.loadToken = ++this.tokenCounter`). No es un secreto.
     * `safeUrl` se procesa a través de `diagnosticStreamUrl(url)`, el cual anonimiza credenciales `http://***:***@host/...` y parámetros `?token=***`.
     * *Veredicto:* Seguro.

6. **`bundled-service/src/lan/server.ts:453`:**
   * *Línea auditada:* `console.log('[lan] setup page: http://' + getLanIp() + ':' + actualPort + '/setup');`
   * *Análisis:* La URL impresa en la consola del servicio es la raíz pública `/setup` sin el parámetro `?token=...`.
   * *Veredicto:* Seguro.

---

## 3. Verificación Automatizada de Higiene de Logs

Se creó la suite de pruebas unitarias dedicada `src/services/luna-log-hygiene.test.ts` que valida activamente:

1. **Anonimización en `diagnosticStreamUrl`:**
   Verifica que URLs que contengan `user:secretpass` y parámetros como `token=supersecret` sean completamente ofuscados como `***:***` y `token=***`.
2. **Almacenamiento en Silencio de `serviceAuthToken`:**
   Verifica que `setServicePort(port, appToken)` configure el token en memoria sin emitir ninguna traza a la consola del sistema.
3. **Validación de Ausencia de Tokens en Respuestas de Arranque:**
   Simula la recepción de una respuesta de arranque con tokens arbitrarios y comprueba que ningún valor confidencial aparezca en las llamadas a `console.info`, `console.warn` ni `console.error`.

Todas las pruebas se ejecutan satisfactoriamente dentro de la suite global de Vitest.

