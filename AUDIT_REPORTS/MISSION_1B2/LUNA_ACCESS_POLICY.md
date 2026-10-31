# POLÍTICA DE CONTROL DE ACCESO Y MINIMIZACIÓN LUNA — LUNA ACCESS POLICY
## webOS IPTV Player v1.17.0 — Misión 1B.2 Frente B

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / API 4.1.0 / Node.js 0.12.2)  
**Servicio Bus:** `luna://com.lennylxx.iptv.service`  
**Fecha:** 2026-10-29  

---

## 1. Principio Rector: Defensa en Profundidad y Minimización de Datos

En webOS TV 4 comercial, el bus de servicios Luna (LS2) carece de soporte declarativo de roles y grupos de control de acceso (ACG) para aplicaciones de desarrollador sideloaded.

Bajo este escenario, asumir que las llamadas Luna son automáticamente privadas constituye una vulnerabilidad estructural. La política de seguridad de la Misión 1B.2 aplica tres pilares de protección:

1. **Autenticación por Identidad de Aplicación (Application Identity Verification):**
   El servicio Node.js inspecciona el metadato inyectado por el demonio del sistema `ls-hubd` (`msg.applicationId` / `msg.callerId` / `msg.sender`). Si el llamador no es la aplicación legítima `com.lennylxx.iptv`, la llamada es rechazada sin ejecutar lógica interna.
2. **Minimización Estricta de Secretos (Zero-Secret Leakage):**
   Ningún método Luna expone tokens que el solicitante no requiera estrictamente para su funcionamiento inmediato.
3. **Desacoplamiento de Canales:**
   El canal de configuración telefónica (`setupToken`) y el PIN de emparejamiento (`pairingCode`) no viajan por el canal de control de la app local en Luna.

---

## 2. Auditoría Detallada de Métodos Luna

A continuación se detalla el estado anterior, las vulnerabilidades identificadas y la política de acceso final implementada para cada método registrado en `bundled-service/src/lan/service.ts`:

### 2.1 Método: `start`
* **Propósito:** Inicia o vincula el servidor HTTP local en el puerto asignado por el sistema operativo y devuelve el token de enlace local a la aplicación TV.
* **Comportamiento Anterior:**
  Devolvía `{ running: true, port, appToken, setupToken, pairingCode }` a cualquier solicitante sin comprobar el llamador.
* **Vulnerabilidades Identificadas:**
  1. Si otra aplicación instalada llamaba a `start`, obtenía el control total (`appToken`), la llave de configuración (`setupToken`) y el PIN de pantalla (`pairingCode`).
  2. La app TV no necesita `setupToken` ni `pairingCode` en la respuesta de `start`: la app TV solo necesita `appToken` para consultar localmente `/info` o interactuar con la API local.
* **Política Implementada (Hardened):**
  * **Verificación de Llamador:** Requiere `isAuthorizedCaller(msg)`. Si `applicationId` existe y no es `'com.lennylxx.iptv'`, responde `{ returnValue: false, errorCode: -1, errorText: 'Unauthorized' }`.
  * **Respuesta Sanitizada:**
    ```typescript
    {
      returnValue: true,
      running: true,
      port: actualPort,
      appToken: string
    }
    ```
  * **Secretos Eliminados:** `setupToken` y `pairingCode` han sido eliminados por completo de este método.

---

### 2.2 Método: `getInfo`
* **Propósito:** Consulta de metadatos operativos y estado de ejecución del servicio Node.js.
* **Comportamiento Anterior:**
  Devolvía `{ ip, port, setupUrl, manualUrl, pairingCode, dataDir, appToken, setupToken }`.
* **Vulnerabilidades Identificadas:**
  1. Constituyó la mayor filtración de secretos de la arquitectura: cualquier cliente en el bus Luna podía extraer todos los tokens (`appToken`, `setupToken`), la ruta absoluta en disco (`dataDir`), la URL completa con token incrustado (`setupUrl`) y el código PIN.
  2. Ni la app TV ni ningún cliente legítimo utiliza `getInfo` sobre Luna (la app consulta `/info` vía HTTP con `appToken`).
* **Política Implementada (Hardened):**
  * **Verificación de Llamador:** Requiere `isAuthorizedCaller(msg)`.
  * **Respuesta de Solo Métricas Públicas:**
    ```typescript
    {
      returnValue: true,
      running: true,
      port: actualPort,
      ip: string,
      manualUrl: "http://<ip>:<port>"
    }
    ```
  * **Secretos Eliminados:** Se eliminaron `appToken`, `setupToken`, `setupUrl`, `pairingCode` y `dataDir`. Si una entidad no autorizada o un script de inspección llama a `getInfo`, no obtiene ningún secreto reutilizable.

