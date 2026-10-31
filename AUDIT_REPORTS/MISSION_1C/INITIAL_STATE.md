# ESTADO INICIAL DE PARTIDA — MISIÓN M1C
## webOS IPTV Player v1.17.0 — Security Closure & Deployment Readiness

**Fecha de Inicio:** 2026-10-29  
**Dispositivo Objetivo:** LG 65UM7400PDA  
* **Sistema Operativo:** webOS TV Lite 4.10.2-29  
* **API webOS:** 4.1.0  
* **Motor Web:** Chromium 53.0.2785.34  
* **Entorno del Servicio:** Node.js 0.12.2  
* **Arquitectura:** ARMv7 (32 bits)  
* **SoC:** Rockhopper / Realtek RTD2870  
* **Kernel:** Linux 4.4.84  
* **Restricción Operativa:** 100% LOCAL EN PC (Cero SSH / Cero ejecución contra el televisor).

---

## 1. Inventario del Repositorio y Estado Git

* **Rama Activa de Trabajo:** `fix/mission-1c-closure` (bifurcada limpiamente desde `fix/mission-1b2-luna-trust`).
* **Commit Base:** `52b5dfa Clamp Guide descriptions instead of cutting at 200 chars`
* **Historial Reciente:**
  ```text
  52b5dfa Clamp Guide descriptions instead of cutting at 200 chars
  dfe70f3 Hide a paused player OSD with Back
  35e1701 Restore homebrew-repository.json for existing Homebrew users
  d6594aa Link related tools and migrate the Homebrew repository
  aa3d3cf Add Polish and Turkish to the LAN setup page
  ```
* **Estado del Working Tree:**
  Se conservan íntegramente las correcciones acumuladas de las Misiones 1B, 1B.1 y 1B.2 sin operaciones destructivas:
  * Modificados:
    * `build.sh` (secuencia estricta de compilación y validación).
    * `bundled-service/src/compat.ts` (funciones auxiliares y `timingSafeEqualString`).
    * `bundled-service/src/compat.test.ts` (pruebas de compatibilidad Node 0.12.2).
    * `bundled-service/src/lan/server.ts` (servidor HTTP, CORS RFC 1918, token auth).
    * `bundled-service/src/lan/server.test.ts` (suite de 89 pruebas de servidor).
    * `bundled-service/src/lan/service.ts` (integración Luna Service Bus).
    * `bundled-service/src/setup/setup-page.html` (interfaz web de configuración LAN).
    * `bundled-service/src/setup/setup-page.test.ts` (pruebas DOM de setup page).
    * `bundled-service/src/upload/store.ts` (gestión de archivos con permisos 0o700/0o600).
    * `css/legacy-webos-base.css` (base CSS generada para Chromium 53).
    * `esbuild.config.mjs` (pipeline de empaquetado y exclusión de preview-libs).
    * `src/app.ts` (sanitización de registros y bootstrap).
    * `src/services/phone-setup.integration.test.ts` (prueba de sincronización LAN).
    * `src/services/service-http.ts` (almacenamiento de tokens en memoria).
    * `src/services/setup-client.ts` (cliente de configuración).
    * `src/services/upload-client.ts` (cliente de listas M3U subidas).
  * No rastreados:
    * `AUDIT_REPORTS/` (informes históricos M0, M1A, M1B, M1B1, M1B2).
    * `bundled-service/src/lan/service.test.ts` (pruebas de métodos Luna).
    * `bundled-service/src/upload/store.test.ts` (pruebas de permisos y almacenamiento).
    * `scripts/validate-package-resources.mjs` (validador de recursos previo al empaquetado).
    * `scripts/validate-package-resources.test.mjs` (pruebas del validador de recursos).
    * `src/services/luna-log-hygiene.test.ts` (pruebas de higiene de secretos en logs).

---

## 2. Inventario de Dependencias y Versiones

