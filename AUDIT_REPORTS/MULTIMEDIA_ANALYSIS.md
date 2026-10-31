# AUDITORÍA DETALLADA DEL MOTOR MULTIMEDIA
## Análisis de Protocolos, Formatos, Códecs, DRM e Integración en LG webOS 4

---

## 1. ARQUITECTURA DE REPRODUCCIÓN MULTIMEDIA

El proyecto `webos-iptv-player` implementa una división arquitectónica tajante entre el entorno de desarrollo de escritorio y el entorno de televisión webOS:

```
+-------------------------------------------------------------------------------+
|                                PLAYER PIPELINE                                |
+---------------------------------------+---------------------------------------+
|          ENTORNO DESCRITORIO          |            ENTORNO webOS TV           |
|            (Vista Previa)             |            (Dispositivo Real)         |
+---------------------------------------+---------------------------------------+
| - HLS: hls.js (MSE / Web Worker)      | - HLS: NATIVO (<video src=*.m3u8>)     |
| - MPEG-TS / FLV: mpegts.js (MSE)      | - TS/FLV: NATIVO (<video><source>)    |
| - DASH: Shaka Player (MSE)            | - DASH Clear/PlayReady: NATIVO        |
| - VOD Progresivo: Directo HTML5       | - DASH Widevine: Shaka Player (ES5)   |
|                                       | - VOD Progresivo: NATIVO (<video>)    |
+---------------------------------------+---------------------------------------+
```

### 1.1. Comparativa: `<video src>` Nativo vs `hls.js` (MSE) en webOS
El archivo técnico `docs/native-vs-hls.js.md` documenta por qué el reproductor se mantiene en modo nativo en el televisor:
1. **Rendimiento de CPU ARM:**
   * En `<video src>`, la demultiplexación de paquetes MPEG-TS y la sincronización se realiza dentro del proceso en C++ `starfish-media-pipeline` y el kernel, con un consumo de CPU general de apenas el **~10%**.
   * En `hls.js`, la demultiplexación de TS y remultiplexación a fragmentos fMP4 se ejecuta en JavaScript en el hilo de Worker/UI de Blink, elevando el consumo de CPU al 15-25% y aumentando el tamaño del heap de JS de 2.9 MB a 26 MB, con riesgo severo de saturación en canales 1080p60 o 4K.
2. **Capacidad 4K y HDR:**
   * La canalización nativa tiene acceso directo al plano de hardware de pantalla completa (`dvovideosink`), decodificando **4K HEVC a 60 fps**, **HDR10**, **HLG** y **Dolby Vision Profile 5**.
   * Bajo `hls.js` y MSE, la API `MediaCapabilities.decodingInfo()` del televisor reporta que los perfiles 4K Dolby Vision y altos bitrates no son soportados por el compositor web (`supported: false`), degradando automáticamente la resolución o abortando la reproducción.

---

## 2. MATRIZ DE PROTOCOLOS, FORMATOS Y CONTENEDORES

