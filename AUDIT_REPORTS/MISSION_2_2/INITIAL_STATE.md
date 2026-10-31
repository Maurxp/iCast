# Estado Inicial del Proyecto — Misión M2.2
## Estabilización, Solución MP4 y Endurecimiento de Seguridad
**Fecha:** 30 de Octubre de 2026  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, API 4.1.0, Chromium 53.0.2785.34, Node.js 0.12.2, ARMv7 Realtek RTD2870)  
**Workspace:** `C:\Users\amaur\Desktop\webos-iptv-player`  
**Rama Base:** `fix/mission-1c-closure`  
**Nueva Rama de Trabajo:** `fix/mission-2-2-stabilization`  

---

## 1. Inventario Git y Control de Código

- **Commit HEAD:** `52b5dfaffa7db6207350d29b0ec5bad35f12915f` (*"Clamp Guide descriptions instead of cutting at 200 chars"*).
- **Nueva Rama Activa:** `fix/mission-2-2-stabilization` creada limpiamente a partir del estado aprobado de M1C / M2.
- **Archivos Modificados en Working Tree:**
  Se conservan íntegros los 20 archivos de endurecimiento de seguridad acumulados y aprobados en las misiones M1B, M1B.1, M1B.2, M1C y M1C Finalization:
  - `build.sh`
  - `bundled-service/src/compat.ts` y `compat.test.ts`
  - `bundled-service/src/lan/server.ts` y `server.test.ts`
  - `bundled-service/src/lan/service.ts`
  - `bundled-service/src/setup/setup-page.html` y `setup-page.test.ts`
  - `bundled-service/src/upload/store.ts`
  - `css/legacy-webos-base.css`
  - `esbuild.config.mjs`
  - `package.json`
  - `scripts/eslint-focus-rules.test.mjs`, `scripts/tv-diag.test.mjs`, `scripts/tv-input.test.mjs`
  - `src/app.ts`
  - `src/services/phone-setup.integration.test.ts`
  - `src/services/playlist-service.ts`
  - `src/services/service-http.ts`
  - `src/services/setup-client.ts`
  - `src/services/upload-client.ts`
- **Archivos no rastreados preservados:**
  - `AUDIT_REPORTS/` (Misiones 1A, 1B, 1B1, 1B2, 1C, 1C_FINAL, 2, 2_1)
  - `bundled-service/src/lan/service.test.ts`, `bundled-service/src/upload/store.test.ts`
  - `scripts/build-service.mjs`, `scripts/validate-package-resources.mjs`, `scripts/synthetic_test.m3u`
  - Scripts de diagnóstico para TV (ejecución solo lectura / CDP)

---

## 2. Artefactos Aprobados y Paquete en el Televisor

- **Paquete Instalado en el TV:**
  - Archivo: `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk`
  - Tamaño: 733.772 bytes
  - SHA-256: `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`
  - Estado del TV: Aplicación abierta y en ejecución activa con PID WAM 27261 y PID Servicio 27171.
  - Menú actual en pantalla: Vista de canales tras la prueba manual de M2.1.
- **Regla de Preservación del TV:**
  - El televisor físico no debe recibir teclas, comandos CDP, ni reinicios.
  - La instalación de un nuevo IPK está **estrictamente deshabilitada** en las Fases A-F de esta misión.

---

## 3. Síntesis de Observaciones M2.1 para M2.2

1. **Fallo MP4:** Causa raíz demostrada: HTTP 403 Forbidden (`AccessDenied`) de Google Cloud Storage. Falta además reconocimiento de `.mp4` y `.m4v` en `streamUrlMime()`, y control estricto de códigos HTTP `>= 400` en `detectContentType()`.
2. **Fixture MP4 y Servidor Local:** Se requiere una fixture MP4 sintética reproducible (H.264/AAC, 720p, *FastStart* con átomo `moov` antes de `mdat`) y un servidor local en Node/TypeScript que responda cabeceras `Range: bytes=` con HTTP 206 y `Content-Range`.
3. **Seguridad CDP:** Puerto 9998 abierto globalmente por `WebAppMgr` (`--remote-debugging-port=9998`). Se debe investigar el soporte de `"inspectable": false` en `appinfo.json` para webOS TV 4 y establecer una clara separación de builds (dev vs release).
4. **Calidad y Gates:** Garantizar compatibilidad estricta con Chromium 53 y Node.js 0.12.2 en PC, sin regresiones en las suites existentes.

