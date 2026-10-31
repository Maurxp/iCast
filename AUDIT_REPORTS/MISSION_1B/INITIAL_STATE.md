# MISIÓN 1B — ESTADO INICIAL Y REGISTRO DE PRESERVACIÓN (INITIAL_STATE.md)

**Proyecto:** `lennylxx/webos-iptv-player` (v1.17.0)  
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / API 4.1.0 / Chromium 53 / Node 0.12.2)  
**Rama Base:** `baseline/mission-0`  
**Rama de Trabajo Creada:** `fix/mission-1b-hardening`  
**Último Commit Base:** `52b5dfa` (*"Clamp Guide descriptions instead of cutting at 200 chars"*)  
**Fecha de Inicio:** 2026-10-29  

---

## 1. Estado Inicial de Git

* **Rama previa:** `baseline/mission-0`.
* **Rama de ingeniería correctiva:** `fix/mission-1b-hardening`.
* **Estado de árboles rastreados:** Limpio (0 archivos modificados en el árbol Git rastreado).
* **Archivos no rastreados existentes:**
  * `AUDIT_REPORTS/` (Informes y artefactos de la Auditoría Inicial, Misión 0 y Misión 1A).
  * `webos-iptv-playerM1.zip` (Archivo de respaldo de trabajo previo).
* **Compromiso de Preservación:**
  * No se ejecutan `git reset --hard`, `git clean -fd` ni comandos destructivos.
  * Los artefactos de la Misión 1A (`AUDIT_REPORTS/MISSION_1A/package/com.lennylxx.iptv_1.17.0_all.ipk`) permanecen intactos y respaldados.
  * Todas las modificaciones se circunscriben estrictamente a los frentes de la Misión 1B.

---

## 2. Registro de Frentes de Trabajo y Archivos a Inspeccionar

| Frente | Área Técnica | Archivos Bajo Investigación | Objetivos de Hardening |
| :--- | :--- | :--- | :--- |
| **Frente A** | Servidor LAN (`bundled-service`) | `bundled-service/src/lan/server.ts`<br>`bundled-service/src/lan/server.test.ts`<br>`src/services/upload-client.ts`<br>`src/services/setup-client.ts` | Proteger endpoints `GET /uploads` y `GET /uploads/:id` con autenticación por token; restringir CORS; auditar validación de paths y nombres de archivo en Node 0.12. |
| **Frente B** | Almacenamiento y Credenciales | `src/services/storage-service.ts`<br>`src/services/idb-user-data.ts`<br>`src/services/idb-cache.ts`<br>`src/utils/logger.ts` | Auditar fuga de credenciales en logs, URLs y almacenamiento; verificar borrado seguro de perfiles Xtream y listas M3U; garantizar minimización de datos en webOS 4. |
| **Frente C** | Build y Empaquetado IPK | `index.html`<br>`esbuild.config.mjs`<br>`build.sh`<br>`package.json` | Investigar y corregir la referencia a `js/preview-libs.js` en `index.html` del IPK (archivo excluido por `ares-package`); automatizar validación de recursos locales. |
| **Frente D** | Pruebas y Regresiones | `bundled-service/src/lan/server.test.ts`<br>Nuevas suites de seguridad | Ampliar cobertura de pruebas para auth LAN, CORS, persistencia segura y comprobación de integridad del IPK. |

---

## 3. Entorno de Ejecución Local

* **Sistema Operativo:** Windows 11 Pro (x64, Build 26100).
* **Node.js:** `v24.18.0`.
* **npm:** `11.16.0`.
* **webOS Packaging CLI:** `@webos-tools/cli` `v3.2.6` (ejecutado vía `npx` sin alterar dependencias locales).
* **Restricción de Red:** **100% LOCAL.** Cero conexiones SSH o comandos dirigidos al televisor LG.

