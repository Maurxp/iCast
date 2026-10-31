# FASE B — INFORME DE INSTALACIÓN CONTROLADA
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Estado:** INSTALACIÓN EXITOSA — REGISTRO EN SAM Y SERVICIOS COMPLETO

---

## 1. Identificación del Paquete Desplegado

* **Nombre de archivo:** `com.lennylxx.iptv_1.17.0_all.ipk`
* **Tamaño binario:** `733,772 bytes`
* **Hash SHA-256 (Local):** `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`
* **Hash SHA-256 (Verificado en TV):** `253648b348f1e5b16e073b07786fbe07a1b68b44026adff453b163003cee9cd5`
* **Origen:** Compilación reproducible y sincronizada de la misión M1C-Final.

---

## 2. Procedimiento de Despliegue en Hardware

El despliegue se ejecutó de acuerdo con los límites estrictos de operación definidos para webOS:

1. **Transferencia Segura:** El archivo IPK se transfirió a la partición de memoria RAM temporal `/tmp/iptv-audit-m2/` mediante SCP, respetando las particiones del sistema.
2. **Verificación de Integridad en Dispositivo:** Se ejecutó `sha256sum /tmp/iptv-audit-m2/com.lennylxx.iptv_1.17.0_all.ipk` en el hardware para garantizar la paridad exacta previa a la instalación.
3. **Instalación Oficial por Servicio del Sistema:** Se invocó el servicio nativo de webOS `com.webos.appInstallService/dev/install` mediante Luna Service Bus (LS2):
   ```json
   {
     "id": "com.lennylxx.iptv",
     "ipkUrl": "/tmp/iptv-audit-m2/com.lennylxx.iptv_1.17.0_all.ipk",
     "subscribe": true
   }
   ```
4. **Ciclo de Estados del Instalador de webOS:**
   * `statusValue: 35-37` -> `state: ipk parsing` (Validación de cabecera y metadatos).
   * `statusValue: 262-264` -> `state: download / uncompress` (`unpackFileSize: 2662366 bytes`).
   * `statusValue: 12-17` -> `state: installing : start / installing`.
   * `statusValue: 27-29` -> `state: installing : service installing` (Registro en el bus LS2).
   * `statusValue: 30` -> `state: installed` (`returnValue: true`).

---

## 3. Verificación de Archivos y Permisos en Disco

### 3.1 Directorio de la Aplicación
**Ruta:** `/media/developer/apps/usr/palm/applications/com.lennylxx.iptv/`
```text
total 84
drwxrwxrwx    7 root     root          4096 Oct 30 00:24 .
drwxrwxrwx    6 root     root          4096 Oct 30 00:48 ..
-rw-rw-rw-    1 root     root         10949 Oct 30 00:24 LICENSE
-rw-rw-rw-    1 root     root          4256 Oct 30 00:24 THIRD_PARTY_NOTICES.txt
-rw-rw-rw-    1 root     root           407 Oct 30 00:48 appinfo.json
drwxrwxrwx    4 root     root          4096 Oct 30 00:24 assets
drwxrwxrwx    2 root     root          4096 Oct 30 00:24 css
-rw-rw-rw-    1 root     root          7615 Oct 30 00:24 icon.png
-rw-rw-rw-    1 root     root          2945 Oct 30 00:24 index.html
drwxrwxrwx    2 root     root          4096 Oct 30 00:24 js
-rw-rw-rw-    1 root     root         16628 Oct 30 00:24 largeIcon.png
drwxrwxrwx    2 root     root          4096 Oct 30 00:24 licenses
drwxrwxrwx   12 root     root          4096 Oct 30 00:24 resources
```

### 3.2 Directorio del Servicio Luna
**Ruta:** `/media/developer/apps/usr/palm/services/com.lennylxx.iptv.service/`
```text
total 44
drwxrwxrwx    6 root     root          4096 Oct 30 00:24 .
drwxrwxrwx    4 root     root          4096 Oct 30 00:48 ..
-rw-rw-rw-    1 root     root          5565 Oct 30 00:24 compat.js
-rw-rw-rw-    1 root     root          1695 Oct 30 00:24 index.js
drwxrwxrwx    2 root     root          4096 Oct 30 00:24 lan
-rw-rw-rw-    1 root     root            28 Oct 30 00:24 package.json
drwxrwxrwx    2 root     root          4096 Oct 30 00:24 reminder
-rw-rw-rw-    1 root     root           189 Oct 30 00:24 services.json
drwxrwxrwx    2 root     root          4096 Oct 30 00:24 setup
drwxrwxrwx    2 root     root          4096 Oct 30 00:24 upload
```

---

## 4. Verificación de Integridad de Código Crítico en Dispositivo

Se inspeccionó directamente el código fuente desplegado en el disco del televisor para confirmar la presencia física de los parches de seguridad de M1C:

1. **Política Fail-Closed en `lan/service.js` (Línea 90-93):**
   ```javascript
   // FAIL-CLOSED: Deny access if no identity metadata was provided by LS2
   if (claims.length === 0) {
       return false;
   }
   ```
   **Resultado:** VERIFICADO POSITIVO.
2. **Mitigación Anti-DoS en `lan/server.js` (Línea 347-355):**
   ```javascript
   if (current && current.blockedUntil > now) {
       // Reject immediately with 429. Do NOT increment globalFailures:
       // A blocked client cannot evaluate PINs and must not be allowed to DoS the network.
       sendJson(req, res, 429, {
           error: 'Too many pairing attempts',
           retryAfter: Math.ceil((current.blockedUntil - now) / 1000),
       });
       return [2 /*return*/];
   }
   ```
   **Resultado:** VERIFICADO POSITIVO.

---

## 5. Registro en System Application Manager (SAM)

Se consultó `com.webos.applicationManager/listApps` tras la instalación:
```json
{
  "id": "com.lennylxx.iptv",
  "version": "1.17.0",
  "vendor": "lennylxx",
  "title": "webOS IPTV Player",
  "inspectable": true,
  "resolution": "1920x1080",
  "folderPath": "/media/developer/apps/usr/palm/applications/com.lennylxx.iptv",
  "main": "index.html",
  "type": "web",
  "visible": true,
  "removable": true,
  "disableBackHistoryAPI": true,
  "iconColor": "#241e52"
}
```

**Resultado:** La aplicación está registrada correctamente en el sistema operativo, es visible en el launcher de webOS y tiene configurada la inspección web habilitada (`"inspectable": true`).

