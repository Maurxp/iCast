# FASE C — VALIDACIÓN DEL SERVICIO LUNA (LS2) EN HARDWARE REAL
**Dispositivo:** LG 65UM7400PDA (webOS 4.10.2 / Node.js 0.12.2)  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Estado:** VALIDADO — POLÍTICA FAIL-CLOSED CONFIRMADA AL 100%

---

## 1. Arranque en Frío del Sistema y Procesos

La aplicación y su servicio complementario se iniciaron en frío mediante el System Application Manager (SAM):
```bash
luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.lennylxx.iptv"}'
```
**Respuesta SAM:** `{"returnValue": true}`

### 1.1 Proceso del Servicio Node.js
* **Identificador de Proceso (PID):** `27171`
* **Línea de comando:** `com.lennylxx.iptv.service`
* **Usuario del sistema:** UID `6904` (Aislamiento sandbox de webOS)
* **Consumo de Memoria:**
  * Memoria Virtual (VSZ): `64,964 kB`
  * Memoria Residente Fisiológica (RSS): `15,384 kB` (~15 MB)
* **Runtime:** Node.js v0.12.2 nativo de webOS 4.

### 1.2 Proceso del Frontend Chromium 53
* **Gestor:** `WebAppMgr` (WAM)
* **PID Renderer:** `27261`
* **Consumo RSS inicial:** `60,812 kB` (~59.4 MB)
* **Puerto de Depuración Remota (CDP):** TCP `9998`
* **Inspección de Endpoint CDP (`http://192.168.1.8:9998/json`):**
  ```json
  {
    "description": "",
    "devtoolsFrontendUrl": "/devtools/inspector.html?ws=192.168.1.8:9998/devtools/page/7805afa6-3c87-440a-94b2-692272675e7a",
    "id": "7805afa6-3c87-440a-94b2-692272675e7a",
    "title": "webOS IPTV Player",
    "type": "page",
    "url": "file:///media/developer/apps/usr/palm/applications/com.lennylxx.iptv/index.html"
  }
  ```

---

## 2. Validación de la Frontera de Confianza (Fail-Closed en LS2)

Se realizaron pruebas adversarias directas mediante `luna-send` desde la consola SSH del televisor para evaluar la resistencia contra llamadas no autorizadas y ataques de suplantación de identidad (caller spoofing).

### Prueba C.1: Llamada no autenticada sin metadatos (Shell Anónimo)
* **Comando ejecutado:**
  ```bash
  luna-send -n 1 luna://com.lennylxx.iptv.service/start '{}'
  ```
* **Respuesta del Servicio:**
  ```json
  {
    "returnValue": false,
    "errorCode": -1,
    "errorText": "Unauthorized"
  }
  ```
* **Evaluación:** **APROBADO (FAIL-CLOSED)**. Al no existir metadatos `callerId` ni `sender` en la llamada del bus, `claims.length === 0` detonó el rechazo inmediato, impidiendo que clientes arbitrarios manipulen el servidor LAN.

### Prueba C.2: Llamada con identidad suplantada (Spoofed Caller ID)
* **Comando ejecutado:**
  ```bash
  luna-send -n 1 -a com.attacker.app luna://com.lennylxx.iptv.service/start '{}'
  ```
* **Respuesta del Servicio:**
  ```json
  {
    "returnValue": false,
    "errorCode": -1,
    "errorText": "Unauthorized"
  }
  ```
* **Evaluación:** **APROBADO (SPOOFING RECHAZADO)**. La aserción de identidad `claims[i] !== AUTHORIZED_APP_ID` (`com.lennylxx.iptv`) bloqueó categóricamente al caller foráneo.

### Prueba C.3: Higiene de Secretos
* **Inspección de salida y diagnósticos:** Ninguna respuesta de error o log de rechazo devolvió `appToken`, credenciales ni información de la estructura interna.
* **Evaluación:** **APROBADO**.

---

## 3. Conclusión de la Fase C

El servicio Luna `com.lennylxx.iptv.service` arranca limpiamente en Node.js 0.12.2, cumple la especificación de aislamiento de webOS 4, y su política de autorización fail-closed resiste la invocación adversaria tanto anónima como suplantada.

