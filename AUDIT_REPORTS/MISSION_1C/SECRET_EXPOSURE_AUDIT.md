# AUDITORÍA DE EXPOSICIÓN DE SECRETOS Y PRIVACIDAD
## webOS IPTV Player v1.17.0 — Misión 1C

**Fecha:** 2026-10-29  
**Estado:** AUDITORÍA CONCLUIDA — CERO SECRETOS EXPUESTOS  

---

## 1. Alcance de la Auditoría

Se realizó una inspección exhaustiva de todo el código fuente y las capas operativas de la aplicación y su servicio empaquetado para identificar posibles fugas de información sensible:
* Tokens de autenticación (`appToken`, `setupToken`).
* Códigos PIN de emparejamiento.
* Credenciales de proveedores IPTV (usuario y contraseña Xtream / M3U).
* URLs de reproducción completas que contengan credenciales incrustadas.
* Direcciones IP y rutas de almacenamiento internas del televisor.

---

## 2. Puntos Críticos Auditados y Correcciones Aplicadas

### 2.1 Sanitización de Registros en el Bootstrap de la Aplicación (`src/app.ts`)
* **Defecto Histórico:** En `src/app.ts:564`, el callback `onSuccess` del método Luna `start` ejecutaba:
  ```typescript
  // DEFECTO PREVIO (VULNERABLE):
  log.info('Bundled service start onSuccess:', JSON.stringify(resp));
  ```
  Esto volcaba en la consola del televisor y en `ares-inspect` el objeto completo de respuesta, exponiendo `appToken`, `setupToken` y `pairingCode` en texto plano.
* **Solución Implementada:** Se sustituyó por banderas booleanas y numéricas seguras:
  ```typescript
  log.info('Bundled service start onSuccess: running=' + running + ', port=' + p + ', hasToken=' + Boolean(token));
  ```
* **Endpoints Auxiliares Auditados:** Se verificaron y sanitizaron `startBundledService.onFailure`, `stopBundledService.onSuccess` y `subscribeToServiceEvents.onSuccess`.

### 2.2 Redacción de Credenciales en Carga de Playlists (`src/services/playlist-service.ts`)
* **Hallazgo en Misión 1C:** Si una lista de reproducción Xtream o M3U fallaba durante la carga o disparaba eventos de categorías, el servicio imprimía `pl.name || pl.url`. Cuando el usuario no había asignado un nombre explícito a la lista, `pl.url` contenía credenciales en texto plano (ejemplo: `http://servidor:8080/get.php?username=XXX&password=YYY`).
* **Corrección Implementada en M1C:** Se importó y aplicó `diagnosticStreamUrl(pl.url)` en todos los puntos de registro de `playlist-service.ts`:
  * En aviso de nuevas categorías Xtream (línea 217).
  * En temporizador de fetch de lista (línea 439).
  * En error de carga de lista Xtream (línea 587).
  * En error de carga de lista genérica (línea 593).
* **Mecanismo de `diagnosticStreamUrl`:**
  * Reemplaza el usuario y contraseña del Authority URL por `***`.
  * Ofusca segmentos de ruta privados (`/live/***/***`).
  * Enmascara parámetros de consulta como `token`, `key`, `user`, `pass` y `signature`.

### 2.3 Respuestas IPC del Bus Luna (`bundled-service/src/lan/service.ts`)
* **Método `start`:** Devuelve únicamente `port` y `appToken`. `setupToken` y `pairingCode` fueron excluidos.
* **Método `getInfo`:** Devuelve únicamente métricas de red pública (`port`, `ip`, `manualUrl`). Se eliminaron `appToken`, `setupToken`, `pairingCode` y `dataDir`.
* **Método `serviceEvents`:** Los mensajes emitidos por el bus contienen únicamente el nombre del evento (`{ event: 'uploads-changed' }` o `{ event: 'setup-changed' }`). No viaja ninguna credencial ni información privada por la suscripción.

### 2.4 Respuestas HTTP del Servicio LAN (`bundled-service/src/lan/server.ts`)
* **Endpoint `GET /info`:** Se eliminó la propiedad `appToken`.
* **Endpoint `GET /uploads`:** Entrega URLs firmadas con `setupToken` únicamente a clientes que ya hayan demostrado posesión de `appToken` o `setupToken`.

---

## 3. Pruebas Automatizadas de Higiene de Secretos

La suite `src/services/luna-log-hygiene.test.ts` verifica de forma automatizada las salvaguardas de privacidad:

1. **Redacción en URLs de Diagnóstico:**
   * Verifica que `http://usuario:secreto@servidor:8080/live/u1/p1/ch.m3u8?token=xyz` sea transformado en `http://***:***@servidor:8080/live/***/***/ch.m3u8?token=***`.
2. **Almacenamiento Silencioso en Memoria:**
   * Verifica que `serviceAuthToken()` almacene y retorne el token de autenticación sin emitir trazas de log ni exponerlo en almacenamiento local persistente.
3. **Resumen Sanitizado de Inicio:**
   * Verifica que el formato del log de inicio no contenga secuencias alfanuméricas del token y solo reporte la presencia del indicador booleano.