* **Proyecto Principal (`package.json`):**
  * Versión: `1.17.0`
  * Nombre: `webos-iptv-player`
  * Identificador de Aplicación: `com.lennylxx.iptv`
  * Node / Tooling local: Node.js v22.14.0, npm 10.9.2, TypeScript 5.8.2, esbuild 0.25.1.
  * Target compilación Frontend: `chrome53` (Chromium 53 webOS 4).
* **Servicio empaquetado (`bundled-service/package.json`):**
  * Entrypoint: `index.js`
  * Identificador de Servicio: `com.lennylxx.iptv.service`
  * Target compilación Servicio: Node.js 0.12.2 (CommonJS, ES5 sin modernismos de ES6+).

---

## 3. Inventario de Paquetes IPK Existentes y Sumas Criptográficas

| Misión | Ruta del Paquete | Tamaño (bytes) | Hash SHA-256 |
| :--- | :--- | :---: | :--- |
| **Misión 1A** | `AUDIT_REPORTS/MISSION_1A/package/com.lennylxx.iptv_1.17.0_all.ipk` | 729.512 | `11014028D177C0FD158EF75989868EE391D8F49ECE5D4FBBA45022D8EE7E390C` |
| **Misión 1B** | `AUDIT_REPORTS/MISSION_1B/package/com.lennylxx.iptv_1.17.0_all.ipk` | 729.518 | `A1849BD9ED1328BE30DAE289130A1EE7E668F1EB8E287627624F903037E8DB1F` |
| **Misión 1B.1** | `AUDIT_REPORTS/MISSION_1B1/package/com.lennylxx.iptv_1.17.0_all.ipk` | 731.542 | `63713A55E14FB1F3444449C71F1EDE8B6B4D763F6F2F940E181007B2E89D3B3C` |
| **Misión 1B.2** | `AUDIT_REPORTS/MISSION_1B2/package/com.lennylxx.iptv_1.17.0_all.ipk` | 733.404 | `1D3EAD5654432C09223346F058461056C74D4A869119EDAF5F946473636332EF` |

---

## 4. Brechas Críticas Identificadas para Misión 1C

1. **Defecto de Autorización Fail-Open en Luna (`service.ts`):**
   `isAuthorizedCaller()` retornaba `true` cuando `msg.applicationId === undefined` (para tolerar `luna-send`). Esto permite que cualquier mensaje sin metadatos de identidad o malformado acceda a métodos protegidos.
2. **Propiedades de Identidad de Mensaje en webOS TV 4:**
   Diferenciación estricta entre `msg.applicationId`, `msg.sender`, `msg.callerId` (metadatos inyectados por LS2) versus `msg.payload` (datos manipulables por el cliente). Manejo de metadatos contradictorios.
3. **Vulnerabilidad de Denegación de Servicio (DoS) en el Emparejamiento:**
   En M1B.2, peticiones repetidas desde una IP ya bloqueada seguían incrementando `globalFailures`, lo que permitía a un atacante bloquear a toda la red por 5 minutos y destruir el PIN. Se requiere desacoplar el bloqueo global DoS del abuso de una sola IP.
4. **Higiene de URLs en Registros de Reproducción:**
   Verificar que URLs con tokens de autenticación o credenciales no se impriman en texto plano en `playlist-service.ts` ni en telemetría.
5. **Causa Raíz de los 3 Fallos en Entorno Windows:**
   Reproducidos e identificados exactamente:
   * `scripts/eslint-focus-rules.test.mjs`: Fin de línea CRLF (`\r\n`) en Windows impide que la regex con ancla `$` capture la línea.
   * `scripts/tv-diag.test.mjs`: Invocación de `/bin/sh` y `/dev/zero` no disponible nativamente en Windows.
   * `scripts/tv-input.test.mjs`: Comprobación de máscara POSIX `0o600` en sistema de archivos NTFS de Windows donde Node devuelve `0o666`.

