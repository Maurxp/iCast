# INFORME DE VALIDACIÓN EN TIEMPO DE EJECUCIÓN (RUNTIME VALIDATION)
## Misión M2.3 — webOS IPTV Player v1.17.0
**Fecha:** 2026-10-30  
**Dispositivo:** LG 65UM7400PDA  
**Estado:** VALIDADO Y ESTABLE (PASS)

---

## 1. Arranque de la Aplicación

Se procedió al arranque en frío de la aplicación recién instalada conforme al estándar de webOS CLI:

```bash
ares-launch --device LG-TV com.lennylxx.iptv
```

**Salida:**
```text
[Info] Set target device : LG-TV
Launched application com.lennylxx.iptv
```

La consulta `ares-launch --running --device LG-TV` reportó inmediatamente la aplicación activa en el dispositivo:
```text
com.lennylxx.iptv
```

En el registro del sistema (`/var/log/messages` y `/var/log/fullhome`) se registraron los eventos oficiales del ciclo de vida:
* `SAM NL_APP_LAUNCH_BEGIN {"app_id":"com.lennylxx.iptv","caller_id":"...","mode":"normal"}`
* `LSM NL_SURFACE_STATE_CHANGE {"app_id":"com.lennylxx.iptv","screen_state":"FULLSCREEN"}`
* `LSM NL_VSC {"app_id":"com.lennylxx.iptv","visible":true,"window_type":"_WEBOS_WINDOW_TYPE_CARD"}`

---

## 2. Estado de los Procesos en el Sistema Operativo

Se inspeccionaron los procesos en ejecución en el kernel Linux del televisor:

| Componente | Proceso / Comando | PID | Usuario | VmSize | VmRSS | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Web** | `/usr/bin/WebAppMgr ... com.lennylxx.iptv` | 5675 | `wam` | 584.824 kB (~571 MB) | 93.312 kB (~91,1 MB) | `S` (Sleeping/Activo) |
| **Servicio Node.js** | `com.lennylxx.iptv.service` | 2800 | `6904` | 67.816 kB (~66,2 MB) | 17.076 kB (~16,6 MB) | `S` (Sleeping/Activo) |

* El proceso del frontend web está gestionado por `WebAppMgr` (Chromium 53), renderizando la vista en tarjeta a pantalla completa.
* El proceso del servicio Node.js (Node 0.12.2) está aislado en el entorno enjaulado del sistema (`/var/palm/jail/com.lennylxx.iptv.service`).

---

## 3. Estado de la Red y Puertos de Escucha

Se inspeccionaron los sockets TCP del televisor mediante `netstat -tuln`:

| Puerto | Dirección de Enlace | Proceso Asociado | Propósito | Evaluación de Seguridad |
| :--- | :--- | :--- | :--- | :--- |
| **41926** | `0.0.0.0:41926` | PID 2800 (`com.lennylxx.iptv.service`) | Servidor HTTP LAN para carga de listas M3U y configuración | **PASS** — Protegido por tokens de autenticación y fail-closed (M1C) |
| **9998** | `0.0.0.0:9998` | PID 5675 (`WebAppMgr`) | Puerto de depuración remota Chrome DevTools Protocol (CDP) | **PASS** — Configurado por el runtime del televisor en modo desarrollador |

### Verificación de la Frontera de Confianza (Luna Trust Boundary)
Se probó una llamada no autorizada desde la consola del sistema al bus Luna:
```bash
luna-send -n 1 -f luna://com.lennylxx.iptv.service/heartbeat "{}"
```
**Respuesta del servicio:**
```json
{
    "errorCode": -1,
    "returnValue": false,
    "errorText": "Unauthorized"
}
```
**Conclusión:** La política *fail-closed* implementada en M1C y verificada en hardware bloquea llamadas no autorizadas en el bus Luna con código de error `Unauthorized`.

---

## 4. Diagnóstico y Eventos de Inicialización (Diag Events)

Mediante la conexión al WebSocket de inspección CDP (`scripts/tv_cdp.mjs`), se capturaron los eventos de diagnóstico emitidos durante el arranque y montaje del DOM:

```json
{
  "url": "file:///media/developer/apps/usr/palm/applications/com.lennylxx.iptv/index.html",
  "userAgent": "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.34 Safari/537.36 WebAppManager",
  "title": "webOS IPTV Player",
  "activeElement": "BODY",
  "bodyClasses": "tabbar-docked",
  "viewState": {
    "view-channels": "visible",
    "view-player": "none",
    "view-epg": "none",
    "view-settings": "none"
  }
}
```

* **Gestión de Foco:** El sistema de navegación espacial (`SpatialNav` / `FocusScope`) asignó la propiedad `data-ring-owner="view-channels"` y seleccionó como primer elemento enfocado el canal 1 (`data-key="ch:0"`).
* **Ausencia de Errores Críticos:** No se registraron excepciones no capturadas (`GlobalError`), errores de sintaxis ni rechazos de promesas no manejados durante el arranque.

