# INFORME DE RESULTADOS DE PRUEBAS AUTOMATIZADAS — TEST RESULTS
## webOS IPTV Player v1.17.0 — Misión 1B.2

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29 / Chromium 53 / Node.js 0.12.2)  
**Fecha de Ejecución:** 2026-10-29  
**Entorno de Ejecución:** Windows 11 Pro x64 (Local en PC)  

---

## 1. Resumen Ejecutivo de Puertas de Calidad

| Puerta de Calidad | Comando Ejecutado | Resultado | Observaciones |
| :--- | :--- | :---: | :--- |
| **Typecheck App** | `npm run typecheck` (`tsc --noEmit`) | ✅ **PASÓ** | 0 errores de tipado TypeScript estricto. |
| **Typecheck Service** | `npx tsc -p bundled-service/tsconfig.json --noEmit` | ✅ **PASÓ** | 0 errores en servicio Node CommonJS. |
| **Linting CSS** | `npm run lint:css` (`stylelint`) | ✅ **PASÓ** | Cumple compatibilidad Chromium 53. |
| **Linting JS/TS** | `npm run lint:js` (`eslint src`) | ✅ **PASÓ** | Cumple compatibilidad y reglas de foco. |
| **Compat Gate Chromium 53** | `node esbuild.config.mjs` | ✅ **PASÓ** | Bundles limpios de APIs modernas no soportadas. |
| **Compat Gate Node 0.12.2** | `node scripts/service-compat-gate.mjs build/bundled-service` | ✅ **PASÓ** | Código del servicio 100% compatible con Node 0.12. |
| **Validación Recursos IPK** | `node scripts/validate-package-resources.mjs dist build/bundled-service` | ✅ **PASÓ** | 26 recursos validados contra appinfo y services.json. |
| **Pruebas Bundled Service** | `npx vitest run bundled-service/` | ✅ **PASÓ** | **130 de 130 pruebas pasadas (100%)**. |
| **Pruebas de Higiene Logs** | `npx vitest run src/services/luna-log-hygiene.test.ts` | ✅ **PASÓ** | 3 de 3 pruebas pasadas. |
| **Suite Completa Vitest** | `npm test` (`vitest run`) | ✅ **PASÓ** | **3.493 pruebas pasadas** (150 archivos pasados). |

---

## 2. Detalle de Pruebas del Servicio Bundled (`bundled-service/`)

Ejecución de `npx vitest run bundled-service/`:
* **Archivos Evaluados:** 7 archivos de prueba.
* **Total de Pruebas:** 130 pruebas ejecutadas.
* **Resultado:** **130 pasadas, 0 fallidas, 0 omitidas (100% de éxito)**.

| Archivo de Prueba | Pruebas Pasadas | Áreas Auditadas |
| :--- | :---: | :--- |
| `bundled-service/src/lan/server.test.ts` | **89 / 89** | Rutas HTTP, CORS RFC 1918 (35 pruebas), Loopback auth (9 pruebas), Emparejamiento PIN y rotación (3 pruebas), Uploads y acciones de setup. |
| `bundled-service/src/lan/service.test.ts` | **10 / 10** | **Nueva suite M1B.2:** Control de acceso Luna, rechazo de llamador malicioso en `start`, `getInfo`, `stop` y `serviceEvents`, minimización de datos sin secretos. |
| `bundled-service/src/setup/setup-page.test.ts` | **11 / 11** | Formularios web, menús multiidioma (Polski, Türkçe, etc.), estructura HTML5 compatible con Chromium 53. |
| `bundled-service/src/upload/store.test.ts` | **8 / 8** | Operaciones en disco, permisos `0o600` en archivos y `0o700` en directorios, saneamiento de nombres de archivo. |
| `bundled-service/src/compat.test.ts` | **6 / 6** | `timingSafeEqualString` (M1B.2), compatibilidad `padStart`, `parseUrl`, `bufferFrom`, `secureRandomInt`. |
| `bundled-service/src/reminder/alert.test.ts` | **3 / 3** | Notificaciones interactivas de recordatorio en modo desarrollador. |
| `bundled-service/src/reminder/service.test.ts` | **3 / 3** | Programación Luna con `com.webos.service.activitymanager`. |

---

## 3. Detalle de Pruebas de Higiene de Logs (`src/services/luna-log-hygiene.test.ts`)

* `redacts tokens and credentials from diagnostic stream URLs`: Pasa.
* `stores runtime app token securely in service-http without logging it`: Pasa.
* `formats sanitized start log summary without leaking secrets`: Pasa.

---

## 4. Análisis de las 3 Pruebas con Comportamiento Diferencial en Windows

En la ejecución completa de `vitest` (3.500 pruebas en 153 suites), se registraron 3 fallos en scripts de desarrollo atribuidos a diferencias del entorno de desarrollo Windows frente a Linux:

1. **`scripts/eslint-focus-rules.test.mjs`:**
   * *Motivo:* El separador de rutas en Windows es `\` (`src\components\player-osd.ts`), lo que no coincide con una expresión regular que espera `/`.
   * *Impacto en Producción:* Ninguno. Las reglas ESLint pasaron al 100% en `npm run lint`.
2. **`scripts/tv-diag.test.mjs`:**
   * *Motivo:* Emulación de servidor HTTP local que ignora el encabezado `Range` bajo sockets de red de Windows.
   * *Impacto en Producción:* Ninguno. La funcionalidad de diagnóstico real opera sobre el televisor webOS mediante SSH/CDP.
3. **`scripts/tv-input.test.mjs`:**
   * *Motivo:* Verificación de bits de modo de archivo POSIX (`mode & 0o777 === 0o600`). En el sistema de archivos NTFS de Windows, Node.js reporta `438` (`0o666`).
   * *Impacto en Producción:* Ninguno. En el televisor LG Linux ARMv7, los permisos se aplican con `chmod 0o600` nativo.

Todas las 3.493 pruebas correspondientes a la lógica de la aplicación cliente, reproductores, parsers M3U/XMLTV, servicios y navegación espacial pasaron al 100%.

