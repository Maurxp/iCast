# Implementación y Soporte de MP4 / M4V — Misión M2.2
## webOS IPTV Player v1.17.0 (LG 65UM7400PDA / webOS 4.10.2)
**Fecha:** 30 de Octubre de 2026  
**Módulos Afectados:** `src/utils/url.ts`, `src/components/player-pipeline.ts`, `src/components/player.ts`  

---

## 1. Detección MIME de Contenedores Progresivos

### 1.1 Extensión de `streamUrlMime`
En versiones anteriores, `streamUrlMime(url)` únicamente identificaba flujos `.ts`, `.flv`, `.m3u8` y `.mpd`, devolviendo cadena vacía para flujos MP4 progresivos. Esto forzaba una sonda HTTP innecesaria y vulnerable a respuestas de error de servidores externos.

Se modificó `src/utils/url.ts` para reconocer de manera canónica las extensiones `.mp4` y `.m4v` tanto en la ruta del archivo como en parámetros query Xtream:
```typescript
export function streamUrlMime(url: string): string {
  if (/\.(?:mp4|m4v)(?:[?#]|$)/i.test(url) ||
      /[?&](?:extension|output|output_format)=(?:mp4|m4v)(?:[&#]|$)/i.test(url)) {
    return 'video/mp4';
  }
  if (/\.ts(?:[?#]|$)/i.test(url) ||
      /[?&](?:extension|output|output_format)=ts(?:[&#]|$)/i.test(url)) {
    return 'video/mp2t';
  }
  // ... flv, m3u8, mpd
  return '';
}
```

### 1.2 Tratamiento de URLs Complejas
La expresión regular implementada evalúa correctamente:
- URLs con query strings: `http://host/stream.mp4?token=abc&user=123` -> `'video/mp4'`.
- URLs con fragmentos de tiempo: `http://host/stream.mp4#t=10,20` -> `'video/mp4'`.
- Nombres con caracteres codificados: `http://host/path/video%20test.m4v` -> `'video/mp4'`.
- Parámetros Xtream: `http://host/play?extension=mp4` y `http://host/play?output_format=m4v` -> `'video/mp4'`.
- Rutas que contienen la subcadena sin extensión (falsos positivos prevenidos): `http://host/mp4/channel` -> `''` (no match).

---

## 2. Enrutamiento en `PlayerPipeline`

### 2.1 Ruta Nativa en webOS (`isWebOS() === true`)
En el televisor LG webOS TV Lite 4, las bibliotecas MSE de escritorio (`hls.js`, `mpegts.js`, `shaka-player`) permanecen completamente inactivas (`isMseActive() === false`).
Al detectarse `urlMime === 'video/mp4'`:
1. Se establece `isMp4Url = true`.
2. Se selecciona la rama nativa directa:
   ```typescript
   if (isTsUrl || isFlvUrl || isHlsUrl || isDashUrl || isMp4Url) {
     const mime = isFlvUrl ? 'video/x-flv'
       : isTsUrl ? 'video/mp2t'
       : isDashUrl ? 'application/dash+xml'
       : isMp4Url ? 'video/mp4'
       : 'application/vnd.apple.mpegurl';
     this.playNativeMime(url, mime);
     return;
   }
   ```
3. `playNativeMime(url, 'video/mp4')` instancia un elemento `<source src="url" type="video/mp4">` dentro del `<video>` HTML5 y ejecuta `videoEl.load()` y `safePlay(videoEl)`.
4. El subsistema Starfish Media Pipeline (GStreamer) en el SoC Realtek RTD2870 toma el control de la demuxing y la decodificación por hardware de video H.264 y audio AAC.

### 2.2 Ruta de Vista Previa en Escritorio (`isWebOS() === false`)
En navegadores de escritorio (Chrome/Firefox/Linux), los contenedores MP4 se reproducen directamente asignando `videoEl.src = url` y ejecutando `safePlay(videoEl)` sin cargar bibliotecas externas.

---

## 3. Tratamiento de Códigos de Error HTTP y Clasificación

### 3.1 Refactorización de `detectContentType`
Se transformó `detectContentType` para devolver un resultado tipificado `ContentTypeResult`:
```typescript
export interface ContentTypeResult {
  ok: boolean;
  contentType: string;
  status?: number;
  errorReason?: PlaybackErrorReason | 'aborted';
}
```

### 3.2 Detección Temprana de Errores de Servidor
Si el servidor remoto devuelve un código de estado HTTP `>= 400` (e.g. 401 Unauthorized, 403 Forbidden, 404 Not Found, 416 Range Not Satisfiable, 500/503 Server Error):
1. Se cancela inmediatamente el cuerpo de la respuesta (`res.body?.cancel()`).
2. Se emite un log de advertencia con la URL debidamente anonimizada:
   `[Player] Content-type HTTP error event=playback.classify.http_error load=1 status=403 url=http://host/stream/extensionless`
3. Se devuelve `{ ok: false, contentType: '', status: res.status, errorReason: 'http_error' }`.
4. El pipeline captura el error antes de asignarlo al elemento `<video>`, emitiendo `this.callbacks.onError('http_error')`.
5. Se previene que un documento XML o HTML de error (como el recibido en M2.1 de GCS) sea interpretado como un archivo multimedia o provoque cuelgues en el decodificador de hardware.

---

## 4. Control de Concurrencia y Cancelación por Cambio de Canal

- Se añadió `private classifyController: AbortController | null` a `PlayerPipeline`.
- Al invocarse `load()` o `destroy()` con un nuevo `loadToken`, se invoca `this.cancelClassify()`, abortando cualquier sondeo en vuelo.
- En `detectContentType`, si la promesa es rechazada por `AbortError` debido a un cambio de canal (`loadToken !== this.loadToken`), se clasifica como `'aborted'`, emitiendo `event=playback.classify.cancelled` y **omitiendo la propagación de errores espurios**.

