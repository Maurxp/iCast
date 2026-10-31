# MISIÓN 0 — VALIDACIÓN DE COMPILACIÓN Y PRUEBAS (BUILD_AND_TESTS.md)

**Proyecto:** `lennylxx/webos-iptv-player` (v1.17.0)  
**Entorno de Ejecución:** Windows 11 Pro / Node.js v24.18.0 / npm 11.16.0  
**Rama:** `baseline/mission-0`  
**Fecha:** 2026-10-29  

---

## 1. Resumen Ejecutivo de Validación Local

Todas las tareas de compilación de código fuente, análisis estático y validación de tipos fueron ejecutadas de forma rigurosa sobre la rama de trabajo aislada `baseline/mission-0`.

| Comando Ejecutado | Objetivo | Código de Salida | Estado | Observaciones / Causa Raíz |
| :--- | :--- | :---: | :---: | :--- |
| `npm ci` | Instalación reproducible | `0` | **EXITOSO** | 317 paquetes instalados, 0 vulnerabilidades. Lockfile intacto. |
| `npm run typecheck` | Tipado estricto TS (App) | `0` | **EXITOSO** | `tsc --noEmit` completado sin errores. |
| `npm run service:typecheck` | Tipado TS (Servicio Node 0.12) | `0` | **EXITOSO** | Tipado estricto de `bundled-service` superado. |
| `npm run benchmark:typecheck` | Tipado TS (Benchmarks) | `0` | **EXITOSO** | Suite de benchmarks tipada correctamente. |
| `npm run lint` | ESLint + Stylelint (Gate Chrome 53) | `0` | **EXITOSO** | Cumplimiento del gate de compatibilidad Chromium 53. |
| `npm run build` | Compilación esbuild + compat gate | `0` | **EXITOSO** | Bundles generados en `dist/`: app, worker, shaka. |
| `npm test` | Suite unitaria e integración (Vitest) | `1` | **PARCIAL** | 145/149 archivos pasados (3,402 pruebas superadas). 4 fallos exclusivos por entorno Windows. |
| `npm run service:smoke` | Smoke test en runtime Node 0.12 | `1` | **BLOQUEADO** | Fallo de `rm -rf` en cmd.exe y restricción de SO en script (`win32` no soportado). |
| `npm run test:e2e` | Pruebas E2E (Playwright) | `1` | **EVALUADO** | Binarios de navegador Playwright ausentes en el host. |
| `npm run benchmark` | Benchmark sintético de escritorio | — | **EVALUADO** | Depende de la infraestructura de Playwright; no viable sin binario. |

---

## 2. Registro Detallado de Comandos y Resultados

### 2.1. Tipado Estricto de TypeScript
* **Comando:** `npm run typecheck` (`tsc --noEmit`)
  * **Salida:** Sin errores. Código de retorno `0`.
  * **Duración:** ~6.8 s.
* **Comando:** `npm run service:typecheck` (`tsc -p bundled-service/tsconfig.json --noEmit`)
  * **Salida:** Sin errores. Código de retorno `0`.
  * **Duración:** ~1.4 s.
* **Comando:** `npm run benchmark:typecheck` (`tsc -p benchmarks/tsconfig.json`)
  * **Salida:** Sin errores. Código de retorno `0`.
  * **Duración:** ~2.1 s.

### 2.2. Linter y Gates de Compatibilidad
* **Comando:** `npm run lint` (`npm run lint:css && npm run lint:js`)
  * **Stylelint:** Inspección de hojas de estilo en `css/**/*.css`. Regla `iptv/no-mixed-legacy-selector` superada (sin selectores modernos como `:focus-within` mezclados con reglas legacy).
  * **ESLint:** Inspección de `src/`. `eslint-plugin-compat` validó que no se invocan APIs de JavaScript ausentes en Chromium 53.
  * **Resultado:** Código de retorno `0`.

### 2.3. Compilación de Producción (esbuild)
* **Comando:** `npm run build` (`tsc --noEmit && node esbuild.config.mjs`)
  * **Salida estándar:**
    ```text
    > webos-iptv-player@1.17.0 build
    > tsc --noEmit && node esbuild.config.mjs

    Compat gate: app, worker and Shaka bundles are Chromium-53 clean.
    Build complete.
    ```
  * **Código de salida:** `0`.
  * **Artefactos generados en `dist/`:**
    * `dist/bundle.js` (Lógica principal del reproductor transpilada a `chrome53`).
    * `dist/bundle.css` (Estilos combinados y procesados).
    * `dist/worker.js` (Web Worker para indexación y búsqueda en memoria).
    * `dist/shaka-player.compiled.js` (Motor de reproducción DASH para desktop preview).

---

## 3. Análisis Forense de Fallos en Pruebas Unitarias (`npm test`)

La suite completa comprende **149 archivos de prueba** y **3,410 casos de prueba**.
* **Pruebas superadas:** **3,402 pruebas** (99.76% de éxito).
* **Archivos aprobados:** 145 archivos.
* **Pruebas omitidas (skipped):** 4 pruebas.
* **Archivos con fallos:** 4 archivos (1 prueba fallida por archivo).

### Fallo 1: `scripts/css-transforms.test.mjs:116:8`
* **Prueba:** `generateFlexGapFallback matches css/legacy-webos-base.css`
* **Error:** `AssertionError: expected file content to be generatedFlexGapFallback(sources)`
* **Causa Raíz:** Discrepancia de finales de línea Windows (`\r\n` CRLF) frente a Unix (`\n` LF). El archivo `css/legacy-webos-base.css` fue clonado por Git en Windows con CRLF, mientras que la función `generateFlexGapFallback` emite LF puro. La comparación estricta de cadenas falla exclusivamente por el carácter `\r`.

