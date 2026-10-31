# MATRIZ DE RESULTADOS DE PRUEBAS — MISIÓN M2.1
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Estado:** REPORTE DE PRUEBAS CONSOLIDADO

---

## 1. Pruebas Automatizadas en Entorno PC

| Suite de Pruebas | Herramienta | Pruebas Ejecutadas | Resultado | Observaciones |
| :--- | :--- | :--- | :---: | :--- |
| **Comprobación de Tipos** | `tsc --noEmit` (Strict) | Todo el codebase | **PASS** | Cero errores de TypeScript. |
| **Linter JavaScript** | `eslint src/` | Todo el frontend | **PASS** | Cumplimiento del gate de compatibilidad Chromium 53. |
| **Linter Hojas de Estilo** | `stylelint css/**/*.css` | Todo el CSS | **PASS** | Sin selectores modernos mezclados con reglas legacy. |
| **Pruebas Unitarias Globales** | `vitest run` | 153 suites / 3,514 tests | **PASS** | 3,514 exitosas, 5 omitidas (Node vs Browser), 0 fallos. |
| **Pruebas de Reproductor** | `player.test.ts` | 157 pruebas | **PASS** | Verificación de ciclos de fallback, OSD y temporizadores. |
| **Pruebas de Pipeline** | `player-pipeline.test.ts` | 38 pruebas | **PASS** | Rutas de desmultiplexación, detección MIME y carga nativa. |
| **Pruebas de Servicio Luna** | `service.test.ts` | 14 pruebas | **PASS** | Verificación unitaria de la política fail-closed. |
| **Pruebas de Servidor LAN** | `server.test.ts` | 16 pruebas | **PASS** | Verificación de límite de tasa anti-fuerza bruta (429). |

---

## 2. Pruebas Dinámicas en Hardware Real (LG 65UM7400PDA)

| Característica / Prueba | Metodología | Resultado | Diagnóstico en Hardware |
| :--- | :--- | :---: | :--- |
| **Reproducción HLS** | Manual (Mando IR) | **PASS** | Estable en 1080p, descodificación nativa, `Back` funcional. |
| **Reproducción DASH** | Manual (Mando IR) | **PASS** | Estable en 720p/4K, descodificación nativa, `Back` funcional. |
| **Reproducción MP4** | Manual (Mando IR) | **FALLO CONTROLADO** | Causa: `HTTP 403 Forbidden` en servidor de origen (GCS). |
| **Recuperación / Fallback** | En Hardware | **PASS** | Mensaje en OSD a los 2 s, salto automático a HLS, punto rojo en menú. |
| **Navegación Mando IR** | Mando Genérico | **PASS** | Navegación precisa por D-pad, anillo de foco único respetado. |
| **Seguridad Bus Luna** | SSH (`luna-send`) | **PASS** | Rechazo 100% fail-closed a llamadas anónimas y falsas (`Unauthorized`). |
| **Seguridad Red LAN** | HTTP desde PC | **PASS** | Endpoint `/info` protegido (403), limitador de fuerza bruta activo (429). |
| **Huella de Memoria** | Linux (`ps` / `meminfo`) | **PASS** | `75.6 MB` RSS total (< 8% de RAM), `0` eventos OOM en `dmesg`. |

---

## 3. Pruebas Pendientes y Resultados Inferidos

### 3.1 Pruebas Pendientes (Requieren Autorización)
* **Reproducción de MP4 Progresivo Válido en Hardware:**  
  *Estado:* PENDIENTE. Requiere alojar o enlazar un clip MP4 con átomo `moov` al inicio (FastStart) y servidor HTTP que devuelva `200 OK` con cabeceras `Accept-Ranges: bytes`.
* **Prueba de Resistencia Prolongada (Soak Test):**  
  *Estado:* PENDIENTE. Reproducción ininterrumpida de HLS durante más de 4 horas para evaluar degradación a largo plazo.

### 3.2 Resultados Inferidos (Fundamentados Técnicamente)
* Se infiere con alto grado de certidumbre técnica que, una vez que el servidor remoto entregue un flujo MP4 válido con FastStart y se incorpore la extensión `.mp4` en la detección rápida de `streamUrlMime`, el pipeline nativo de webOS reproducirá el archivo con la misma estabilidad observada en HLS y DASH, ya que `canPlayType` confirmó compatibilidad total (`probably`) con AVC/H.264 y AAC.

