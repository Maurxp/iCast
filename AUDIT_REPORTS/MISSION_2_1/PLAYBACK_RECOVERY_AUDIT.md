# AUDITORÍA DEL SISTEMA DE RECUPERACIÓN Y FALLBACK — MISIÓN M2.1
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Estado:** AUDITORÍA DEL SISTEMA DE RECUPERACIÓN COMPLETADA

---

## 1. Dimensionamiento de Temporizadores y Watchdogs

El comportamiento observado en el televisor está regulado por la configuración de tiempos en [`src/config.ts`](file:///c:/Users/amaur/Desktop/webos-iptv-player/src/config.ts#L65-L85):

| Temporizador / Watchdog | Parámetro en `CONFIG` | Valor Configurado | Función en la Arquitectura |
| :--- | :--- | :--- | :--- |
| **Sondeo de Manifiesto** | `MANIFEST_TIMEOUT` | `5,000 ms` | Límite máximo para la detección HTTP de cabeceras (`fetch`). |
| **Watchdog de Inicio** | `STARTUP_TIMEOUT` | `15,000 ms` | Ventana máxima para recibir el primer fotograma tras cargar. |
| **Sondeo de Bloqueo (Stall)** | `STALL_POLL_MS` | `2,000 ms` | Intervalo de comprobación de `currentTime` en reproducción. |
| **Tolerancia a Congelación** | `STALL_FREEZE_TICKS` | `5 ticks` (~10 s) | Tiempo congelado antes de intentar recarga en el mismo canal. |
| **Intentos de Reconexión** | `DEFAULT_LIVE_RECONNECT_ATTEMPTS` | `3 intentos` | Reintentos antes de avanzar al canal siguiente. |
| **Avance por Error Crítico** | `errorAdvanceTimer` | `2,000 ms` | Pausa para mostrar el mensaje OSD antes de sintonizar el canal siguiente. |

---

## 2. Diferenciación de Errores y Estrategia de Fallback

El reproductor distingue estrictamente entre incidencias transitorias y fallos irrecuperables en [`src/components/player.ts`](file:///c:/Users/amaur/Desktop/webos-iptv-player/src/components/player.ts#L1120-L1155):

1. **Fallo Transitorio de Red (Stall):**  
   Si el flujo se congela pero el formato es soportado, `stallWatchdog` ejecuta hasta 3 reintentos en el mismo canal (`player.reconnecting`), manteniendo la sintonía.
2. **Fallo Fatal / Formato Inválido (`MediaError.code === 4`):**  
   Al recibir `MEDIA_ERR_SRC_NOT_SUPPORTED` (originado por la respuesta 403 con XML de Google Cloud Storage), el reproductor clasifica el evento como `reason = 'unsupported'`:
   * **Cancela los reintentos inútiles:** Omite las 3 reconexiones en bucle.
   * **Detiene el watchdog:** Invoca `this.stallWatchdog.stop()`.
   * **Registra la salud del canal:** Invoca `this.markLiveUnavailable('playback_error')`.
   * **Notifica al usuario:** Presenta en el OSD `t('player.streamError')`:  
     *«Error de reproducción — probando el siguiente canal…»*.
   * **Avanza con seguridad:** Dispara un temporizador de 2 segundos que ejecuta `this.channelUp()`.

---

## 3. Prevención de Bucles Infinitos y Preservación de Estado

* **Prevención de Bucles:** La variable `errorAdvanceTimer !== null` bloquea la recepción de nuevos eventos de error durante la ventana de transición de 2 segundos, evitando llamadas recursivas descontroladas.
* **Preservación del Canal y Menú:**  
  Al fallar el Canal 3 y saltar al Canal 1, el usuario mantiene total control mediante el mando a distancia:
  * Al pulsar `Back`, la tecla es procesada limpiamente por `App.handleAction('back')`.
  * Se invoca `Player.stop()`, que pausa el video, cancela cualquier temporizador pendiente y devuelve el foco a la lista de canales.
  * En la lista de canales, el Canal 3 conserva su posición y muestra el indicador rojo de salud (`channel-health-dot unavailable`), informando visualmente al usuario del fallo sin corromper la lista ni bloquear la interfaz.

