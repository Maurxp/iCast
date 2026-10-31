# Fixture MP4 Reproducible y Servidor HTTP de Pruebas
## Misión M2.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Archivos:** `scripts/fixtures/synthetic_test.mp4`, `scripts/test-server.ts`, `src/utils/test-server.test.ts`  

---

## 1. Generación de la Fixture MP4 Controlada

Para eliminar la dependencia del enlace obsoleto de Google Cloud Storage (`BigBuckBunny.mp4`) que devolvía HTTP 403 Forbidden, se generó un contenedor MP4 sintético, determinista y conforme con todas las especificaciones de hardware de webOS TV Lite 4.

### 1.1 Herramienta y Entorno
- **Software:** FFmpeg v9.0.1 (compilación estática x86_64 con `libx264` y `aac`).
- **Comando Ejecutado:**
  ```bash
  ffmpeg -y \
    -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
    -f lavfi -i sine=frequency=1000:duration=10 \
    -c:v libx264 -profile:v main -level:v 3.1 -pix_fmt yuv420p -b:v 1500k \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    scripts/fixtures/synthetic_test.mp4
  ```

### 1.2 Parámetros Técnicos Verificados (FFprobe)
- **Contenedor:** ISO-BMFF (MP4 v2 / `isom` / `avc1`).
- **Flujo de Video:**
  - Códec: H.264 / AVC (MPEG-4 AVC part 10).
  - Perfil: Main Profile, Level 3.1.
  - Dimensiones: 1280 × 720 (progresivo).
  - Tasa de cuadros: 30.00 fps.
  - Submuestreo de croma: YUV 4:2:0 planar.
  - Bitrate medio: ~656 kb/s.
- **Flujo de Audio:**
  - Códec: AAC-LC (`mp4a.40.2`).
  - Frecuencia de muestreo: 44.100 Hz.
  - Canales: 1 (mono).
  - Bitrate medio: ~127 kb/s.
- **Duración:** Exactamente 10.000000 segundos.
- **Tamaño del Archivo:** 992.274 bytes.
- **Estructura de Átomos (FastStart):**
  - Offset 0 (32 bytes): Átomo `ftyp`.
  - Offset 32 (12.229 bytes): Átomo `moov` (metadatos e índices al inicio).
  - Offset 12.261 (979.998 bytes): Átomo `mdat` (muestras de video y audio).
  - *Conclusión:* Permite arranque instantáneo sin necesidad de descargar el archivo completo antes de iniciar la reproducción en el televisor.

---

## 2. Servidor HTTP de Pruebas (`scripts/test-server.ts`)

Se diseñó e implementó un servidor HTTP especializado en Node.js para servir la fixture y pruebas en red local con soporte completo de streaming progresivo.

### 2.1 Características Principales
1. **Soporte de Cabeceras Range (`Range: bytes=`):**
   - Responde con **HTTP 206 Partial Content**.
   - Incluye cabecera **`Content-Range: bytes START-END/TOTAL`**.
   - Incluye cabecera **`Accept-Ranges: bytes`**.
   - Asigna **`Content-Length: END - START + 1`**.
   - Transmite el rango solicitado mediante `fs.createReadStream(path, { start, end })`.
2. **Tratamiento de Rangos Fuera de Límite:**
   - Si `start >= fileSize`, responde con **HTTP 416 Requested Range Not Satisfiable** y `Content-Range: bytes */TOTAL`.
3. **Soporte de Solicitudes HEAD:**
   - Devuelve `Content-Type: video/mp4`, `Content-Length` total y `Accept-Ranges: bytes` sin cuerpo de respuesta, permitiendo la clasificación inmediata por sondas del reproductor.
4. **Protección Anti-Path Traversal:**
   - Inspecciona la ruta decodificada y rechaza cualquier intento de escape de directorio (`..` o `%2e%2e`) devolviendo **HTTP 403 Forbidden**.
5. **Detección Automática de IP LAN:**
   - Mediante `getLanIp()`, escanea las interfaces de red del sistema y selecciona la dirección IPv4 local (e.g. `192.168.1.6`), generando automáticamente los endpoints accesibles desde el televisor físico (`http://192.168.1.6:8088/synthetic_test.mp4`).

---

## 3. Verificación Automatizada

El servidor HTTP y el analizador de rangos cuentan con una suite unitaria completa en `src/utils/test-server.test.ts` con 14 pruebas automatizadas (todas exitosas):
- Solicitudes completas GET 200 OK.
- Rangos explícitos (0-99) con respuesta 206.
- Rangos de sufijo (-50) con respuesta 206.
- Solicitudes fuera de rango (416 Range Not Satisfiable).
- Solicitudes HEAD 200 con cuerpo vacío.
- Bloqueo de path traversal con 403.
- Archivos inexistentes con 404.

