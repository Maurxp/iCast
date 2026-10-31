# MODELO DE CONFIANZA LUNA SERVICE BUS (LS2) EN LG WEBOS TV 4
## webOS IPTV Player v1.17.0 — Misión 1C

**Fecha:** 2026-10-29  
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, API 4.1.0, Node.js 0.12.2, Chromium 53.0.2785.34, ARMv7 32-bit, RTD2870)  
**Identificador de Aplicación:** `com.lennylxx.iptv`  
**Identificador de Servicio:** `com.lennylxx.iptv.service`  

---

## 1. Arquitectura y Mecánica del Bus Luna en webOS TV 4

El Luna Service Bus (LS2) es el bus IPC central del sistema operativo webOS. A diferencia de un bus D-Bus de escritorio o sockets UNIX genéricos, las peticiones en webOS son intermediadas por el demonio gestor de bus `ls-hubd`.

En un televisor LG con **webOS TV 4 comercial (firmware de producción)**, la interacción ocurre bajo las siguientes reglas arquitectónicas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WebApp Chromium 53                              │
│                    (appId: com.lennylxx.iptv)                          │
│  - window.PalmServiceBridge inyectado por WebAppManager (WAM)         │
│  - Llama: bridge.call("luna://com.lennylxx.iptv.service/start", "{}") │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ IPC nativo Chromium/WAM
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Demonio ls-hubd                               │
│  - Identifica el descriptor del proceso emisor                         │
│  - Asocia credenciales del contenedor SAM/WAM                          │
│  - Empaqueta el mensaje con metadatos de origen                        │
│    (applicationId: 'com.lennylxx.iptv', sender: 'com.lennylxx.iptv')   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Socket local del servicio
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Servicio Node.js 0.12.2 (bundled-service)                  │
│               (serviceId: com.lennylxx.iptv.service)                   │
│  - webos-service crea el objeto wrapper Message                        │
│  - msg.applicationId y msg.sender provienen del hub                    │
│  - msg.payload proviene del cuerpo JSON enviado por el cliente         │
│  - Validador isAuthorizedCaller() evalúa metadatos (FAIL-CLOSED)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Taxonomía de Identidades y Metadatos en el Mensaje

Es fundamental clasificar los campos del objeto `Message` que recibe un callback registrado en `webos-service`:

| Campo | Origen | Grado de Confianza | Uso de Seguridad |
| :--- | :--- | :---: | :--- |
| **`msg.applicationId`** | Inyectado por `ls-hubd` basándose en el registro WAM de la ventana emisora. | **ALTO** (Inalterable por JS de la app) | Validador principal de origen de aplicación webOS. |
| **`msg.sender`** | Asignado por `ls-hubd`. Representa el bus ID o appId emisor. | **ALTO** | Validador de consistencia y origen de servicios. |
| **`msg.callerId`** | Alias en ciertas versiones legacy de webOS TV. | **MEDIO** | Validación secundaria de compatibilidad. |
| **`msg.payload`** | Cuerpo JSON enviado por el emisor (argumentos de llamada). | **CERO (NO CONFIABLE)** | **NUNCA DEBE USARSE PARA AUTENTICACIÓN.** Un atacante puede incluir `{ "applicationId": "com.lennylxx.iptv" }` en el cuerpo. |
| **`msg.uniqueToken`** | Identificador interno de suscripción en `webos-service`. | **ALTO** (Gestión de ciclo de vida) | Exclusivo para desuscripción y tracking de pushes. |

---

## 3. Resolución de la Vulnerabilidad Fail-Open de Misiones Anteriores

### 3.1 El Defecto Identificado
En Misión 1B.2, la función `isAuthorizedCaller()` fue implementada con la siguiente lógica:
```typescript
// DEFECTO ANTERIOR (M1B.2): FAIL-OPEN
function isAuthorizedCaller(msg: LunaMsg): boolean {
  const caller = getCallerAppId(msg);
  if (caller !== undefined && caller !== 'com.lennylxx.iptv') {
    return false;
  }
  return true; // <-- Si caller era undefined, PERMITÍA EL ACCESO
}
```
**Impacto de la brecha:** Si un atacante emitía un mensaje donde los campos de metadatos estaban vacíos, omitidos, corruptos, o procedentes de canales que no definían `applicationId`, el servicio respondía positivamente y entregaba `appToken`.

