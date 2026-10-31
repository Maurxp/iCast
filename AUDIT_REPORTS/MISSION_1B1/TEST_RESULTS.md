# REPORTE DE RESULTADOS DE PRUEBAS — TEST RESULTS
## webOS IPTV Player v1.17.0 — Misión 1B.1

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Chromium 53 / Node 0.12.2)  
**Fecha:** 2026-10-29  
**Estado General:** 3.476 Pruebas Aprobadas (100% de Pruebas de Seguridad y Servicio Exitosas)  

---

## 1. Resumen Global de Ejecución

| Métrica | Valor |
| :--- | :--- |
| **Archivos de Prueba Ejecutados** | 151 suites |
| **Archivos con Todas las Pruebas Aprobadas** | 148 suites (98.0%) |
| **Pruebas Totales Aprobadas** | **3.476 tests** |
| **Pruebas de Seguridad Nuevas / Modificadas** | **140 tests (100% aprobadas)** |
| **Pruebas Omitidas (Skipped)** | 4 tests |
| **Pruebas Fallidas por Entorno Windows** | 3 tests (0.08% del total, no imputables al código de producción) |
| **Tiempo Total de Ejecución de Pruebas** | ~49.06 segundos |

---

## 2. Desglose de Pruebas de Seguridad y Nuevos Frentes (Misión 1B.1)

### 2.1 Frente A: Protección de Loopback y Tokens (`server.test.ts`)
* **Archivo:** `bundled-service/src/lan/server.test.ts`
* **Pruebas Totales:** 86 tests (100% Aprobadas).
* **Casos Críticos Verificados:**
  1. `strictly blocks unauthenticated loopback requests to /info` (403 Forbidden).
  2. `strictly blocks loopback requests to /info with invalid token or setupToken` (403 Forbidden).
  3. `allows loopback requests to /info with valid appToken (Luna IPC boundary)` (200 OK).
  4. `accepts appToken via X-App-Token header or query param` (200 OK).
  5. `strictly blocks unauthenticated loopback requests to /uploads list` (403 Forbidden).
  6. `strictly blocks unauthenticated loopback requests to /uploads/:id.m3u content` (403 Forbidden).
  7. `strictly blocks unauthenticated loopback requests to DELETE /uploads/:id` (403 Forbidden).
  8. `strictly blocks unauthenticated loopback requests to /setup-actions` (403 Forbidden).
  9. `strictly blocks unauthenticated loopback requests to /setup-state` (403 Forbidden).
  10. `allows access to uploads with appToken (TV app) or setupToken (phone)` (200 OK).

### 2.2 Frente B: Validación Estricta RFC 1918 CORS (`server.test.ts`)
* **Archivo:** `bundled-service/src/lan/server.test.ts`
* **Casos Críticos Verificados (32 aserciones):**
  * Orígenes RFC 1918 aprobados: `192.168.1.50:8080`, `192.168.0.1`, `10.0.0.1:3000`, `10.255.255.255`, `172.16.0.1`, `172.24.10.20`, `172.31.255.254:9000`.
  * Orígenes loopback aprobados: `http://localhost`, `http://127.0.0.1:8080`, `http://[::1]:8080`.
  * Esquema de paquete local webOS aprobado: `file://`.
  * Rechazo estricto de ataques por prefijo mimético: `http://192.168.attacker.com`, `http://10.attacker.com`, `http://172.16.0.1.attacker.com`, `http://127.0.0.1.attacker.com`.
  * Rechazo de IPs públicas y fuera de rango: `8.8.8.8`, `1.1.1.1`, `172.15.255.255`, `172.32.0.1`, `192.169.1.1`.
  * Rechazo de orígenes opacos: `null`.
  * Omisión de cabecera CORS en peticiones sin encabezado `Origin`.
  * Manejo de preflight `OPTIONS`: `204 No Content` con cabeceras completas para orígenes autorizados, y `403 Forbidden` sin cabecera `Access-Control-Allow-Origin` para orígenes desautorizados.

### 2.3 Frente C: Permisos de Almacenamiento (`store.test.ts`)
* **Archivo:** `bundled-service/src/upload/store.test.ts`
* **Pruebas Totales:** 8 tests (100% Aprobadas).
* **Casos Verificados:**
  1. `secureChmod`: Invocación con modo solicitado (`0o600` / `0o700`).
  2. `secureChmod`: Tolerancia y captura ante excepciones `EPERM` en sistemas no POSIX.
  3. `enforceStorePermissions`: Aplicación de `0o700` a directorios y `0o600` a archivos `.m3u` y `.json`.
  4. `UploadStore`: Reconciliación retroactiva automática de permisos al instanciarse.
  5. `UploadStore.save`: Aplicación obligatoria de `0o600` tanto en creación inicial como en sobrescrituras de inodos existentes.
  6. `resolveDataDir`: Creación segura de carpetas candidatas con modo `0o700`.

### 2.4 Frente D: Validación de Paquetes e Inspector IPK (`validate-package-resources.test.mjs`)
* **Archivo:** `scripts/validate-package-resources.test.mjs`
* **Pruebas Totales:** 15 tests (100% Aprobadas).
* **Casos Verificados:**
  1. Validación exitosa de recursos previos en `dist/` y `build/bundled-service/`.
  2. Detección de `preview-libs.js` en `index.html`.
  3. Detección de scripts o estilos faltantes en `index.html`.
  4. Parser de archivos `.ipk` (`ar` + `tar.gz` en memoria).
  5. Validación del paquete `.ipk` real generado en `AUDIT_REPORTS/`.
  6. Detección y bloqueo de binarios ELF x86_64 incompatibles con ARMv7.
  7. Aceptación de binarios ELF ARMv7 32-bit legítimos.

### 2.5 Integración de Clientes y Servicio
* **`src/services/phone-setup.integration.test.ts`:** 1 test (100% Aprobada).
  * Flujo completo: arranque del servidor, publicación de estado, consulta autenticada, subida M3U, consumo de acciones y confirmación.
* **`src/services/lan-clients.test.ts`:** 34 tests (100% Aprobadas).
  * Comunicación de `UploadClient` y `SetupClient` con paso automático de tokens de autenticación.

---

## 3. Análisis de las 3 Pruebas Fallidas por Entorno Windows

Las 3 únicas pruebas que fallaron en la suite completa de 3.483 pruebas corresponden a características específicas del host Windows de desarrollo, ya documentadas en las Misiones 0 y 1B:

1. **`scripts/tv-input.test.mjs` (Línea 238):**
   * *Causa:* Comprueba `statSync(file).mode & 0o777 === 0o600`. En Windows NTFS, los atributos de archivo POSIX no existen y `statSync` reporta `438` (`0o666`). En Linux (webOS TV), reporta `0o600` exactamente.
2. **`scripts/tv-diag.test.mjs` (Línea 387):**
   * *Causa:* Timeout en un servidor mock local de rango HTTP al probar curl nativo sobre Windows.
3. **`scripts/eslint-focus-rules.test.mjs` (Línea 103):**
   * *Causa:* Separadores de ruta de archivo en Windows (`\`) frente a expresiones regulares que esperan `/`.

**Conclusión Técnica:** Ninguna de las 3 fallas afecta al código que se compila y ejecuta en el televisor LG webOS ni al empaquetado del IPK.

