# RESULTADOS FINALES DE PRUEBAS Y CALIDAD
## webOS IPTV Player v1.17.0 — Misión 1C Finalization

**Fecha:** 2026-10-30  
**Entorno de Ejecución:** PC Local (Windows 11 x64, Node.js v24.18.0)  
**Hardware de Destino:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Node.js 0.12.2, Chromium 53.0.2785.34, ARMv7 32-bit)  
**Resultado:** **100% GATES Y SUITES APROBADOS (EXIT CODE 0)**  

---

## 1. Registro de Comandos y Códigos de Salida

| Paso | Comando Ejecutado | Código de Salida | Estado |
| :---: | :--- | :---: | :---: |
| **1** | `npm run build` | `0` | **PASS** |
| **2** | `npm run service:typecheck` | `0` | **PASS** |
| **3** | `npm run service:build` | `0` | **PASS** |
| **4a** | `npm run lint` (`stylelint` + `eslint`) | `0` | **PASS** |
| **4b** | `node scripts/service-compat-gate.mjs build/bundled-service` | `0` | **PASS** |
| **4c** | `node scripts/shaka-compat-gate.mjs dist/js/shaka-player.dash.js` | `0` | **PASS** |
| **5** | `npm test` (`vitest run` — suite completa de 153 archivos) | `0` | **PASS** |
| **6** | `node scripts/validate-package-resources.mjs dist build/bundled-service` | `0` | **PASS** |
| **7** | `npx ares-package --no-minify -e "*preview-libs.js" dist build/bundled-service ...` | `0` | **PASS** |
| **8** | `node scripts/validate-package-resources.mjs --ipk <path>` | `0` | **PASS** |

---

## 2. Desglose de Pruebas Automatizadas

```text
Test Files: 153 passed (153)
     Tests: 3514 passed | 5 skipped (3519)
  Duration: 51.04s
```

### 2.1 Pruebas de Seguridad de Servicio Luna (`bundled-service/src/lan/service.test.ts`)
* 28 pruebas ejecutadas y aprobadas (100% pass):
  * Comprobación unitaria de la política `isAuthorizedCaller` (12 pruebas).
  * Rechazo de identidad ausente, malformada o contradictoria.
  * Comprobación de minimización de datos en `start` y `getInfo`.
  * Comprobación de protección de `stop`, `heartbeat` y `serviceEvents`.

### 2.2 Pruebas de Servidor LAN y DoS (`bundled-service/src/lan/server.test.ts`)
* 90 pruebas ejecutadas y aprobadas (100% pass):
  * Validación estricta de CORS RFC 1918 (orígenes privados y loopback permitidos, imitaciones rechazadas).
  * Protección loopback contra páginas web hostiles.
  * Inmunidad a DoS cuando una IP bloqueada martillea `/pair`.
  * Rotación automática tras 20 fallos de red.
  * Expiración temporal del PIN por TTL (15 minutos).

### 2.3 Higiene de Secretos en Registros (`src/services/luna-log-hygiene.test.ts`)
* 3 pruebas ejecutadas y aprobadas (100% pass):
  * Redacción de credenciales en URLs de diagnóstico.
  * Almacenamiento seguro y silencioso de tokens en memoria.
  * Formato sanitizado en el log de inicio de la aplicación.

