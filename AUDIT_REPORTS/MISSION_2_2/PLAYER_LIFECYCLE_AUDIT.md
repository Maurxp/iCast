# Auditoría del Ciclo de Vida del Reproductor y Gestión de Recursos
## Misión M2.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Módulos Auditados:** `src/components/player.ts`, `src/components/player-pipeline.ts`  

---

## 1. Ciclo de Vida Completo

El ciclo de ejecución del reproductor multimedia cubre siete etapas coordinadas:
```text
[Selección de Canal]
        │
        ▼
[Inicialización / Pipeline] ────► [Reutilización de Elemento Video / recreateVideoEl]
        │
        ▼
[Arranque de Stream] ───────────► [Carga Nativa / MSE Desktop]
        │
        ├───────────────────────► [Reproducción Normal / loadedmetadata / playing]
        │
        ▼ (ante fallo)
[Clasificación de Error] ───────► [HTTP Error / Decode / Network / Unsupported]
        │
        ▼
[Recuperación Automática] ──────► [Debounce 2000ms / Mensaje OSD / channelUp()]
        │
        ▼
[Retorno a Guía (Back)] ────────► [Detención / Cancelación de Controladores / Liberación]
```

---

## 2. Gestión de Recursos y Prevención de Fugas de Memoria

### 2.1 Reutilización Segura del Elemento `<video>`
- En webOS, la acumulación de elementos multimedia o la falta de desconexión de flujos GStreamer provoca fugas de descriptores de hardware y agotamiento del búfer del decodificador RTD2870.
- `Player.recreateVideoEl()` sustituye el elemento en el DOM preservando propiedades (`muted`, `volume`, `playbackRate`).
- Se auditó y corrigió el reemplazo en el DOM para verificar la existencia de `old.parentNode` antes de invocar `replaceChild(fresh, old)`, evitando errores no controlados si el elemento aún no había sido montado.

### 2.2 Cancelación Activa de Controladores AbortController
- Cada ciclo de carga de manifiesto o sondeo de Content-Type instancia un `AbortController` local asociado a `loadToken`.
- Al cambiar de canal o detener la reproducción, `cancelManifest()` y `cancelClassify()` invocan `controller.abort()`, cerrando sockets TCP y liberando búferes de recepción inmediatamente.

### 2.3 Manejo Seguro de Promesas de Reproducción (`safePlay`)
- En motores web antiguos (Chromium 53 en webOS 4) y en entornos de prueba emulados (JSDOM), `HTMLMediaElement.prototype.play()` puede devolver `undefined` o lanzar excepciones sincrónicas si el usuario no ha interactuado con la interfaz.
- Se implementó la función envolvente `safePlay(videoEl, onReject)` en `src/components/player-pipeline.ts`, asegurando que `play()?.catch` se verifique antes de suscribir callbacks de rechazo.

---

## 3. Comportamiento ante la Tecla Back y Detención

Al presionar la tecla *Back*:
1. `Player.stop()` detiene el temporizador de avance por error (`errorAdvanceTimer = null`).
2. Se detiene el monitor de paradas (`stallWatchdog.stop()`).
3. Se liberan los controladores de reproducción diferida y DRM (`playReadyDrm.release()`).
4. Se invoca `pipeline.destroy()`, incrementando `loadToken` para invalidar cualquier callback en vuelo y destruyendo los cargadores de streaming.
5. El elemento `<video>` remueve el atributo `src` y limpia los hijos `<source>`, retornando al menú de canales con cero consumo residual de CPU/red en el televisor.

