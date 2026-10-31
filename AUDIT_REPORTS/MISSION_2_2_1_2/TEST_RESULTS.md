# Informe Detallado de Pruebas y Puertas de Calidad
## Misión M2.2.1.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Entorno de Ejecución:** PC Local (Windows PowerShell, Node.js v22.18.0)  

---

## 1. Resumen Consolidado de Puertas de Calidad

| Control / Suite de Pruebas | Comando Ejecutado | Pruebas | Resultado | Estado |
| :--- | :--- | :---: | :---: | :---: |
| **Comprobación Estricta de Tipos** | `npm run typecheck` | — | Exit 0 (0 errores) | **PASS** |
| **Linting y Reglas Compatibilidad** | `npm run lint` | — | Exit 0 (0 errores) | **PASS** |
| **Pruebas Unitarias Servidor Pruebas** | `npx vitest run src/utils/test-server.test.ts` | 36 | 36 pasadas / 0 falladas | **PASS** |
| **Pruebas Regresión Reproductor MP4** | `npx vitest run src/components/player-mp4.test.ts` | 8 | 8 pasadas / 0 falladas | **PASS** |
| **Compilación de Producción** | `npm run build` | — | Exit 0 (Chromium 53 clean) | **PASS** |

---

## 2. Detalle de Pruebas: `src/utils/test-server.test.ts` (36 Pruebas)

```text
✓ test-server host validation and security restrictions
  ✓ identifies IPv4 and IPv6 wildcard addresses
  ✓ identifies virtual and VPN interfaces as heuristic
  ✓ validates strictly RFC 1918 private IPv4 ranges and rejects non-private addresses
  ✓ rejects explicit --host 0.0.0.0 with wildcard error
  ✓ rejects explicit --host :: with wildcard error
  ✓ rejects explicit --host 0:0:0:0:0:0:0:0 with wildcard error
  ✓ rejects TEST_SERVER_HOST=0.0.0.0 with wildcard error
  ✓ rejects malformed IP addresses with syntax error
  ✓ rejects IP addresses that do not belong to any local network interface
  ✓ accepts valid local loopback address 127.0.0.1 and localhost
  ✓ defaults to 127.0.0.1 and port 8088 when no arguments given
  ✓ parses valid port and validates port boundaries
  ✓ resolves --lan to physical non-virtual LAN interface
  ✓ prioritizes physical LAN over VPN/virtual interfaces when resolving LAN IP
  ✓ rejects public IPv4 interfaces when resolving LAN IP and fails closed
  ✓ rejects link-local IPv4 interfaces when resolving LAN IP and fails closed
  ✓ fails with explicit ambiguity error when multiple RFC 1918 private candidates exist
  ✓ selects successfully when exactly one RFC 1918 private interface exists
  ✓ fails closed when no safe non-virtual physical LAN interface exists
  ✓ validates host against custom mock interfaces

✓ test-server range parsing
  ✓ returns null when no range is provided
  ✓ parses explicit start and end
  ✓ parses open-ended start
  ✓ parses suffix range
  ✓ returns invalid when start >= fileSize
  ✓ returns invalid when start > end
  ✓ returns invalid on non-numeric values

✓ test-server HTTP requests
  ✓ serves synthetic_test.mp4 with 200 OK and correct headers
  ✓ serves 206 Partial Content for byte range request
  ✓ serves 206 Partial Content for suffix range request
  ✓ serves 416 Range Not Satisfiable for out of bounds range
  ✓ responds to HEAD requests with empty body and correct content length
  ✓ blocks path traversal attempts with 403 Forbidden
  ✓ strictly rejects unapproved files outside the whitelist with 404
  ✓ serves approved synthetic_test.m3u playlist with 200 OK
  ✓ exposes ALLOWED_FIXTURE_FILES with only synthetic_test.mp4 and synthetic_test.m3u
```

---

## 3. Detalle de Pruebas: `src/components/player-mp4.test.ts` (8 Pruebas)

```text
✓ PlayerPipeline MP4 and HTTP error handling
  ✓ selects native webOS playback with video/mp4 MIME for .mp4 and .m4v URLs
  ✓ selects direct desktop playback for .mp4 URLs in desktop preview
  ✓ aborts playback on HTTP 403 Forbidden during probe and triggers onError(http_error)
  ✓ aborts playback on HTTP 404 Not Found during probe
  ✓ aborts playback on HTTP 416 Range Not Satisfiable during probe
  ✓ aborts playback on HTTP 500 Server Error during probe
  ✓ cancels in-flight probe on rapid channel change without firing error for superseded stream

✓ Player recovery on MP4 failure
  ✓ marks channel unavailable and transitions to next channel on playback error
```

---

## 4. Verificación de Compilación de Producción (`npm run build`)

```text
> webos-iptv-player@1.17.0 build
> tsc --noEmit && node esbuild.config.mjs

Compat gate: app, worker and Shaka bundles are Chromium-53 clean.
Build complete.
```
- Compatibilidad Chromium 53: 100% limpia sin llamadas o selectores no compatibles.
- Bundle minificado y listo para despliegue en `dist/`.