### 3.2 La Nueva Política: Estrictamente Fail-Closed
En Misión 1C, la función fue reimplementada con principios de tolerancia cero a ambigüedades:
```typescript
const AUTHORIZED_APP_ID = 'com.lennylxx.iptv';

export function isAuthorizedCaller(msg: unknown): boolean {
  if (!msg || typeof msg !== 'object') {
    return false;
  }
  const m = msg as Record<string, unknown>;

  // Se extraen únicamente propiedades del wrapper inyectadas por LS2 (nunca m.payload)
  const appId = typeof m.applicationId === 'string' ? m.applicationId.trim() : undefined;
  const callerId = typeof m.callerId === 'string' ? m.callerId.trim() : undefined;
  const sender = typeof m.sender === 'string' ? m.sender.trim() : undefined;

  const claims: string[] = [];
  if (appId) claims.push(appId);
  if (callerId) claims.push(callerId);
  if (sender) claims.push(sender);

  // FAIL-CLOSED: Si no existe ninguna aserción de identidad, se rechaza
  if (claims.length === 0) {
    return false;
  }

  // Verificación contra contradicciones y suplantaciones:
  // TODAS las aserciones presentes deben ser exactamente AUTHORIZED_APP_ID
  for (let i = 0; i < claims.length; i++) {
    if (claims[i] !== AUTHORIZED_APP_ID) {
      return false;
    }
  }

  return true;
}
```

### 3.3 Reglas de Decisión Cripto-Deterministas

1. **Ausencia de Identidad:** Si `claims.length === 0` -> Denegado (`returnValue: false, errorText: 'Unauthorized'`).
2. **Identidad Ajena:** Si cualquiera de los claims es `com.evil.app` -> Denegado.
3. **Identidad Contradictoria:** Si `applicationId === 'com.lennylxx.iptv'` pero `sender === 'com.other.service'` -> Denegado (impide inyecciones cruzadas de proxy o reflejo).
4. **Manipulación de Argumentos (Payload Pollution):** Si el cliente pasa `payload: { applicationId: 'com.lennylxx.iptv' }` sin metadatos de envoltura -> Denegado (la función ignora `m.payload`).
5. **Ataques de Prefijo/Sufijo:** `'com.lennylxx.iptv.malicious'` o `'fake.com.lennylxx.iptv'` -> Denegado (comparación de igualdad estricta `===`, sin `.startsWith()` o `.indexOf()`).

---

## 4. Justificación y Alcance de Métodos Accesibles

| Método Luna | Servicio | Control de Acceso | Justificación Técnica |
| :--- | :--- | :---: | :--- |
| **`start`** | `lan/service.ts` | `isAuthorizedCaller` | Devuelve `port` y `appToken`. Solo nuestra app debe inicializar y recibir la credencial. |
| **`getInfo`** | `lan/service.ts` | `isAuthorizedCaller` | Métricas operativas no sensibles (`port`, `ip`, `manualUrl`). Requiere identidad de la app. |
| **`stop`** | `lan/service.ts` | `isAuthorizedCaller` | Teardown del servidor HTTP. Solo la app legítima al pasar a segundo plano debe detener el puerto. |
| **`serviceEvents`** | `lan/service.ts` | `isAuthorizedCaller` | Suscripción de eventos de mutación (`uploads-changed`, `setup-changed`). Evita espionaje de actividad. |
| **`heartbeat`** | `lan/service.ts` | `isAuthorizedCaller` | Comprobación de estado y puerto interno. Protegido en M1C para no permitir fingerprinting a apps extrañas. |
| **`getDevMode`** | `reminder/service.ts` | Abierto | Devuelve `{ devmode: isDevMode() }`. Es un booleano estático sin secretos ni datos sensibles. |
| **`fireReminderAlert`** | `reminder/service.ts` | Convocado por ActivityManager | **Excepción justificada del sistema:** Invocado por el demonio del sistema `com.webos.service.activitymanager` al cumplirse el horario de emisión de un programa. Dispara un toast en pantalla con el botón "Ver ahora" y retorna `{ fired: ok, result: detail }`. No maneja ni retorna credenciales. |

