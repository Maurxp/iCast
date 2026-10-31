# Resultados Detallados de Pruebas Automatizadas
## Misión M2.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Herramienta de Ejecución:** Vitest v5.0.5 en entorno Node / JSDOM  

---

## 1. Resumen Global de la Suite de Pruebas

```text
========================================================================
Test Files  155 passed (155 archivos de pruebas)
Tests       3.537 passed | 5 skipped (3.542 pruebas totales)
Errors      0 unhandled errors
Duration    47.69 segundos
Exit Code   0 (SUCCESS)
========================================================================
```

---

## 2. Cobertura de Pruebas por Módulo Crítico

### 2.1 Reproductor Multimedia y Pipeline
- **`src/components/player-mp4.test.ts` (8 pruebas, 8 passed):**
  - Detección de `.mp4` y `.m4v` en webOS nativo.
  - Enrutamiento directo en vista previa de escritorio.
  - Manejo de HTTP 403 Forbidden durante el sondeo.
  - Manejo de HTTP 404 Not Found durante el sondeo.
  - Manejo de HTTP 416 Range Not Satisfiable durante el sondeo.
  - Manejo de HTTP 500 Internal Server Error durante el sondeo.
  - Cancelación limpia de sondeos en vuelo ante cambio rápido de canal.
  - Registro de fallo en `ChannelHealthService` y avance automático de canal.
- **`src/components/player-pipeline.test.ts` (34 pruebas, 34 passed):**
  - Ciclo de vida de cargadores y destrucción de instancias MSE.
  - Enrutamiento de flujos TS, FLV, HLS y DASH.
  - Integración de Shaka Player y DRM.
- **`src/components/player-pipeline-webos.test.ts` (27 pruebas, 27 passed):**
  - Enrutamiento preferente por hardware en webOS.
  - Caché de tipos MIME por ruta Xtream.
  - Sniffing de paquetes TS y manifiestos DASH sin extensión.
- **`src/components/player.test.ts` (161 pruebas, 161 passed):**
  - Tolerancia a paradas (*stall watchdog*).
  - Reconexión controlada en flujos en vivo.
  - Ciclo de vida y persistencia de catch-up Xtream.
  - Controles OSD y DVR.

### 2.2 Servidor HTTP de Pruebas y Streaming Range
- **`src/utils/test-server.test.ts` (14 pruebas, 14 passed):**
  - Análisis de rangos de bytes válidos, abiertos y de sufijo.
  - Respuestas HTTP 206 con `Content-Range` y `Content-Length`.
  - Respuestas HTTP 416 ante rangos fuera de límite.
  - Respuestas HEAD 200 con cuerpo vacío.
  - Prevención de fugas de directorio (path traversal con HTTP 403).

### 2.3 Utilidades y Seguridad
- **`src/utils/url.test.ts` (15 pruebas, 15 passed):**
  - Clasificación de URLs MP4, M4V, TS, FLV, HLS y DASH con tokens y fragmentos.
  - Anonimización de credenciales en `diagnosticStreamUrl`.
- **`src/services/luna-log-hygiene.test.ts` (3 pruebas, 3 passed):**
  - Verificación de no exposición de PIN, claves o datos confidenciales en registros Luna.

---

## 3. Pruebas de Hardware Físico

| Modalidad | Prueba | Estado Actual en M2.2 | Observaciones |
| :--- | :--- | :---: | :--- |
| **Física en TV** | HLS 1080p | **PASS** | Validado físicamente en M2 / M2.1. |
| **Física en TV** | DASH 720p | **PASS** | Validado físicamente en M2 / M2.1. |
| **Física en TV** | Navegación Control Remoto (Flechas/OK/Back) | **PASS** | Validado físicamente en M2 / M2.1. |
| **Física en TV** | Reproducción MP4 Progresivo | **PENDING_HARDWARE_VALIDATION** | Implementación y fixture listas en PC; pendiente despliegue y prueba en TV. |
| **Física en TV** | Verificación Target CDP (`inspectable: false`) | **PENDING_HARDWARE_VALIDATION** | Pendiente verificación en TV tras instalación del nuevo paquete. |