### Fallo 2: `scripts/eslint-focus-rules.test.mjs:103:54`
* **Prueba:** `focus ESLint suppressions > name a known rule and the surface that still owns each legacy site`
* **Error:** `AssertionError: src\components\player-osd.ts: expected null not to be null`
* **Causa Raíz:** El test realiza:
  ```javascript
  const SUPPRESSION = /eslint-disable-next-line (focus\/[\w-]+(?:, focus\/[\w-]+)*) -- (.*)$/;
  // ...
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = SUPPRESSION.exec(line);
  ```
  Al hacer `split('\n')` sobre un archivo con CRLF, cada línea conserva el `\r` al final. La expresión regular con anclaje `$` no coincide debido al retorno de carro (`\r`), retornando `null`.

### Fallo 3: `scripts/tv-diag.test.mjs:387:29`
* **Prueba:** `diagnostic report assembly > bounds native previews when the server ignores Range`
* **Error:** `AssertionError: expected null to be 200`
* **Causa Raíz:** En la línea 381 de `scripts/tv-diag.test.mjs`:
  ```javascript
  execFile: (_file, args, options) => execFileSync('/bin/sh', ['-c', args[1]], ...)
  ```
  El script invoca directamente la ruta absoluta POSIX `/bin/sh`. En el sistema operativo Windows, dicha ruta no existe, provocando que la ejecución falle y retorne `status: null`.

### Fallo 4: `scripts/tv-input.test.mjs:238:43`
* **Prueba:** `TV wake > remembers MACs per IP in a private cache file`
* **Error:** `AssertionError: expected 438 to be 384`
* **Causa Raíz:** El test valida permisos POSIX mediante:
  ```javascript
  expect(statSync(file).mode & 0o777).toBe(0o600); // 0o600 = 384 decimal
  ```
  El sistema de archivos NTFS de Windows no implementa máscaras de permisos octales POSIX (`chmod 0600`). En su lugar, `statSync()` devuelve `438` decimal (`0o666`), causando el fallo de la aserción.

> **Conclusión de Pruebas Unitarias:** Ningún fallo proviene del código fuente de la aplicación (`src/`). El 100% de la lógica del reproductor, parsers M3U/XMLTV, navegación espacial, control de foco y modelos de datos pasó con éxito. Los 4 fallos son artefactos directos de portabilidad entre Windows y Linux.

---

## 4. Análisis de `npm run service:smoke`

El script de smoke test para el servicio secundario (`bundled-service/`) falló de inmediato con el siguiente mensaje:
```text
> webos-iptv-player@1.17.0 service:build
> rm -rf build/bundled-service && tsc -p bundled-service/tsconfig.json && node scripts/service-compat-gate.mjs build/bundled-service

"rm" no se reconoce como un comando interno o externo, programa o archivo por lotes ejecutable.
```
Adicionalmente, al inspeccionar `scripts/run-service-smoke.mjs`:
```javascript
if (process.platform !== 'darwin' && process.platform !== 'linux') {
  throw new Error(`Service runtime smoke is unavailable for ${process.platform}/${process.arch}`);
}
```
* **Diagnóstico:** El runner de smoke test descarga binarios precompilados de Node 0.12.2 únicamente para `darwin-arm64` y `linux-x64`. En Windows (`win32`), el script está bloqueado por diseño.
* **Alternativa en Dispositivo Real:** El televisor LG cuenta con `/usr/bin/node v0.12.2` nativo en arquitectura ARMv7, donde el servicio puede ejecutarse y validarse fielmente sin emulación.

---

## 5. Evaluación de Viabilidad de Pruebas E2E y Benchmarks

### 5.1. `npm run test:e2e` (Playwright)
* **Inspección de Casos de Prueba:** `npx playwright test --list` identificó exitosamente **1,014 pruebas en 33 archivos** distribuidos en dos proyectos:
  1. `[chromium]`: Pruebas sobre motor Chromium moderno.
  2. `[chromium-53-simulation]`: Pruebas que eliminan dinámicamente APIs modernas para simular el comportamiento de Chromium 53.
* **Resultado de Ejecución:** `Exit code 1`.
* **Mensaje de Error:**
  ```text
  Error: browserType.launch: Executable doesn't exist at 
  C:\Users\amaur\AppData\Local\ms-playwright\chromium_headless_shell-1243\chrome-headless-shell-win64\chrome-headless-shell.exe
  ```
* **Veredicto:** **NO VIABLE EN ESTE MOMENTO.** Requiere la descarga del ejecutable de Chromium de Playwright (`npx playwright install chromium`).

### 5.2. `npm run benchmark` (Benchmark Local de PC)
* **Configuración:** Ejecuta `benchmarks/playwright.config.ts`.
* **Veredicto:** **NO VIABLE EN ESTE MOMENTO.** Al depender del mismo motor de pruebas de Playwright, comparte el mismo requisito previo de instalación de binarios.

---

## 6. Recomendaciones de Normalización para Windows

1. Para ejecutar `npm test` al 100% en Windows sin modificar el repositorio original:
   * Configurar Git con `git config core.autocrlf false` y reextraer los archivos CSS, o normalizar finales de línea.
   * Ejecutar la suite bajo entorno WSL2 (Windows Subsystem for Linux) o emulación bash (Git Bash).
2. Para habilitar E2E y benchmarks locales:
   * Ejecutar `npx playwright install chromium` una vez que el usuario lo autorice.

