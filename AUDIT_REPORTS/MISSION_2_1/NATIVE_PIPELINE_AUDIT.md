# AUDITORÍA DEL PIPELINE MULTIMEDIA NATIVO EN webOS — MISIÓN M2.1
**Dispositivo:** LG 65UM7400PDA (SoC Realtek RTD2870 ARMv7l)  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Estado:** AUDITORÍA DEL PIPELINE NATIVO COMPLETADA

---

## 1. Arquitectura del Motor Multimedia en webOS

El proyecto `webos-iptv-player` implementa una arquitectura dual documentada en `docs/native-vs-hls.js.md`:

1. **Entorno de Escritorio / Preview:**  
   Utiliza bibliotecas MSE en JavaScript (`hls.js`, `mpegts.js`, `shaka-player`) para sortear las discrepancias de compatibilidad entre navegadores de escritorio.
2. **Entorno webOS TV (Hardware Real):**  
   Utiliza de forma exclusiva el pipeline nativo HTML5 `<video src>` / `<source>`. En webOS, Chromium 53 (`WebAppMgr`) no procesa los fotogramas en la capa de renderizado web, sino que delega la decodificación y el desentrelazado directamente a los aceleradores de hardware de video del SoC Realtek mediante el demonio de sistema `starfish-media-pipeline` (basado en GStreamer).

### 1.1 Verificación en el Hardware del Televisor
Se confirmó en la tabla de procesos del televisor la presencia activa del pipeline del sistema:
```text
root 3296 0.4 1.1 88576 11440 ? SLl /usr/sbin/starfish-media-pipeline pipeline_process -scom.webos.pipeline._oKifUNbt0anNQf ...
```
* **Evaluación:** El reproductor **no** cargó motores MSE de escritorio en el televisor. Toda la reproducción se canaliza a través de los aceleradores nativos de hardware.

---

## 2. Capacidades y Requisitos de Contenedor MP4 en webOS

### 2.1 Soporte de Códecs
Evaluado mediante `canPlayType()` en Chromium 53 del televisor:
* `video/mp4; codecs="avc1.42E01E, mp4a.40.2"`: `probably` (Totalmente compatible).
* `video/mp4; codecs="hvc1.1.6.L93.B0"` (HEVC): `probably` (Totalmente compatible).

### 2.2 Requisitos Esenciales para Reproducción Progresiva MP4 en webOS
Para que un archivo MP4 se reproduzca satisfactoriamente mediante el pipeline nativo en televisores LG:
1. **Ubicación del Átomo `moov` (FastStart):**  
   En archivos MP4 estándar sin optimizar para web, el metadato del archivo (`moov` atom) suele situarse al final del archivo físico. Un reproductor progresivo requiere que `moov` se ubique **al principio** del archivo (antes de los bloques de video `mdat`), permitiendo a GStreamer comenzar la reproducción instantáneamente sin esperar a descargar el archivo completo.
2. **Soporte de Peticiones HTTP Byte-Range (`206 Partial Content`):**  
   El servidor web debe soportar cabeceras `Range: bytes=X-Y` y responder con `Accept-Ranges: bytes` y código `206`. Si el servidor remoto no soporta rangos, el motor webOS no puede saltar ni precargar buffers eficientemente.
3. **Respuesta HTTP Válida:**  
   El servidor debe entregar código `200 OK` o `206 Partial Content` con cabecera `Content-Type: video/mp4`. Cualquier respuesta de error (`403`, `404`, `500`) provoca el colapso inmediato del elemento `<source>` con error de código 4 (`MEDIA_ERR_SRC_NOT_SUPPORTED`).

---

## 3. Comportamiento en Modo En Vivo vs Modo VOD

* **Modo VOD (`opts?.direct: true`):**  
  En `src/components/player-pipeline.ts` (Línea 261), cuando la reproducción proviene del catálogo VOD de Xtream (Películas/Series), el reproductor invoca `containerMime(url)` y aplica inmediatamente `video/mp4` al `<source>`.
* **Modo En Vivo (`opts?.direct: false`):**  
  En la lista de canales en vivo (`ChannelList`), las URLs se tratan como transmisiones broadcast. Al no existir la extensión `.mp4` en `streamUrlMime`, el reproductor realiza una petición previa de sondeo (`detectContentType`), incrementando la latencia de inicio.

