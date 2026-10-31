# RECOMENDACIONES TÉCNICAS Y PROPUESTAS DE MEJORA — MISIÓN M2.1
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Alcance:** Propuestas de ingeniería para la siguiente iteración de código (sin cambios en M2.1)

---

## 1. Prioridad 1 (Alta) — Incorporación de Detección Rápida de `.mp4` en Listas en Vivo

### Problema Identificado
En [`src/utils/url.ts`](file:///c:/Users/amaur/Desktop/webos-iptv-player/src/utils/url.ts#L43-L58), la función `streamUrlMime` omite las extensiones `.mp4` y `.m4v`. Cualquier canal de una lista M3U con enlace MP4 se ve obligado a ejecutar una petición `fetch()` previa mediante `detectContentType`, añadiendo latencia de red y dependencia de cabeceras remotas.

### Solución Propuesta
1. **Actualizar `streamUrlMime` en `src/utils/url.ts`:**
   ```typescript
   export function streamUrlMime(url: string): string {
     if (/\.(?:mp4|m4v)(?:[?#]|$)/i.test(url) ||
         /[?&](?:extension|output|output_format)=mp4(?:[&#]|$)/i.test(url)) {
       return 'video/mp4';
     }
     // ... comprobaciones existentes (.ts, .flv, .m3u8, .mpd)
   }
   ```
2. **Actualizar `loadSource` en `src/components/player-pipeline.ts`:**
   Incluir `isMp4Url` en la condición de reproducción nativa inmediata:
   ```typescript
   const isMp4Url = urlMime === 'video/mp4';
   if (isTsUrl || isFlvUrl || isHlsUrl || isDashUrl || isMp4Url) {
     const mime = isFlvUrl ? 'video/x-flv'
       : isTsUrl ? 'video/mp2t'
       : isDashUrl ? 'application/dash+xml'
       : isMp4Url ? 'video/mp4'
       : 'application/vnd.apple.mpegurl';
     // ...
     this.playNativeMime(url, mime);
     return;
   }
   ```

---

## 2. Prioridad 2 (Alta) — Blindaje del Puerto CDP en Paquetes de Producción

### Problema Identificado
Las aplicaciones instaladas en `/media/developer/apps/` heredan de webOS el estado `"inspectable": true` por defecto si no se especifica lo contrario, exponiendo el puerto de depuración TCP 9998 a toda la red local.

### Solución Propuesta
1. **Configurar `"inspectable": false` en `appinfo.json`:**
   Asegurar que el manifiesto base desactive la depuración remota para despliegues de producción.
2. **Parametrización en `esbuild.config.mjs`:**
   Condicionar el atributo `inspectable` a una variable de entorno de desarrollo (e.g. `process.env.DEBUG === '1'`), garantizando que los paquetes IPK de producción nunca expongan la consola CDP.

---

## 3. Prioridad 3 (Media) — Aborto Temprano ante Errores HTTP en `detectContentType`

### Problema Identificado
En [`src/components/player-pipeline.ts`](file:///c:/Users/amaur/Desktop/webos-iptv-player/src/components/player-pipeline.ts#L330-L365), cuando la petición `fetch(url)` recibe una respuesta de error HTTP (como el `HTTP 403` observado en el bucket GCS), el pipeline continúa extrayendo el `Content-Type: application/xml` y asigna la URL al elemento `<source>` con `mime=""`.

### Solución Propuesta
Verificar `res.ok` tras el fetch preliminar:
```typescript
const res = await fetch(url, { signal: controller.signal });
if (!res.ok) {
  log.warn('Content probe failed with HTTP error', 'event=playback.probe.http_error',
    `status=${res.status}`);
  // Señalizar error inmediatamente sin esperar a que <video> intente la descarga
  return '';
}
```

---

## 4. Prioridad 4 (Baja) — Actualización de URLs en Fixtures Sintéticas

### Problema Identificado
El enlace de prueba de Google Cloud Storage (`http://commondatastorage.googleapis.com/.../BigBuckBunny.mp4`) fue revocado o restringido por el proveedor.

### Solución Propuesta
Reemplazar la URL en `scripts/synthetic_test.m3u` por un recurso MP4 abierto, accesible con cabeceras `206 Partial Content` y optimizado con FastStart (`moov` al inicio), o alojar un archivo estático de prueba en el propio servidor LAN del televisor.

