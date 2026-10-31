# Validación del Paquete de Instalación (.IPK)
## Misión M2.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Paquete Generado:** `AUDIT_REPORTS/MISSION_2_2/package/com.lennylxx.iptv_1.17.0_all.ipk`  

---

## 1. Identificación y Parámetros del Archivo IPK

- **Ruta Relativa:** `AUDIT_REPORTS/MISSION_2_2/package/com.lennylxx.iptv_1.17.0_all.ipk`
- **Tamaño:** **734.610 bytes** (~717.4 KB)
- **Hash Criptográfico (SHA-256):**
  ```text
  9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531
  ```
- **Herramienta de Empaquetado:** `@webos-tools/cli` v3.2.6 (`ares-package`)
- **Flags de Compilación:** `--no-minify -e "*preview-libs.js" dist build/bundled-service -o AUDIT_REPORTS/MISSION_2_2/package`

---

## 2. Inspección Estructural del Archivo `.ipk`

El paquete `.ipk` es un archivo binario en formato Unix `ar` tradicional. La inspección de cabeceras reveló la estructura exacta:
- **Cabecera Magic:** `!<arch>`
- **Miembros del Archivo:**
  1. `debian-binary` (4 bytes): Declara la versión de empaquetado Debian 2.0.
  2. `control.tar.gz` (533 bytes): Contiene el manifiesto `control` del paquete con ID `com.lennylxx.iptv`, versión `1.17.0`, arquitectura `all`.
  3. `data.tar.gz` (733.916 bytes): Archivo comprimido con los archivos desplegados en el sistema.
     - Tamaño descompreso de `data.tar`: **2.746.880 bytes**.
     - Número total de entradas: **109 archivos y directorios**.

---

## 3. Verificación de Sincronización del Código Empaquetado

Se ejecutó una extracción y descompresión en memoria para auditar los archivos compilados críticos dentro del IPK:

| Archivo en IPK | Propiedad Auditada | Valor Confirmado | Estado |
| :--- | :--- | :--- | :---: |
| `usr/palm/applications/com.lennylxx.iptv/appinfo.json` | `"inspectable"` | `false` | **VERIFICADO** |
| `usr/palm/applications/com.lennylxx.iptv/appinfo.json` | `"version"` | `"1.17.0"` | **VERIFICADO** |
| `usr/palm/applications/com.lennylxx.iptv/js/app.js` | Detección de video/mp4 | Presente en árbol compilado | **VERIFICADO** |
| `usr/palm/applications/com.lennylxx.iptv/js/app.js` | Manejo de `classify.http_error` | Presente en árbol compilado | **VERIFICADO** |
| `usr/palm/services/com.lennylxx.iptv.service/lan/service.js` | Política Luna fail-closed | Presente (`claims.length === 0`) | **VERIFICADO** |
| `usr/palm/services/com.lennylxx.iptv.service/lan/server.js` | Mitigación anti-DoS en `/pair` | Presente (`blockedUntil`) | **VERIFICADO** |
| `usr/palm/services/com.lennylxx.iptv.service/setup/setup-page.html` | Hash SHA-256 de plantilla | Coincide con código fuente | **VERIFICADO** |

---

## 4. Dictamen de Validación del Paquete

El paquete IPK generado en la Misión M2.2 representa con fidelidad absoluta el código fuente aprobado, contiene todas las correcciones multimedia y de seguridad, no incluye bibliotecas de vista previa de escritorio, y se encuentra validado y listo para un despliegue controlado en hardware cuando el usuario lo autorice.

