# ESTADO INICIAL Y CONTEXTO DEL DESPLIEGUE — MISIÓN M2.1
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Misión:** M2.1 — Diagnóstico Multimedia en Hardware y Cierre de Validación

---

## 1. Entorno Físico y Hardware Confirmado

* **Modelo:** LG 65UM7400PDA
* **SoC:** Realtek RTD2870 (`rtd287o`), 4 núcleos ARM Cortex-A53 operando en modo 32-bit (ARMv7l).
* **Sistema Operativo:** webOS TV Lite 4.10.2-29 (release `goldilocks2-grampians`), Kernel Linux `4.4.84-p.649.grampians.k5lp.1`.
* **Motor Web:** Chromium 53.0.2785.34 (`WebAppMgr`).
* **Runtime de Servicio:** Node.js v0.12.2 nativo.
* **Mando Empleado por el Usuario:** Mando infrarrojo estándar (genérico), sin Magic Remote (puntero ausente, navegación exclusiva por teclas numéricas, cruceta direccional D-pad y teclas funcionales).

---

## 2. Estado de la Instalación Previa (Misión 2)

El paquete `com.lennylxx.iptv_1.17.0_all.ipk` (`SHA-256: 253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`) se encuentra físicamente desplegado y registrado en el System Application Manager (SAM):
* **Ruta de Aplicación:** `/media/developer/apps/usr/palm/applications/com.lennylxx.iptv/`
* **Ruta del Servicio:** `/media/developer/apps/usr/palm/services/com.lennylxx.iptv.service/`
* **Lista de Reproducción Sintética:** Cargada mediante el servicio LAN en `/uploads/synthetictest.m3u` con 3 canales:
  * Canal 1: HLS Live/VOD Stream (`https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`)
  * Canal 2: DASH Stream (`https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd`)
  * Canal 3: MP4 Stream (`http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`)

---

## 3. Observaciones del Comportamiento Manual Reportado

1. **HLS (Canal 1):**
   * **Comportamiento:** Reproducción real y fluida de flujo H.264 con audio AAC a resolución 1080p nativa.
   * **Estabilidad:** Estable durante varios minutos sin caídas de framerate ni desincronización de audio.
   * **Navegación:** La tecla `Back` (código 461) detuvo la reproducción y regresó de forma inmediata al listado de canales.
2. **DASH (Canal 2):**
   * **Comportamiento:** Reproducción real por hardware a 720p/UHD con desmultiplexación nativa.
   * **Estabilidad:** Estable durante más de 5 minutos continuos.
   * **Navegación:** Retorno con `Back` impecable hacia la interfaz de usuario.
3. **MP4 (Canal 3):**
   * **Comportamiento:** Pantalla en negro momentánea. Posteriormente se desplegó el mensaje en el OSD:  
     *«Error de reproducción — probando el siguiente canal…»*.
   * **Fallback:** La aplicación avanzó automáticamente al siguiente canal disponible (Canal 1, HLS), iniciando su reproducción.
   * **Estado al salir:** Al presionar `Back`, el menú de canales conservó plena operatividad, mostrando el Canal 3 con un punto rojo (`channel-health-dot unavailable`).

---

## 4. Estado de Recursos en el Dispositivo (Post-Prueba)

* **Proceso WAM Renderer (PID 27261):** `55.6 MB` RSS, `0.5%` CPU.
* **Proceso Node.js (PID 27171):** `15.6 MB` RSS, `0.4%` CPU.
* **Uptime de los Procesos:** Más de 50 minutos ininterrumpidos sin reinicios ni abortos.
* **Estabilidad del Kernel:** `0` eventos de Out-Of-Memory (`NO_OOM_EVENTS` en `dmesg`).