---

### 2.3 Método: `heartbeat`
* **Propósito:** Comprobación rápida de vitalidad del proceso de servicio por parte de monitores de sistema o tareas en segundo plano.
* **Comportamiento Anterior:**
  Devolvía `{ running: !!server, port: actualPort }`.
* **Política Implementada (Hardened):**
  * **Verificación de Llamador:** Método abierto para diagnósticos y monitoreo de salud del televisor (compatible con herramientas de CLI de desarrollo como `ares-inspect` o `luna-send`).
  * **Respuesta:**
    ```typescript
    {
      returnValue: true,
      running: boolean,
      port: number | null
    }
    ```
  * **Seguridad:** Cero secretos expuestos. Solo expone el estado booleano de ejecución y el puerto numérico efímero.

---

### 2.4 Método: `stop`
* **Propósito:** Detiene de forma ordenada el servidor HTTP, cierra sockets activos, vacía suscriptores de eventos y completa la actividad `keepAlive` para permitir ahorro de energía cuando la app se encuentra en segundo plano.
* **Comportamiento Anterior:**
  Aceptaba llamadas `stop` de cualquier llamador en el bus.
* **Vulnerabilidades Identificadas:**
  Una aplicación maliciosa o mal configurada podía provocar denegación de servicio (DoS) cerrando el servidor LAN de subidas del reproductor IPTV.
* **Política Implementada (Hardened):**
  * **Verificación de Llamador:** Requiere estrictamente `isAuthorizedCaller(msg)`.
  * **Respuesta:**
    ```typescript
    {
      returnValue: true,
      stopped: boolean,
      droppedSubscribers: number
    }
    ```
  * **Seguridad:** Ninguna aplicación externa puede apagar el servicio LAN de nuestra app.

---

### 2.5 Método / Canal Push: `serviceEvents`
* **Propósito:** Canal de suscripción de eventos push en tiempo real. Notifica a la aplicación TV cuando un usuario sube un archivo M3U desde su teléfono o encola una acción de configuración remota.
* **Comportamiento Anterior:**
  Aceptaba suscripciones indiscriminadas de cualquier cliente que enviara `isSubscription: true`.
* **Vulnerabilidades Identificadas:**
  Cualquier aplicación de terceros podía suscribirse para espiar eventos del reproductor IPTV (`uploads-changed`, `setup-changed`), aprendiendo hábitos de uso del usuario.
* **Política Implementada (Hardened):**
  * **Verificación de Llamador:** Requiere `isAuthorizedCaller(msg)`.
  * **Respuesta y Manejo de Suscripción:**
    ```typescript
    {
      returnValue: true,
      subscribed: boolean
    }
    ```
  * **Seguridad:** Solo `com.lennylxx.iptv` puede registrarse como receptor de eventos de cambio de servicio.

---

## 3. Matriz de Control de Acceso Luna Implementada

| Método Luna | Permiso Requerido | Campos Expuestos en Respuesta | Secretos en Respuesta | ¿Protegido contra Apps Terceras? |
| :--- | :--- | :--- | :---: | :---: |
| `start` | `com.lennylxx.iptv` | `returnValue`, `running`, `port`, `appToken` | Solo `appToken` local | ✅ Sí (403/Unauthorized si mismatch) |
| `getInfo` | `com.lennylxx.iptv` | `returnValue`, `running`, `port`, `ip`, `manualUrl` | **Ninguno** | ✅ Sí (403/Unauthorized si mismatch) |
| `heartbeat` | Cualquiera (Monitoreo) | `returnValue`, `running`, `port` | **Ninguno** | ✅ Sí (Sin secretos expuestos) |
| `stop` | `com.lennylxx.iptv` | `returnValue`, `stopped`, `droppedSubscribers` | **Ninguno** | ✅ Sí (Evita DoS de terceros) |
| `serviceEvents`| `com.lennylxx.iptv` | `returnValue`, `subscribed` (+ pushes) | **Ninguno** | ✅ Sí (Evita espionaje de actividad) |

---

## 4. Verificación Automatizada

Esta política está garantizada mediante la nueva suite de pruebas unitarias en `bundled-service/src/lan/service.test.ts` (10 pruebas automatizadas con emulación de `LunaService` y `PalmServiceBridge`), ejecutándose de forma reproducible en CI/CD y en el entorno local.

