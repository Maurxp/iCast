# AUDITORÍA DE SEGURIDAD LUNA SERVICE BUS (LS2)
## webOS IPTV Player v1.17.0 — Misión 1C

**Fecha:** 2026-10-29  
**Estado de la Auditoría:** APROBADA (FAIL-CLOSED)  
**Módulo Auditado:** `bundled-service/src/lan/service.ts` y `bundled-service/src/reminder/service.ts`  

---

## 1. Auditoría Método por Método

### 1.1 Método `start`
* **Firma Luna:** `luna://com.lennylxx.iptv.service/start`
* **Propósito:** Levantar el servidor HTTP en el puerto local y entregar la credencial de sesión a la aplicación webOS.
* **Política de Acceso:** `isAuthorizedCaller(msg)` estricto.
* **Respuesta No Autorizada:** `{ returnValue: false, errorCode: -1, errorText: 'Unauthorized' }`.
* **Respuesta Autorizada:** `{ returnValue: true, running: true, port: <number>, appToken: <string> }`.
* **Minimización de Datos Aplicada:**
  * `setupToken` **ELIMINADO**.
  * `pairingCode` **ELIMINADO**.
  * `setupUrl` **ELIMINADO**.
  * `manualUrl` **ELIMINADO**.
  * `ip` **ELIMINADO**.
* **Gestión de Concurrencia:** Si llegan múltiples llamadas `start` mientras el servidor HTTP se encuentra enlazando el socket (`bindInProgress = true`), se verifica la autorización antes de encolar en `pendingStarts`. Una vez enlazado, se responde a todas las peticiones autorizadas en cola de forma síncrona.

### 1.2 Método `getInfo`
* **Firma Luna:** `luna://com.lennylxx.iptv.service/getInfo`
* **Propósito:** Proveer información de red local necesaria para la pantalla de configuración manual del usuario.
* **Política de Acceso:** `isAuthorizedCaller(msg)` estricto.
* **Respuesta No Autorizada:** `{ returnValue: false, errorCode: -1, errorText: 'Unauthorized' }`.
* **Respuesta Autorizada:** `{ returnValue: true, running: true, port: <number>, ip: <string>, manualUrl: <string> }`.
* **Minimización de Datos Aplicada:**
  * `appToken` **ELIMINADO DEFINITIVAMENTE**.
  * `setupToken` **ELIMINADO**.
  * `pairingCode` **ELIMINADO**.
  * `dataDir` **ELIMINADO** (no filtra rutas absolutas del televisor).

### 1.3 Método `stop`
* **Firma Luna:** `luna://com.lennylxx.iptv.service/stop`
* **Propósito:** Liberar el puerto TCP cuando la aplicación pasa a segundo plano (`visibilityState === 'hidden'`).
* **Política de Acceso:** `isAuthorizedCaller(msg)` estricto.
* **Comportamiento:**
  * Vacia inmediatamente la lista de suscriptores (`subscribers.length = 0`).
  * Notifica a Activity Manager completando la actividad `keepAlive`.
  * Cierra el servidor HTTP mediante `server.close()`.
  * Responde `{ returnValue: true, stopped: true, droppedSubscribers: <number> }`.

### 1.4 Método `serviceEvents` (Canal Push de Suscripción)
* **Firma Luna:** `luna://com.lennylxx.iptv.service/serviceEvents` (con parámetro `"subscribe": true`)
* **Propósito:** Notificar a la app de la TV cambios en listas M3U (`uploads-changed`) o acciones de setup encoladas (`setup-changed`).
* **Política de Acceso:** `isAuthorizedCaller(msg)` estricto.
* **Seguridad en Suscripción:**
  * La autorización se comprueba **antes** de evaluar `msg.isSubscription` y antes de añadir el llamador a `subscribers`.
  * Un llamador no autorizado **nunca** es registrado en memoria.
  * Se registra un listener de ciclo de vida (`msg.on('cancel', ...)`) para desregistrar automáticamente a los clientes que se desconecten o se destruyan, evitando fugas de memoria (*memory leaks*).
  * Los mensajes de broadcast emiten únicamente `{ event: 'uploads-changed' }` o `{ event: 'setup-changed' }`. No contienen tokens, datos de listas ni metadatos de usuario.

