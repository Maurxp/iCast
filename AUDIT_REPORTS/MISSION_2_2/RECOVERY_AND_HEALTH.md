# Recuperación Automática y Salud del Canal
## Misión M2.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Módulos Auditados:** `src/components/player.ts`, `src/services/channel-health.ts`  

---

## 1. Detección y Clasificación de Fallos

Se introdujo el tipo unificado `PlaybackErrorReason`:
```typescript
export type PlaybackErrorReason =
  | 'unsupported'
  | 'http_error'
  | 'network'
  | 'decode'
  | 'timeout';
```

### 1.1 Mapeo de Eventos `error` del Elemento Multimedia
En `Player.bindVideoEvents`:
- **Código 1 (`MEDIA_ERR_ABORTED`):** Representa cancelación intencionada provocada por cambio de canal o detención del usuario. Se registra en log informativo y **no** se propaga como error ni degrada la salud del canal.
- **Código 2 (`MEDIA_ERR_NETWORK`):** Clasificado como `'network'`.
- **Código 3 (`MEDIA_ERR_DECODE`):** Clasificado como `'decode'`.
- **Código 4 (`MEDIA_ERR_SRC_NOT_SUPPORTED`):** Clasificado como `'unsupported'`.

---

## 2. Política de Reintento y Mitigación de Bucles

En `Player.onError(reason)`:
1. **Errores Permanentes (`'unsupported'`, `'http_error'`, `'decode'`):**
   - Se omite deliberadamente la reconexión ciega (`reconnecting`).
   - Se cancela el watchdog de paradas (`stallWatchdog.stop()`).
   - Se registra el fallo en `ChannelHealthService.recordPlaybackFailure(channel, reason)`.
   - Se muestra en el OSD el mensaje informativo: *"Error de reproducción — probando el siguiente canal…"*.
   - Se inicia un temporizador de avance de 2.000 ms que ejecuta `this.channelUp()`, pasando al siguiente canal sin intervención del usuario.
2. **Errores Transitorios (`'network'` / paradas de búfer):**
   - Se pausa el watchdog y se muestra el mensaje de reconexión (*"Reconectando..."*).
   - Se permite un intento de recuperación mediante `recoverFromError()`. Si el intento falla, se marca el canal no disponible y se avanza.

---

## 3. Estado de Salud y Semáforo Visual del Canal

En `ChannelHealthService`:
- Al registrar un fallo (`recordPlaybackFailure`):
  - El estado del canal pasa inmediatamente a `'unavailable'`.
  - Se incrementa el contador de fallos consecutivos (`consecutiveFailures >= 1`).
  - Se guarda el motivo exacto del fallo (`error`: `'http_error'`, `'playback_error'`, etc.) en el caché de IndexedDB.
- En la interfaz de canales y guía:
  - Los canales con estado `'unavailable'` renderizan un punto indicador rojo:
    ```html
    <span class="channel-health-status channel-health-dot unavailable" title="No disponible" aria-label="No disponible"></span>
    ```
  - Si el canal se reproduce con éxito posteriormente, `recordPlaybackSuccess` restaura el estado y remueve el indicador rojo.

