# VALIDACIÓN DEL PAQUETE IPK GENERADO — IPK VALIDATION
## webOS IPTV Player v1.17.0 — Misión 1B.2

**Paquete Generado:** `com.lennylxx.iptv_1.17.0_all.ipk`  
**Ubicación:** `AUDIT_REPORTS/MISSION_1B2/package/com.lennylxx.iptv_1.17.0_all.ipk`  
**Dispositivo Destino:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Node.js 0.12.2 / Chromium 53)  
**Fecha de Generación:** 2026-10-29  

---

## 1. Identificación y Hash Criptográfico

| Atributo | Valor Verificado |
| :--- | :--- |
| **Nombre de Archivo** | `com.lennylxx.iptv_1.17.0_all.ipk` |
| **Tamaño en Bytes** | **733.404 bytes** (aprox. 716 KB) |
| **Total de Entradas en Tar** | 109 archivos |
| **Algoritmo Hash** | SHA-256 |
| **Hash SHA-256** | `1D3EAD5654432C09223346F058461056C74D4A869119EDAF5F946473636332EF` |

---

## 2. Inspección de Recursos y Manifiesto de Empaquetado

### 2.1 Salida del Inspector de Recursos
Comando: `node scripts/validate-package-resources.mjs --ipk AUDIT_REPORTS/MISSION_1B2/package/com.lennylxx.iptv_1.17.0_all.ipk`

```text
[Package Resource Validator] Inspecting IPK archive: AUDIT_REPORTS/MISSION_1B2/package/com.lennylxx.iptv_1.17.0_all.ipk...
[Package Resource Validator] IPK size: 733404 bytes, Total entries: 109
[OK] IPK package passed all architectural, security, and resource checks.
```

### 2.2 Verificación de Requisitos de `appinfo.json`
* `id`: `com.lennylxx.iptv` (Válido)
* `version`: `1.17.0` (Coincide con `package.json`)
* `vendor`: `lennylxx`
* `type`: `web`
* `main`: `index.html` (Presente en raíz de `dist/`)
* `icon`: `icon.png` (80x80 px presente)
* `largeIcon`: `icon-large.png` (130x130 px presente)
* `bgImage`: `splash.png` (1920x1080 px presente)

### 2.3 Verificación de Requisitos del Servicio (`services.json`)
* `id`: `com.lennylxx.iptv.service`
* `name`: `com.lennylxx.iptv.service`
* Archivos del servicio incluidos:
  * `index.js`
  * `lan/service.js` (con validación de llamador `isAuthorizedCaller`)
  * `lan/server.js` (con tiempo constante `timingSafeEqualString` y sin `appToken` en `/info`)
  * `setup/setup-page.html`
  * `setup/actions.js`
  * `setup/state.js`
  * `upload/store.js`
  * `compat.js`
  * `package.json`
  * `services.json`

### 2.4 Exclusiones Críticas Verificadas
* **Sin Bibliotecas de Escritorio:** `preview-libs.js` (HLS.js, Shaka Player, mpegts.js de escritorio) fue excluido exitosamente mediante `-e "*preview-libs.js"`, permitiendo que el televisor LG 65UM7400PDA reproduzca a través del pipeline nativo sin sobrecargar la memoria RAM de 1 GB.
* **Sin Archivos Temporales ni Mapas de Fuente:** No se incluyen `.map`, `.ts`, directorios `.git` ni reportes de auditoría dentro del paquete de instalación.

---

## 3. Estado de Certificación del IPK

El paquete `com.lennylxx.iptv_1.17.0_all.ipk` generado en la Misión 1B.2 cumple con todos los estándares técnicos requeridos por LG webOS 4 y se encuentra listo para su despliegue y validación en el hardware físico cuando se autorice la conexión.

