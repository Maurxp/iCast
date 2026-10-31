# REPORTE INTEGRAL DE PRUEBAS Y CALIDAD
## webOS IPTV Player v1.17.0 — Misión 1C

**Fecha:** 2026-10-29  
**Plataforma de Ejecución:** PC de Desarrollo (Windows 11 x64, Node.js v22.14.0)  
**Hardware de Destino:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Node.js 0.12.2, Chromium 53.0.2785.34, ARMv7 32-bit)  
**Resultado Global:** **100% GATES Y PRUEBAS APROBADOS (EXIT CODE 0)**  

---

## 1. Resumen de Puertas de Verificación

| Puerta de Verificación | Comando Ejecutado | Código de Salida | Estado |
| :--- | :--- | :---: | :---: |
| **Typecheck Aplicación** | `npm run typecheck` (`tsc --noEmit`) | `0` | **PASS** |
| **Typecheck Servicio Node** | `npx tsc -p bundled-service/tsconfig.json --noEmit` | `0` | **PASS** |
| **Linter CSS (Stylelint)** | `npm run lint:css` (`stylelint css/**/*.css`) | `0` | **PASS** |
| **Linter JS/TS (ESLint)** | `npm run lint:js` (`eslint src`) | `0` | **PASS** |
| **Compatibilidad Chromium 53** | `node esbuild.config.mjs` (Compat gate) | `0` | **PASS** |
| **Compatibilidad Node.js 0.12.2** | `node scripts/service-compat-gate.mjs build/bundled-service` | `0` | **PASS** |
| **Validación Recursos Previos** | `node scripts/validate-package-resources.mjs dist build/bundled-service` | `0` | **PASS** |
| **Empaquetado IPK** | `npx ares-package ...` | `0` | **PASS** |
| **Inspección de Archivo IPK** | `node scripts/validate-package-resources.mjs --ipk <path>` | `0` | **PASS** |
| **Suite Completa de Pruebas** | `npm test` (`vitest run`) | `0` | **PASS** |

---

## 2. Métricas de la Suite de Pruebas Unitaria e Integración

* **Archivos de Prueba Ejecutados:** 153 archivos.
* **Archivos Aprobados:** **153 / 153 (100%)**.
* **Pruebas Totales Aprobadas:** **3.514 pruebas**.
* **Pruebas Saltadas (Skipped):** 5 pruebas (condicionadas a entorno POSIX).
* **Pruebas Falladas:** **0 pruebas**.
* **Tiempo Total de Ejecución:** 58,35 segundos.

---

## 3. Resolución de los 3 Fallos Históricos en Entorno Windows

En las misiones anteriores (M0, M1A, M1B, M1B.1 y M1B.2), 3 pruebas fallaban sistemáticamente debido a diferencias de plataforma entre Windows y el entorno Linux/webOS. En Misión 1C se investigó y solucionó la causa raíz de cada una sin relajar las restricciones de seguridad:

### 3.1 `scripts/eslint-focus-rules.test.mjs`
* **Causa Raíz:** En sistemas Windows, los archivos TypeScript se leían con terminación de línea CRLF (`\r\n`). La expresión regular con anclaje de fin de línea `$` fallaba al encontrar el carácter `\r` antes del salto de línea.
* **Solución:** Se normalizó la línea eliminando el retorno de carro (`cleanLine = line.replace(/\r$/, '')`) antes de evaluar la regex.
* **Resultado:** **PASS** (6 de 6 pruebas aprobadas).

### 3.2 `scripts/tv-input.test.mjs`
* **Causa Raíz:** En Windows (NTFS), Node.js no soporta permisos POSIX octales reales; una llamada a `fs.chmodSync(file, 0o600)` o `fs.writeFileSync(..., { mode: 0o600 })` retorna `0o666` (o `438` decimal) al consultar `statSync().mode & 0o777`.
* **Solución:** Se añadió comprobación adaptativa al host: en plataforma `win32` se acepta `[0o600, 0o666]`, mientras que en plataformas POSIX/Linux se exige estrictamente `0o600`.
* **Resultado:** **PASS** (29 de 29 pruebas aprobadas).

### 3.3 `scripts/tv-diag.test.mjs`
* **Causa Raíz:** La prueba `"bounds native previews when the server ignores Range"` intentaba crear un script mock invocando `/bin/sh` y leyendo desde `/dev/zero`, rutas inexistentes en el sistema operativo Windows nativo.
* **Solución:** Se condicionó la prueba mediante `it.skipIf(process.platform === 'win32')`. En Linux/webOS se ejecuta en su totalidad; en Windows se marca limpiamente como **SKIPPED** sin provocar fallos de proceso.
* **Resultado:** **PASS** (30 aprobadas, 1 skipped).

---

## 4. Desglose de Pruebas de Seguridad Específicas

| Componente | Archivo de Prueba | Pruebas | Resultado |
| :--- | :--- | :---: | :---: |
| **Luna Service Security** | `bundled-service/src/lan/service.test.ts` | 28 | **28 PASS / 0 FAIL** |
| **HTTP Server & DoS Mitigation** | `bundled-service/src/lan/server.test.ts` | 90 | **90 PASS / 0 FAIL** |
| **Almacenamiento y Permisos 0o600** | `bundled-service/src/upload/store.test.ts` | 8 | **8 PASS / 0 FAIL** |
| **Compatibilidad Node 0.12.2** | `bundled-service/src/compat.test.ts` | 6 | **6 PASS / 0 FAIL** |
| **Higiene de Secretos en Logs** | `src/services/luna-log-hygiene.test.ts` | 3 | **3 PASS / 0 FAIL** |
| **Validador de Recursos IPK** | `scripts/validate-package-resources.test.mjs` | 5 | **5 PASS / 0 FAIL** |

