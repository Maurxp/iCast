# MATRIZ DE VALIDACIÓN MULTIMEDIA (MEDIA VALIDATION MATRIX)
## Misión M2.3.1 — webOS IPTV Player v1.17.0
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 2026-10-30 / 2026-10-31  

---

## 1. Definición Formal de Categorías de Validación

Para garantizar un rigor forense inmutable y auditable, los resultados se clasifican estrictamente en categorías disyuntas:

* **PASS (AUTOMATIZADO):** Criterio técnico verificado mediante scripts de inspección CDP/DOM/HTTP sin intervención humana directa (métricas de tiempo, eventos de ciclo de vida del elemento `<video>`, códigos HTTP y estados de red).
* **PASS (OBSERVADO POR EL USUARIO):** Confirmación física sensorial directa por parte del usuario frente a la pantalla física del televisor (imagen real, sonido emitido por los altavoces y pulsación de teclas en el control remoto físico).
* **PASS (OBSERVADO POR GEMINI):** Criterio evaluado por el modelo asistente mediante la correlación de telemetría remota, registros de consola y respuestas de red capturadas en el entorno local.
* **FAIL:** Prueba ejecutada donde el comportamiento observado violó los requisitos funcionales o de estabilidad esperados.
* **BLOCKED:** Prueba que no pudo ejecutarse debido a un impedimento técnico externo o dependencia no resuelta.
* **NOT TESTED:** Escenario o capacidad deliberadamente excluida del alcance de la misión.

---

## 2. Matriz General de Validación Multimedia

| Formato / Función | Evaluación Técnica (Automated CDP/DOM) | Evaluación Física (User Observed) | Evaluación Asistente (Gemini Evaluated) | Dictamen Consolidado |
| :--- | :--- | :--- | :--- | :--- |
| **HLS (H.264/AAC)** | **PASS (AUTOMATIZADO)** | **PASS (OBSERVADO POR EL USUARIO)** | **PASS (OBSERVADO POR GEMINI)** | **PASS** |
| **MPEG-DASH (H.264/AAC)** | **PASS (AUTOMATIZADO)** | **PASS (OBSERVADO POR EL USUARIO)** | **PASS (OBSERVADO POR GEMINI)** | **PASS** |
| **MP4 Progresivo (Range/206)** | **PASS (AUTOMATIZADO)** | **PASS (OBSERVADO POR EL USUARIO)** | **PASS (OBSERVADO POR GEMINI)** | **PASS** |
| **Control Remoto (Genérico IR)** | **PASS (AUTOMATIZADO)** | **PASS (OBSERVADO POR EL USUARIO)** | **PASS (OBSERVADO POR GEMINI)** | **PASS** |
| **Audio (Pitido de prueba)** | **PASS (AUTOMATIZADO)** | **PASS (OBSERVADO POR EL USUARIO)** | **PASS (OBSERVADO POR GEMINI)** | **PASS** |
| **Calidad Musical / Estéreo** | **NOT TESTED** | **NOT TESTED** | **NOT TESTED** | **NOT TESTED** |
| **Sincronización Labial Fina** | **NOT TESTED** | **NOT TESTED** | **NOT TESTED** | **NOT TESTED** |

---

## 3. Desglose Detallado por Formato

### 3.1 HLS — HLS Stream (Canal 1 / `ch:0`)
* **Fuente:** `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
* **MIME Detectado:** `application/vnd.apple.mpegurl`
* **Ruta de Reproducción:** Nativa de webOS (`playback.path.native`)
* **Telemetría Automatizada (CDP):**
  * `readyState`: `4` (`HAVE_ENOUGH_DATA`)
  * `networkState`: `2` (`NETWORK_LOADING`)
  * `currentTime`: Avance registrado de 0,000s a 3,479s y 8,285s de forma continua.
  * `error`: `null`
  * Variantes en manifiesto: 5 variantes detectadas y procesadas.
* **Observación del Usuario:** Imagen de prueba en pantalla, reproducción fluida y retorno limpio con botón Back.

### 3.2 MPEG-DASH — DASH Stream (Canal 2 / `ch:1`)
* **Fuente:** `https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd`
* **MIME Detectado:** `application/dash+xml`
* **Ruta de Reproducción:** Nativa webOS DASH (`playback.path.native.dash`)
* **Telemetría Automatizada (CDP):**
  * Resolución informada: `3840x2160` (4K UHD)
  * `duration`: `634.566` segundos.
  * `readyState`: `4`
  * `currentTime`: Progresión fluida segundo a segundo: 0,95s -> 1,95s -> 2,96s -> 4,16s -> 5,16s -> 6,17s -> 7,16s.
  * `error`: `null`
* **Observación del Usuario:** Imagen en pantalla sin congelamientos, decodificación por hardware estable y respuesta correcta a Back.

### 3.3 MP4 Progresivo — MP4 Stream (Canal 3 / `ch:2`) — *Foco Crítico M2.2*
* **Fuente:** `http://192.168.1.6:8088/synthetic_test.mp4` (Servidor de pruebas local en PC)
* **Archivo:** `synthetic_test.mp4` (10,00 segundos, 992.274 bytes, H.264 Baseline / AAC)
* **Negociación de Red:**
  * Cabeceras solicitadas por el televisor: `Range: bytes=0-100` y subsiguientes.
  * Respuesta emitida por el servidor: `HTTP/1.1 206 Partial Content`.
  * Cabecera `Content-Range`: `bytes 0-100/992274`.
  * Tipo de Contenido: `video/mp4`.
* **Telemetría Automatizada (CDP):**
  * Metadatos: `1280x720`, `duration: 10`.
  * `readyState`: `4`
  * Progresión de tiempo en primera prueba: 0,19s -> 2,20s -> 4,41s -> 6,41s -> 8,42s -> 9,42s -> 10,00s (`paused: true` al fin de stream).
  * Progresión de tiempo en segunda prueba (tras reactivar servidor): 0,77s -> 1,78s -> 3,18s -> 4,19s -> 5,19s -> 6,19s -> 7,20s.
  * Ocurrencia de pantalla negra con salto automático de canal: **0 (Ninguna)**.
  * Ocurrencia de «Error de reproducción»: **0 (Ninguna)**.
* **Observación del Usuario:**
  * Confirmación 1: Observó personalmente la reproducción exitosa del MP4 sintético en el televisor.
  * Confirmación 2: Tras el diagnóstico y reinicio del servidor, confirmó que el vídeo continúa reproduciéndose sin interrupciones ni reconexiones, con sonido estable (pitido) y respuesta al control remoto.

---

## 4. Validación de Control Remoto y Audio

### 4.1 Control Remoto Físico (IR Genérico)
* **Comprobación Automatizada:** Los eventos de teclado con `keyCode: 40` (Down), `keyCode: 13` (Enter/Select) y `keyCode: 461` (Back) son enrutados por `KeyHandler` a los módulos activos (`ChannelList` y `Player`).
* **Comprobación Física del Usuario:** El usuario confirmó que su control remoto genérico físico opera adecuadamente en la navegación, cambia de canal y el botón **Back** devuelve limpiamente la interfaz a la lista de canales.

### 4.2 Canal de Audio
* **Alcance Comprobado:** El usuario confirmó la audición de un **pitido estable y audible**, correspondiente a la pista de audio sintética de 1.000 Hz integrada en el contenedor MP4 de pruebas.
* **Alcance Excluido (NOT TESTED):** No se evaluó fidelidad musical, sonido envolvente 5.1 ni sincronización labial avanzada, ya que el fixture sintético está diseñado para verificación funcional de transporte y decodificación.