### 1.5 Método `heartbeat`
* **Firma Luna:** `luna://com.lennylxx.iptv.service/heartbeat`
* **Propósito:** Verificación de salud interna del proceso de servicio.
* **Política de Acceso:** `isAuthorizedCaller(msg)` estricto (Endurecido en Misión 1C).
* **Respuesta:** `{ returnValue: true, running: !!server, port: actualPort }`.

---

## 2. Cobertura de Pruebas de Seguridad Luna

La suite `bundled-service/src/lan/service.test.ts` implementa **28 pruebas automatizadas** que cubren todos los vectores de ataque y casos borde requeridos:

```
✓ Unit: isAuthorizedCaller policy verification (Misión 1C Fase B) (12)
  ✓ allows message with legitimate applicationId
  ✓ allows message with legitimate sender
  ✓ allows message with legitimate callerId
  ✓ allows message with matching multiple claims
  ✓ denies message with alien applicationId
  ✓ denies message with absent identity claims (fail-closed)
  ✓ denies message with empty string identity claims
  ✓ denies null or undefined or primitive messages
  ✓ denies contradictory claims (applicationId legitimate but sender is alien)
  ✓ denies contradictory claims (applicationId legitimate but callerId is alien)
  ✓ denies client trying to spoof applicationId in payload body instead of LS2 metadata
  ✓ denies prefix or suffix substring mimic attempts
✓ Integration: Luna Service Security & Methods (Misión 1C Fase B) (16)
  ✓ start method > returns port and appToken to authorized caller without setupToken or pairingCode
  ✓ start method > rejects unauthorized caller applicationId com.malicious.app
  ✓ start method > rejects caller when applicationId is absent (strict fail-closed, no luna-send bypass)
  ✓ getInfo method > returns only public operational info to authorized caller and zero secrets
  ✓ getInfo method > rejects unauthorized caller for getInfo
  ✓ getInfo method > rejects absent caller identity for getInfo (fail-closed)
  ✓ heartbeat method > reports server running status and port only to authorized caller
  ✓ heartbeat method > rejects unauthorized caller for heartbeat
  ✓ heartbeat method > rejects heartbeat call with absent identity (fail-closed)
  ✓ stop and lifecycle > rejects stop from unauthorized caller
  ✓ stop and lifecycle > rejects stop from absent identity (fail-closed)
  ✓ stop and lifecycle > stops the server and drops subscribers when invoked by authorized caller
  ✓ serviceEvents subscription > rejects subscription from unauthorized caller without storing subscriber
  ✓ serviceEvents subscription > rejects subscription from absent identity
  ✓ serviceEvents subscription > accepts subscription from authorized caller
  ✓ concurrency and repeated calls > handles concurrent authorized calls correctly without state corruption
```

---

## 3. Protocolo de Validación Pendiente en Hardware Físico (LG 65UM7400PDA)

Aunque la lógica en TypeScript/Node.js es estrictamente fail-closed y pasa todas las pruebas con mocks representativos del modelo LS2, el comportamiento exacto de los campos internos de `libluna-service2` en el firmware comercial `webOS TV Lite 4.10.2-29` requiere confirmación empírica una vez desplegado en el televisor real:

1. **Inspección de Envoltura de Mensaje Real:**  
   Verificar mediante volcado controlado en consola de depuración si `webos-service` en Node 0.12.2 expone `msg.applicationId` como propiedad directa o si en webOS TV 4 comercial expone `msg.sender = 'com.lennylxx.iptv'`. (Nuestra implementación acepta válidamente cualquiera de los dos, siempre que no existan contradicciones).
2. **Comportamiento ante `luna-send` en Consola SSH:**  
   Confirmar que al invocar `luna-send -n 1 luna://com.lennylxx.iptv.service/start '{}'` desde el shell root del televisor, el servicio rechaza la llamada con `returnValue: false, errorText: 'Unauthorized'` debido a la ausencia de `applicationId` de aplicación, demostrando en vivo la política fail-closed.
3. **Resistencia de Suscripción durante Ciclos de Suspender/Reanudar:**  
   Confirmar que al suspender la pantalla de la TV y volverla a encender, el listener `cancel` en `serviceEvents` limpia el suscriptor huérfano sin dejar referencias muertas en el proceso Node.js.