| Protocolo / Contenedor | Soporte Contenedor | Soporte Transporte | Motor de Reproducción | Capacidad Efectiva de Hardware | Diagnóstico / Observaciones |
|---|---|---|---|---|---|
| **HLS (HTTP Live Streaming)** | Total (`.m3u8`, TS, fMP4/CMAF) | HTTP / HTTPS (GET por segmentos) | **Nativo webOS** (`starfish-media-pipeline` / `hlsdemux`) | **Plena (Hardware)** | Soporte total para listas m3u8 maestro/variantes, sliding window, catch-up y audio alternativo. |
| **MPEG-TS Puro** | Total (`.ts`) | HTTP / HTTPS (stream continuo) | **Nativo webOS** (`<source type="video/mp2t">`) | **Plena (Hardware)** | Canales IPTV directos en formato `.ts` se reproducen mediante demuxer hardware de Realtek. |
| **MPEG-DASH** | Total (`.mpd`, SegmentTemplate, SegmentTimeline) | HTTP / HTTPS (GET por segmentos) | **Nativo webOS** (`mediaOption`) / **Shaka** (DRM Widevine) | **Plena (Hardware)** | DASH libre y PlayReady operan vía GStreamer nativo; Widevine delega en Shaka Player. |
| **MP4 / M4V Progresivo** | Total (`.mp4`, `.m4v`) | HTTP / HTTPS (con soporte Byte-Range) | **Nativo webOS** (`<source type="video/mp4">`) | **Plena (Hardware)** | Reproducción de películas y series VOD con búsqueda rápida y reanudación. |
| **MKV (Matroska)** | Total (`.mkv`) | HTTP / HTTPS (con soporte Byte-Range) | **Nativo webOS** (`<source>` sin tipo forzado) | **Plena (Hardware)** | El contenedor MKV es soportado nativamente por el pipeline de LG. **Limitación:** Los subtítulos embebidos en el MKV no se exponen al navegador; se requieren subtítulos externos SRT/VTT. |
| **FLV (Flash Video)** | Parcial (`.flv`) | HTTP / HTTPS | **Nativo webOS** (`<source type="video/x-flv">`) | **Parcial (omxflv1dec)** | En desktop usa `mpegts.js`. En TV webOS existe el elemento OMX `omxflv1dec`, pero no es común en IPTV moderno. |
| **RTMP** | Nulo | RTMP / RTMPE | **No soportado** | **No disponible** | Ni Chromium ni el navegador nativo soportan conexiones RTMP sin un proxy/servidor intermedio de transmutación. |
| **WebM** | Total (`.webm`) | HTTP / HTTPS | **Nativo webOS** | **Plena (VP8 / VP9)** | Compatible con flujos WebM con vídeo VP8/VP9 y audio Vorbis/Opus. |
| **UDP / RTP Multicast** | Nulo (desde app web) | UDP / Multicast | **No soportado directamente** | **Requiere udpxy** | Las aplicaciones web en webOS no tienen sockets UDP raw. Requiere un router con `udpxy` para convertir UDP a HTTP unicast. |

---

## 3. AUDITORÍA DE CÓDECS DE VÍDEO Y AUDIO

### 3.1. Códecs de Vídeo

| Códec | Estándar / CuatroCC | Decodificador en TV | Resolución / Perfiles Máximos | Estado en LG 65UM7400PDA |
|---|---|---|---|---|
| **H.264 / AVC** | `avc1`, `h264` | `omxh264dec` (Hardware OMX) | Hasta 4K @ 30 fps o 1080p @ 60 fps. Baseline, Main, High (L5.1). | **Totalmente Compatible** |
| **H.265 / HEVC** | `hvc1`, `hev1` | `omxh265dec` (Hardware OMX) | Hasta 4K (3840x2160) @ 60 fps. Main, Main10, SDR, HDR10, HLG. | **Totalmente Compatible** |
| **VP9** | `vp09` | `omxvp9dec` (Hardware OMX) | Hasta 4K @ 60 fps. Profile 0 (8-bit) y Profile 2 (10-bit HDR). | **Totalmente Compatible** |
| **VP8** | `vp08` | `omxvp8dec` (Hardware OMX) | Hasta 1080p @ 60 fps. | **Totalmente Compatible** |
| **MPEG-2 Video** | `mp2v`, `mpgv` | `omxmpegvideodec` (Hardware OMX) | Hasta 1080p @ 60 fps (Main Profile @ High Level). | **Totalmente Compatible** |
| **VC-1 / WMV** | `vc-1`, `wmv3` | `omxvc1dec` (Hardware OMX) | Advanced Profile @ Level 3 (1080p). | **Totalmente Compatible** |
| **AV1** | `av01` | **No existe** (Sin soporte hardware) | No soportado. | **Incompatible en Hardware** |

### 3.2. Códecs de Audio

