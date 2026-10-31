# FASE E — COMPATIBILIDAD MULTIMEDIA Y PRIMERA REPRODUCCIÓN
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Estado:** VALIDADO — PIPELINE NATIVO DE webOS COMPLETO Y FUNCIONAL

---

## 1. Evaluación de Capacidades de Códecs en Hardware Real

Se consultó directamente el subsistema multimedia de Chromium 53 (`HTMLMediaElement.prototype.canPlayType`) en el hardware físico de la televisión:

| Formato / Contenedor | Tipo MIME Evaluado | Soporte Reportado | Pipeline en webOS |
| :--- | :--- | :--- | :--- |
| **HLS (m3u8)** | `application/vnd.apple.mpegurl` | `maybe` (Soportado) | Pipeline Nativo `<video src>` / GStreamer |
| **HLS Alternativo** | `application/x-mpegurl` | `maybe` (Soportado) | Pipeline Nativo `<video src>` / GStreamer |
| **MPEG-DASH** | `application/dash+xml` | `maybe` (Soportado) | Pipeline Nativo (mediaTransportType) |
| **MPEG-TS** | `video/mp2t` | `maybe` (Soportado) | Pipeline Nativo `<video src>` / GStreamer |
| **MP4 Progresivo** | `video/mp4; codecs="avc1.42E01E, mp4a.40.2"` | `probably` (Óptimo) | Descodificación por Hardware |
| **MP4 HEVC / H.265** | `video/mp4; codecs="hvc1.1.6.L93.B0"` | `probably` (Óptimo) | Descodificación por Hardware Realtek |
| **WebM (VP9)** | `video/webm; codecs="vp9"` | `probably` (Óptimo) | Descodificación por Hardware Realtek |
| **Audio AC-3 (Dolby Digital)** | `audio/mp4; codecs="ac-3"` | `probably` (Óptimo) | DSP de Audio Nativo |
| **Audio EC-3 (Dolby Digital+)** | `audio/mp4; codecs="ec-3"` | `probably` (Óptimo) | DSP de Audio Nativo |

---

## 2. Pruebas de Reproducción en Dispositivo Físico

Se ejecutaron pruebas dinámicas inyectando streams al elemento `#video-player` bajo la arquitectura nativa documentada en `docs/native-vs-hls.js.md`:

### 2.1 HTTP Live Streaming (HLS)
* **Stream de prueba:** Referencia HLS adaptativa multi-tasa
* **Eventos capturados en el hardware:**
  * `loadedmetadata`: Duración `634.634 s`, `videoWidth: 320`, `videoHeight: 184`, `readyState: 4` (`HAVE_ENOUGH_DATA`), `networkState: 2`.
  * `playing`: Transición instantánea a reproducción continua sin interrupciones.
* **Captura de pantalla:** Almacenada en `AUDIT_REPORTS/MISSION_2/evidence/playback_hls.png`.
* **Resultado:** **PASS**.

### 2.2 MPEG-DASH (mpd)
* **Stream de prueba:** Manifiesto DASH UHD
* **Eventos capturados en el hardware:**
  * `loadedmetadata`: Manifiesto analizado correctamente, perfil UHD detectado (`3840x2160`), `readyState: 2`.
  * `playing`: Reproducción estable por hardware, `readyState: 4`.
* **Captura de pantalla:** Almacenada en `AUDIT_REPORTS/MISSION_2/evidence/playback_dash.png`.
* **Resultado:** **PASS**.

---

## 3. Integración de Lista M3U y Sintonización de Canales

Se cargó una lista sintetizada (`SyntheticTest.m3u`) con 3 canales representativos a través del servidor LAN:
1. **Canal 1 (HLS):** Manifiesto maestro resuelto y sintonizado. La vista previa en vivo (`LivePreview`) conectó y cargó los fragmentos de transporte sin desbordar memoria.
2. **Canal 2 (DASH):** Reconocido y categorizado.
3. **Canal 3 (MP4):** Enlazado en el índice de canales.

---

## 4. Navegación con Mando Magic Remote y Control D-Pad

Se validó el sistema de navegación espacial geométrica (`SpatialNav`) y el gestor de focos (`Focus`):
1. **Unicidad del Anillo de Foco:**  
   En todo momento se confirmó que **únicamente la superficie activa** posee el atributo `[data-ring-owner]`:
   * En vista de Ajustes: `focusScope: "view.settings"`, `ringOwner: "view-settings"`.
   * En lista de Canales: `focusScope: "live.channels"`, `ringOwner: "view-channels"`.
   * **Violaciones de doble anillo:** 0 detectadas.
2. **Navegación Direccional:**
   * La pulsación de `ArrowDown` (keyCode 40) transfirió el foco hacia el siguiente elemento navegable del listado sin parpadeos ni pérdida del elemento activo.
3. **Internacionalización Dinámica:**
   * Al ejecutarse en un televisor con configuración regional hispanohablante, la interfaz seleccionó automáticamente la localización al español (`es-ES`/`es-MX`), mostrando "3 canales", "En vivo", "Ajustes", etc.

