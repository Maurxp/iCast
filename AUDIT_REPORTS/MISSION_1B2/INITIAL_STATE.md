# ESTADO INICIAL Y REGISTRO DE PRESERVACIÓN — INITIAL STATE
## webOS IPTV Player v1.17.0 — Misión 1B.2

**Proyecto:** `lennylxx/webos-iptv-player` (v1.17.0)  
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29 / API 4.1.0 / Chromium 53.0.2785.34 / Node.js 0.12.2 / ARMv7 32-bit / SoC Realtek RTD2870)  
**Rama Base:** `fix/mission-1b1-security-closure`  
**Rama de Trabajo Creada:** `fix/mission-1b2-luna-trust`  
**Último Commit Base:** `52b5dfa` (*"Clamp Guide descriptions instead of cutting at 200 chars"*)  
**Fecha de Inicio:** 2026-10-29  
**Nivel de Autorización:** 100% Local en PC (Sin conexiones SSH ni modificaciones al televisor físico)  

---

## 1. Estado Inicial de Git

* **Rama previa:** `fix/mission-1b1-security-closure`.
* **Rama de ingeniería de hardening:** `fix/mission-1b2-luna-trust`.
* **Estado de cambios previos:** Se conservan íntegramente todas las modificaciones y artefactos de las Misiones 1B y 1B.1:
  * Eliminación de bypass de loopback HTTP.
  * Validación estricta RFC 1918 CORS de 4 octetos decimales.
  * `secureChmod` y reconciliación de permisos `0o700`/`0o600`.
  * Reordenamiento del pipeline de compilación en `build.sh` e inspector nativo de archivos IPK.
* **Archivos y Directorios de Auditoría Existentes:**
  * `AUDIT_REPORTS/INITIAL_AUDIT/`
  * `AUDIT_REPORTS/MISSION_0/`
  * `AUDIT_REPORTS/MISSION_1A/`
  * `AUDIT_REPORTS/MISSION_1B/`
  * `AUDIT_REPORTS/MISSION_1B1/`
* **Compromiso de Preservación:**
  * No se ejecutan comandos destructivos (`git reset --hard`, `git clean -fd`).
  * Los paquetes `.ipk` y reportes de misiones previas se mantienen intactos.
  * Cero comandos dirigidos al televisor LG.

---

## 2. Definición de Frentes de Trabajo (Misión 1B.2)

| Frente | Área Técnica | Archivos Clave | Objetivos de Hardening |
| :--- | :--- | :--- | :--- |
| **Frente A** | Investigación de Seguridad Luna en webOS 4 | `bundled-service/src/lan/service.ts`<br>`bundled-service/src/index.ts`<br>`bundled-service/src/services.json`<br>`src/services/luna.ts`<br>`appinfo.json` | Analizar el modelo de seguridad del Luna Service Bus (LS2) en webOS TV 4 comercial; investigar roles, permisos, comportamiento en sideload/homebrew y resolución de las 7 preguntas críticas de acceso entre apps. |
| **Frente B** | Revisión y Control de Acceso a Métodos Luna | `bundled-service/src/lan/service.ts`<br>`bundled-service/src/lan/service.test.ts` | Auditar los métodos `start`, `getInfo`, `heartbeat`, `stop`, `serviceEvents`; evitar que entreguen secretos indiscriminadamente sin validar la identidad del solicitante; estudiar mecanismos de verificación por emisor (`message.sender`) y tokens de sesión. |
| **Frente C** | Eliminación de Filtraciones de Secretos en Logs | `src/app.ts`<br>`src/utils/logger.ts`<br>Todo el repositorio | Eliminar el registro de objetos de autenticación (identificado en `src/app.ts: log.info(JSON.stringify(resp))`); buscar y suprimir logs con `appToken`, `setupToken`, `pairingCode`, `Authorization` y URLs firmadas; agregar pruebas de sanitización. |
| **Frente D** | Reducción de Exposición de Tokens HTTP | `bundled-service/src/lan/server.ts`<br>`src/services/service-http.ts`<br>`src/services/upload-client.ts` | Eliminar `appToken` de la respuesta de `/info` si el cliente ya lo posee; auditar ciclo de vida de URLs de video firmadas y su comportamiento ante reinicio del servicio sin romper Chromium 53. |
| **Frente E** | Seguridad y Hardening del Emparejamiento PIN | `bundled-service/src/lan/server.ts` | Evaluar y robustecer el mecanismo de `pairingCode` de 4 dígitos contra ataques de fuerza bruta (bloqueo global, caducidad, rotación tras emparejamiento, bloqueo progresivo). |
| **Frente F** | Pruebas, Validación y Empaquetado | Suites de prueba Vitest<br>`validate-package-resources.mjs`<br>`build.sh` | Crear suite simulada de Luna, pruebas de higiene de logs, tests de pairing robustecido y empaquetar el IPK final en `AUDIT_REPORTS/MISSION_1B2/package/`. |

---

## 3. Entorno de Ejecución Local

* **Sistema Operativo:** Windows 11 Pro (x64, Build 26100).
* **Node.js Local:** `v24.18.0`.
* **Node.js Objetivo del TV:** `0.12.2` (webOS 4 Lite).
* **Motor Web Objetivo del TV:** Chromium `53.0.2785.34`.
* **Empaquetador webOS:** `@webos-tools/cli` `v3.2.6` (ejecutado con npx).

