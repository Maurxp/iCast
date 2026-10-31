# INSPECCIÓN Y VALIDACIÓN DEL PAQUETE IPK — IPK VALIDATION
## webOS IPTV Player v1.17.0 — Misión 1B.1

**Paquete Evaluado:** `AUDIT_REPORTS/MISSION_1B1/package/com.lennylxx.iptv_1.17.0_all.ipk`  
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / API 4.1.0 / Chromium 53 / Node 0.12.2 / ARMv7)  
**Fecha de Generación:** 2026-10-29  
**Herramienta de Empaquetado:** `@webos-tools/cli` `v3.2.6` (ares-package)  
**Estado:** Válido, Verificado y Listo para Despliegue  

---

## 1. Ficha Técnica del Paquete `.ipk`

| Propiedad | Valor Verificado |
| :--- | :--- |
| **Nombre del Archivo** | `com.lennylxx.iptv_1.17.0_all.ipk` |
| **Identificador de Aplicación (`id`)** | `com.lennylxx.iptv` |
| **Versión** | `1.17.0` |
| **Arquitectura Declarada** | `all` |
| **Resolución Declarada** | `1920x1080` |
| **Tamaño Comprimido (IPK)** | **731.542 bytes (714,4 KB)** |
| **Tamaño Instalado en TV** | **2.654.771 bytes (~2,53 MB)** |
| **Hash SHA-256** | `63713a55e14fb1f3444449c71f1ede8b6b4d763f6f2f940e181007b2e89d3b3c` |
| **Formato de Paquete** | Unix `ar` archive v2 (Debian / ipkg format) |

---

## 2. Inspección Oficial con `ares-package -I`

```yaml
< control >
Package: com.lennylxx.iptv
Version: 1.17.0
Section: misc
Priority: optional
Architecture: all
Installed-Size: 2654771
Maintainer: N/A <nobody@example.com>
Description: This is a webOS application.
webOS-Package-Format-Version: 2
webOS-Packager-Version: x.y.x

< packageinfo.json >
{
  "id": "com.lennylxx.iptv",
  "version": "1.17.0",
  "app": "com.lennylxx.iptv",
  "services": [
    "com.lennylxx.iptv.service"
  ]
}

< appinfo.json >
{
  "id": "com.lennylxx.iptv",
  "version": "1.17.0",
  "vendor": "lennylxx",
  "type": "web",
  "main": "index.html",
  "title": "webOS IPTV Player",
  "appDescription": "IPTV player with M3U, Xtream, XMLTV, and catch-up.",
  "icon": "icon.png",
  "largeIcon": "largeIcon.png",
  "iconColor": "#241e52",
  "resolution": "1920x1080",
  "disableBackHistoryAPI": true,
  "transparent": false
}

< services.json >
{
  "id": "com.lennylxx.iptv.service",
  "description": "Bundled webOS JS service for the IPTV player",
  "services": [
    {
      "name": "com.lennylxx.iptv.service"
    }
  ]
}

< package.json >
{
  "main": "index.js"
}
```

---

## 3. Desglose Forense de Contenidos (`data.tar.gz`)

El paquete contiene exactamente **109 entradas** (archivos y directorios) estructuradas según las convenciones del sistema de archivos de webOS:

### 3.1 Aplicación Frontend (`usr/palm/applications/com.lennylxx.iptv/`)
* **Manifiestos y Configuración:**
  * `appinfo.json` (407 bytes, id: `com.lennylxx.iptv`, version: `1.17.0`).
  * `resources/*/appinfo.json` (localizaciones para `de`, `es`, `fr`, `it`, `pl`, `pt-BR`, `ru`, `tr`, `uk`, `zh-Hans-CN`).
* **HTML y Scripts:**
  * `index.html` (limpio de referencias a preview-libs).
  * `js/app.js` (código bundle compilado bajo esbuild `chrome53`).
  * `js/app-worker.js` (Web Worker para procesamiento XMLTV e indexación).
  * `js/shaka-player.dash.js` (reproductor DASH para Chromium 53).
* **Hojas de Estilo CSS:**
  * `css/legacy-webos-base.css` (estilos base y polyfills de layout para webOS 4).
  * `css/legacy-webos-overrides.css` (reglas específicas para renderizado en Chromium 53).
  * `css/main.css`, `css/themes.css`, `css/player.css`, `css/epg.css`, `css/navigation.css`, etc.
* **Iconos y Recursos Gráficos:**
  * `icon.png`, `largeIcon.png`, `assets/avatar-*.svg`.
* **Licencias de Terceros:**
  * `licenses/assjs.txt`, `third-party-notices.txt`.

### 3.2 Servicio Node.js en Segundo Plano (`usr/palm/services/com.lennylxx.iptv.service/`)
* **Manifiestos del Servicio:**
  * `package.json` (`main: "index.js"`).
  * `services.json` (`id: "com.lennylxx.iptv.service"`).
* **Módulos Ejecutables (Node 0.12.2 Clean):**
  * `index.js` (Punto de entrada del servicio Luna).
  * `compat.js` (Polyfills de Node moderno para Node 0.12).
  * `lan/server.js` (Servidor HTTP LAN con doble token y CORS RFC 1918).
  * `lan/service.js` (Controlador de ciclo de vida del servicio).
  * `upload/store.js` (Gestor de almacenamiento de M3U con permisos `0700`/`0600`).
  * `setup/actions.js`, `setup/state.js`, `setup/validation.js`.
  * `setup/setup-page.html` (Interfaz web servida para emparejamiento desde el móvil).
  * `reminder/alert.js`, `reminder/service.js` (Gestión de recordatorios de programas).

---

## 4. Auditoría de Seguridad e Integridad del Paquete

| Regla de Integridad | Criterio de Aceptación | Estado en el IPK M1B.1 |
| :--- | :--- | :---: |
| **Exclusión de `preview-libs.js`** | El archivo `preview-libs.js` no debe existir en `data.tar.gz`. | **CUMPLIDO** (0 ocurrencias) |
| **HTML Limpio de Previews** | `index.html` no debe tener `<script src="*preview-libs*">`. | **CUMPLIDO** (Limpio) |
| **Compatibilidad con Chromium 53** | Todo el JS de la app debe respetar la sintaxis de Chromium 53 (sin optional chaining, sin BigInt, sin regex s-flag). | **CUMPLIDO** (Compat gate OK) |
| **Compatibilidad con Node 0.12.2** | Todo el JS del servicio debe ser CommonJS ES5 (sin let/const no transpilado, sin `Buffer.from` sin polyfill). | **CUMPLIDO** (Service gate OK) |
| **Compatibilidad de Arquitectura** | Si existen binarios ELF, deben ser exclusivamente ARMv7 32-bit (tipo 40). | **CUMPLIDO** (0 binarios incompatibles) |
| **Integridad de Rutas de Manifiestos**| `packageinfo.json`, `appinfo.json` y `services.json` deben enlazar a rutas reales en el paquete. | **CUMPLIDO** (Rutas verificadas) |

---

## 5. Dictamen Final del Paquete
El archivo `com.lennylxx.iptv_1.17.0_all.ipk` en `AUDIT_REPORTS/MISSION_1B1/package/` cumple al 100% las restricciones de seguridad, compatibilidad arquitectónica y rendimiento para su instalación en el televisor LG 65UM7400PDA.

