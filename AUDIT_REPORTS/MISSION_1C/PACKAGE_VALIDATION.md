# VALIDACIÓN TÉCNICA DEL PAQUETE IPK
## webOS IPTV Player v1.17.0 — Misión 1C

**Fecha:** 2026-10-29  
**Archivo Generado:** `AUDIT_REPORTS/MISSION_1C/package/com.lennylxx.iptv_1.17.0_all.ipk`  
**Tamaño del Archivo:** `733.376 bytes` (716,18 KB)  
**Hash Criptográfico SHA-256:** `EC561EDEACF1BC7B3D73C579A376785745879578F23C796A1A795F028B33D2BA`  

---

## 1. Estructura Interna del Paquete

El archivo `.ipk` generado corresponde al estándar de empaquetado de Debian/webOS (`ar archive` versión 2):

```
com.lennylxx.iptv_1.17.0_all.ipk
├── debian-binary               (Formato de versión: "2.0")
├── control.tar.gz              (Metadatos de control del instalador webOS)
│   ├── control                 (Package: com.lennylxx.iptv, Version: 1.17.0, Architecture: all)
│   └── postinst / prerm        (Scripts de ciclo de vida si aplican)
└── data.tar.gz                 (Árbol de instalación con 109 entradas)
    └── usr/palm/
        ├── applications/com.lennylxx.iptv/   (Frontend de la aplicación)
        │   ├── appinfo.json                  (Manifiesto principal de la app)
        │   ├── index.html                    (Punto de entrada de la interfaz)
        │   ├── bundle.js                     (Código compilado para Chromium 53)
        │   ├── bundle.css                    (Estilos con tokens 10-foot UI)
        │   ├── worker.js                     (Web Worker de indexación y búsqueda)
        │   ├── shaka-player.compiled.js      (Motor de reproducción DASH nativo)
        │   └── assets/ / icons/              (Iconos y recursos visuales)
        └── services/com.lennylxx.iptv.service/ (Servicio de fondo Node.js 0.12.2)
            ├── services.json                 (Registro del servicio en el bus Luna)
            ├── package.json                  (Main: "index.js")
            └── index.js                      (Código del servicio transpilado a ES5)
```

---

## 2. Verificación de Manifiestos y Coherencia de Versiones

### 2.1 `appinfo.json`
* **ID:** `com.lennylxx.iptv`
* **Versión:** `1.17.0` (sincronizada automáticamente desde `package.json`)
* **Main:** `index.html`
* **Vendor:** `lennylxx`
* **Title:** `webOS IPTV Player`
* **Resolución de Pantalla:** 1920x1080 (Canvas 10-foot nativo).

### 2.2 `services.json`
* **ID:** `com.lennylxx.iptv.service`
* **Description:** `Bundled webOS JS service for the IPTV player`
* **Services:** `[{ "name": "com.lennylxx.iptv.service" }]`

---

## 3. Auditoría de Exclusión de Artefactos de Desarrollo

Se ejecutó la herramienta `scripts/validate-package-resources.mjs` contra el archivo binario empaquetado:

```text
[Package Resource Validator] Inspecting IPK archive: AUDIT_REPORTS/MISSION_1C/package/com.lennylxx.iptv_1.17.0_all.ipk...
[Package Resource Validator] IPK size: 733376 bytes, Total entries: 109
[OK] IPK package passed all architectural, security, and resource checks.
```

Se verificaron las siguientes reglas de exclusión:
1. **Bibliotecas de Preview de Escritorio:** Excluidas (`hls.js`, `mpegts.js` no forman parte del IPK de producción, ya que en webOS 4 el reproductor utiliza la ruta nativa y Shaka Player).
2. **Dependencias `node_modules`:** Excluidas (el servicio se encuentra empaquetado en un único archivo standalone `index.js` sin dependencias externas).
3. **Archivos de Prueba y Fuentes TS:** Excluidos (`*.test.ts`, `*.ts`, `*.map`).
4. **Secretos y Tokens de Configuración:** Cero tokens o credenciales incrustadas en los archivos estáticos.

