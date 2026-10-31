# SINCRONIZACIÓN DE COMPILACIÓN Y CORRECCIÓN DE DISCREPANCIAS
## webOS IPTV Player v1.17.0 — Misión 1C Finalization

**Fecha:** 2026-10-30  
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Node.js 0.12.2, Chromium 53.0.2785.34, ARMv7 32-bit)  
**Estado:** **SINCRONIZACIÓN 100% VERIFICADA Y COMPLETADA**  

---

## 1. Investigación y Causa Raíz de la Discrepancia

La auditoría independiente del paquete previo de M1C detectó que, si bien el código TypeScript en `bundled-service/src/lan/service.ts` y `server.ts` contenía las correcciones fail-closed y anti-DoS, los archivos JavaScript en `build/bundled-service/` y dentro del IPK empaquetado conservaban la implementación anterior de M1B.2.

### 1.1 Causa Raíz Técnica
1. **Comando `npm run build` en `package.json`:**
   ```json
   "build": "tsc --noEmit && node esbuild.config.mjs"
   ```
   El script `build` compila **únicamente el frontend web** hacia `dist/`. No compila el servicio Node.js.
2. **Incompatibilidad del Script `service:build` en Windows:**
   ```json
   "service:build": "rm -rf build/bundled-service && tsc -p bundled-service/tsconfig.json && node scripts/service-compat-gate.mjs build/bundled-service"
   ```
   En entornos Windows (cmd.exe / PowerShell ejecutados desde npm), el comando POSIX `rm` no existe:
   ```text
   "rm" no se reconoce como un comando interno o externo, programa o archivo por lotes ejecutable.
   ```
   Debido a este fallo silencioso al invocar `service:build`, el directorio `build/bundled-service` conservó los binarios compilados durante M1B.2. Al invocar posteriormente `ares-package dist build/bundled-service`, el empaquetador empaquetó el directorio de servicio obsoleto.

---

## 2. Solución de Ingeniería Implementada

### 2.1 Creación de `scripts/build-service.mjs` (Cross-Platform)
Se desarrolló un script de compilación nativo en Node.js que opera idénticamente en Windows, Linux y macOS:
1. **Limpieza Multiplataforma:** Ejecuta `fs.rmSync('build/bundled-service', { recursive: true, force: true })`.
2. **Compilación TypeScript Directa:** Invoca `node ./node_modules/typescript/bin/tsc -p bundled-service/tsconfig.json` sin intermediarios `.cmd` ni dependencias de shell de sistema.
3. **Copia Automatizada de Recursos:**
   * `bundled-service/package.json` -> `build/bundled-service/package.json`
   * `bundled-service/src/services.json` -> `build/bundled-service/services.json`
   * `bundled-service/src/setup/setup-page.html` -> `build/bundled-service/setup/setup-page.html`
4. **Validación Automática de Compatibilidad:** Invoca `service-compat-gate.mjs` para garantizar que no existan APIs modernas incompatibles con Node.js 0.12.2.

### 2.2 Actualización de `package.json` y `build.sh`
* En `package.json`: `"service:build": "node scripts/build-service.mjs"`
* En `build.sh`: Se sustituyó la secuencia `rm -rf / tsc / cp` por la llamada unificada a `node scripts/build-service.mjs`.

---

## 3. Matriz de Comparación Tripartita (Código Fuente vs Compilado vs IPK)

A continuación se demuestra la sincronización exacta entre los 3 niveles:

### 3.1 Control de Acceso Luna (`isAuthorizedCaller`)

| Nivel | Archivo | Contenido / Implementación | Estado |
| :--- | :--- | :--- | :---: |
| **Fuente TS** | `bundled-service/src/lan/service.ts` | `const claims = []; ... if (claims.length === 0) return false; for (let i = 0; i < claims.length; i++) if (claims[i] !== AUTHORIZED_APP_ID) return false;` | **FAIL-CLOSED** |
| **Compilado JS** | `build/bundled-service/lan/service.js` | `var claims = []; ... if (claims.length === 0) return false; for (var i = 0; i < claims.length; i++) if (claims[i] !== AUTHORIZED_APP_ID) return false;` | **FAIL-CLOSED** |
| **Dentro de IPK** | `data.tar.gz:.../lan/service.js` | `var claims = []; ... if (claims.length === 0) return false; for (var i = 0; i < claims.length; i++) if (claims[i] !== AUTHORIZED_APP_ID) return false;` | **FAIL-CLOSED** |

### 3.2 Mitigación DoS en Emparejamiento (`/pair`)

| Nivel | Archivo | Comportamiento con Cliente Bloqueado | Estado |
| :--- | :--- | :--- | :---: |
| **Fuente TS** | `bundled-service/src/lan/server.ts` | `if (current && current.blockedUntil > now) { sendJson(..., 429, ...); return; }` (NO incrementa `globalFailures`) | **INMUNE A DoS** |
| **Compilado JS** | `build/bundled-service/lan/server.js` | `if (current && current.blockedUntil > now) { sendJson(..., 429, ...); return; }` (NO incrementa `globalFailures`) | **INMUNE A DoS** |
| **Dentro de IPK** | `data.tar.gz:.../lan/server.js` | `if (current && current.blockedUntil > now) { sendJson(..., 429, ...); return; }` (NO incrementa `globalFailures`) | **INMUNE A DoS** |

### 3.3 Sanitización de URLs de Playlists en Frontend

| Nivel | Archivo | Redacción en Mensajes de Carga | Estado |
| :--- | :--- | :--- | :---: |
| **Fuente TS** | `src/services/playlist-service.ts` | `diagnosticStreamUrl(pl.url)` en líneas 217, 439, 587, 593 | **REDACTADO** |
| **Compilado JS** | `dist/js/app.js` | `"Failed to load Xtream playlist '".concat(O.name\|\|rn(O.url),"'")` | **REDACTADO** |
| **Dentro de IPK** | `data.tar.gz:.../js/app.js` | `"Failed to load Xtream playlist '".concat(O.name\|\|rn(O.url),"'")` | **REDACTADO** |

---

## 4. Resultado de la Verificación Automatizada

Se ejecutó un script de verificación automatizado sobre los artefactos compilados y extraídos del IPK:

```text
=== AUTOMATED VERIFICATION OF COMPILED ARTIFACTS ===
1. Service rejects absent identity (claims.length === 0): true
2. Old fail-open pattern absent: true
3. Methods with isAuthorizedCaller check: [ 'start', 'getInfo', 'heartbeat', 'stop', 'serviceEvents' ]
4. Server DoS fix (does not increment globalFailures on blocked client): true
5. Frontend playlist URL sanitization present: true
=== ALL VERIFICATIONS PASSED SUCCESSFULLY! ===
```