| Códec | Formato / Canales | Decodificador en TV | Salida / Passthrough | Estado en LG 65UM7400PDA |
|---|---|---|---|---|
| **AAC (LC / HE-AAC)** | Estéreo y 5.1 | `omxaacdec` / `avdec_aac` | Decodificación a PCM estéreo / 5.1 | **Totalmente Compatible** |
| **MP3 (MPEG Audio L3)** | Estéreo | `omxmp3dec` / `avdec_mp3` | Decodificación PCM | **Totalmente Compatible** |
| **AC3 (Dolby Digital)** | 5.1 canales | `omxac3dec` / `avdec_ac3` | Passthrough HDMI ARC / Óptico o downmix | **Totalmente Compatible** |
| **E-AC3 (Dolby Digital+)** | Hasta 7.1 canales | `omxac3dec` / `avdec_eac3` | Decodificación nativa / Passthrough eARC/ARC | **Totalmente Compatible** |
| **Dolby AC-4** | Próxima generación | `omxac4dec` (Hardware OMX) | Decodificación nativa | **Totalmente Compatible** |
| **DTS / DTS-HD** | 5.1 canales | `omxdtsdec` / `avdec_dca` | Passthrough o PCM multicanal | **Totalmente Compatible** (LG 2019 soporta DTS) |
| **Opus** | Multicanal | `omxopusdec` | Decodificación PCM | **Totalmente Compatible** |

---

## 4. GESTIÓN DE DRM (DIGITAL RIGHTS MANAGEMENT)

1. **PlayReady:**
   * Soporte nativo a través de la interfaz webOS `luna://com.webos.service.drm`.
   * El cliente `src/services/playready-drm.ts` adquiere un `clientId`, envía el mensaje initiator con la URL del servidor de licencias (`LA_URL`) y cualquier `CustomData`, y luego inyecta el `clientId` en el `mediaOption` del elemento `<source>`.
   * **Resultado:** Decodificación acelerada por hardware bajo Secure Video Path (`SVP_CPB qty=2`).
2. **Widevine Modular:**
   * Soportado vía **Shaka Player** mediante la API estándar de la W3C `requestMediaKeySystemAccess('com.widevine.alpha', ...)`.
   * **Limitación webOS 4:** Utiliza la especificación EME borrador 2015. Requiere empaquetado `cenc`; streams modernos con cifrado `cbcs` pueden fallar en webOS 4 (Shaka asume `cbcs` solo en webOS 6+).
3. **ClearKey:**
   * Soporte básico a través de Shaka Player.

---

## 5. ESTABILIDAD Y MECANISMOS DE RESILIENCIA EN REPRODUCCIÓN

### 5.1. Manejo de Errores y Timeouts de Inicio
* **`StartupWatchdog` (`src/utils/startup-watchdog.ts`):** Supervisa el inicio de la reproducción desde la invocación de `load()` hasta el evento `playing`. Si el flujo no arranca en el tiempo límite configurado (`CONFIG.PLAYER.STARTUP_TIMEOUT_MS`, por defecto 10-15s), aborta la canalización y dispara una reconexión controlada.
* **`StallWatchdog` (`src/utils/stall-watchdog.ts`):** Detecta congelamiento de reproducción (cuando el `currentTime` del vídeo se detiene sin que el reproductor esté en estado pausado o buffereando legítimamente). Tras 3 segundos de congelamiento no reactivo, activa la recuperación automática del stream.

### 5.2. Zapping Rápido entre Canales
* Para evitar fugas de memoria o colisiones de decodificadores hardware en cambios rápidos de canal (zapping), `PlayerPipeline` utiliza un **contador monotónico `loadToken`**:
  * Cualquier respuesta asíncrona (como la resolución de tipo MIME o el fetch de un manifiesto) compara su token con `this.loadToken`. Si el usuario ya cambió de canal, la respuesta anterior se descarta inmediatamente.
  * Antes de inyectar el nuevo `<source>`, el reproductor remueve el atributo `src`, limpia `videoEl.innerHTML = ''` y fuerza `videoEl.load()` para liberar el pipeline anterior en `umediaserver`.

### 5.3. Reanudación de VOD (Resume Playback)
* Guarda automáticamente la posición de reproducción cada 5 segundos en `IndexedDB` (`playback-progress`).
* Al reproducir una película o episodio, si la posición guardada es superior a 15 segundos y menor al 95% de la duración total, presenta un diálogo modal para reanudar o reiniciar desde el principio.

