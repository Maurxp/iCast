# RESULTADOS DE PRUEBAS DE REGRESIÓN EN PC (TEST RESULTS)
## Misión M2.3.1 — webOS IPTV Player v1.17.0
**Fecha:** 2026-10-30 / 2026-10-31  
**Entorno de Ejecución:** PC Local (Windows / Node v24.18.0)  
**Estado:** **TODAS LAS PRUEBAS SUPERADAS EXITOSAMENTE (100% PASS)**

---

## 1. Resumen de Pruebas Ejecutadas

En cumplimiento de la directiva de la Fase G, dado que esta misión no modificó código de producción ni dependencias, se ejecutaron las suites de verificación y compilación relevantes sin alterar lockfiles ni paquetes:

| Comando / Suite | Componente Evaluado | Pruebas Ejecutadas | Resultado | Código de Retorno |
| :--- | :--- | :--- | :--- | :--- |
| `npm run typecheck` | Comprobación estricta de tipos TypeScript (tsc) | Todo el codebase (`src/`, `benchmarks/`, `bundled-service/`) | **PASS** | `0` |
| `npm run lint` | Stylelint (CSS) + ESLint (Chromium 53 compat gate) | Reglas CSS y compatibilidad Chromium 53 | **PASS** | `0` |
| `npx vitest run src/utils/test-server.test.ts` | Servidor de pruebas local (Range, 206, IP filter) | 36 pruebas unitarias | **PASS (36/36)** | `0` |
| `npx vitest run src/components/player-mp4.test.ts` | Pipeline MP4, clasificación HTTP y recuperación | 8 pruebas unitarias | **PASS (8/8)** | `0` |
| `npm run build` | Bundle esbuild (`chrome53` target) y empaquetado | Generación de bundle minificado en `dist/` | **PASS** | `0` |

---

## 2. Detalle de Salida por Suite

### 2.1 Verificación de Tipos TypeScript (`npm run typecheck`)
```text
> webos-iptv-player@1.17.0 typecheck
> tsc --noEmit
Exit code: 0
```
* **Diagnóstico:** Cero errores de tipos con opciones `strict`, `noUnusedLocals`, `noUnusedParameters` y `noImplicitReturns` activas.

### 2.2 Verificación de Estilo y Compatibilidad (`npm run lint`)
```text
> webos-iptv-player@1.17.0 lint
> npm run lint:css && npm run lint:js

> webos-iptv-player@1.17.0 lint:css
> stylelint "css/**/*.css"

> webos-iptv-player@1.17.0 lint:js
> eslint src
Exit code: 0
```
* **Diagnóstico:** Cumplimiento total de la puerta de compatibilidad para Chromium 53 (sin selectores mixtos prohibidos ni APIs modernas incompatibles sin polyfill).

### 2.3 Pruebas de Unidad: Servidor de Pruebas y Pipeline MP4
```text
 RUN  v5.0.5 C:/Users/amaur/Desktop/webos-iptv-player

 ✓ src/components/player-mp4.test.ts (8 tests) 431ms
 ✓ src/utils/test-server.test.ts (36 tests) 4079ms

 Test Files  2 passed (2)
      Tests  44 passed (44)
   Duration  4.34s
Exit code: 0
```
* **Cobertura Clave:**
  * Servidor de pruebas rechaza explícitamente `0.0.0.0` y direcciones wildcard.
  * Servidor solo selecciona direcciones RFC 1918 privadas e ignora interfaces virtuales/VPN (Radmin, Hyper-V, WSL, etc.).
  * Respuestas correctas a peticiones `Range: bytes=` con código `206 Partial Content`.
  * Clasificación automática de URLs `.mp4` y `.m4v` asignando MIME `video/mp4`.
  * Protección ante respuestas HTTP 403, 404, 416 y 500 con aborto controlado sin congelar el hilo UI.

### 2.4 Compilación Final (`npm run build`)
```text
> webos-iptv-player@1.17.0 build
> tsc --noEmit && node esbuild.config.mjs

Compat gate: app, worker and Shaka bundles are Chromium-53 clean.
Build complete.
Exit code: 0
```
* **Diagnóstico:** Los bundles generados para la aplicación, los workers y Shaka Player pasaron el analizador de sintaxis Chromium 53.

---

## 3. Justificación de Pruebas Omitidas
* **Pruebas E2E completas de Playwright (`npm run test:e2e`):** Se omitieron deliberadamente en esta fase porque el código de producción de la UI no fue modificado respecto a la versión ya validada en M2.2.1.2 y M2.3, y los componentes de streaming progresivo cuentan con validación empírica directa sobre el hardware físico.

