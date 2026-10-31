# Especificación de Seguridad del Servidor de Pruebas (`scripts/test-server.ts`)
## Misión M2.2.1 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Módulo Evaluado:** `scripts/test-server.ts` y `src/utils/test-server.test.ts`  
**Estado:** Endurecido y Validado (Pruebas unitarias 20/20 aprobadas)  

---

## 1. Justificación y Alcance del Módulo

El script `scripts/test-server.ts` es una utilidad auxiliar para emitir fixtures multimedia locales (vídeos sintéticos MP4 y listas de reproducción M3U) de forma controlada hacia reproductores locales o dispositivos en la red de pruebas. No forma parte del paquete de producción IPK instalado en el televisor, pero al ser ejecutado en el PC del operador, debe cumplir con rigurosos estándares de seguridad defensiva para evitar accesos no autorizados a archivos del sistema operativo o apertura indiscriminada de servicios en la red local.

---

## 2. Medidas de Seguridad Implementadas

### 2.1 Restricción de Enlace de Red (Binding Específico)
- **Eliminación del binding `0.0.0.0`:** En versiones previas, el servidor escuchaba por defecto en todas las interfaces de red (`0.0.0.0`), exponiendo los recursos a cualquier equipo conectado al segmento de red.
- **Enlace estricto a Loopback (`127.0.0.1`) por defecto:** Sin parámetros adicionales, el servidor solo escucha peticiones originadas en la propia máquina local.
- **Control granular de interfaz vía CLI (`parseServerCliArgs`):**
  - `--host <ip>`: Permite al operador especificar de forma explícita la dirección IP de la interfaz deseada (por ejemplo, `192.168.1.100`).
  - `--port <number>`: Permite definir el puerto TCP de escucha (por defecto `8088`).
  - `--lan`: Detecta automáticamente la interfaz física IPv4 no interna del equipo (por ejemplo, `192.168.1.x`) y se vincula exclusivamente a esa dirección, rechazando `0.0.0.0`.
  - También admite variables de entorno `TEST_SERVER_HOST` y `TEST_SERVER_PORT`.

### 2.2 Lista Blanca Estricta de Archivos Servibles (`ALLOWED_FIXTURE_FILES`)
- **Lista blanca inmutable en memoria:**
  ```typescript
  export const ALLOWED_FIXTURE_FILES = new Set([
    'synthetic_test.mp4',
    'synthetic_test.m3u',
  ]);
  ```
- **Rechazo estricto:** Cualquier solicitud cuyo nombre de archivo no coincida de forma exacta con los elementos de `ALLOWED_FIXTURE_FILES` es rechazada de inmediato con:
  ```http
  HTTP/1.1 404 Not Found
  Content-Type: text/plain

  Not Found: Unapproved fixture file
  ```
  Esto impide que un cliente solicite archivos de configuración, código fuente (`package.json`, `.env`, certificados o claves) aun si estuvieran ubicados en el mismo directorio.

### 2.3 Protección contra Path Traversal (Defensa en Profundidad)
- Se valida la URL sin decodificar y decodificada para interceptar secuencias de salto de directorio (`..` y secuencias codificadas como `%2e%2e`):
  ```typescript
  if (rawReqUrl.includes('..') || rawReqUrl.toLowerCase().includes('%2e%2e')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden: Path Traversal Detected');
    return;
  }
  ```
- Se aplica además `path.resolve` y verificación de prefijo seguro sobre la ruta del directorio base.

### 2.4 Cumplimiento del Protocolo HTTP Multimedia
- **Soporte de Solicitudes de Rango (`Range: bytes=`)**:
  - Permite peticiones parciales esenciales para reproductores multimedia (FastStart / `moov` atom).
  - Devuelve código `206 Partial Content` con cabeceras `Content-Range: bytes start-end/total`, `Accept-Ranges: bytes` y `Content-Length: chunkSize`.
  - Devuelve código `416 Requested Range Not Satisfiable` con cabecera `Content-Range: bytes */total` si el rango solicitado excede el tamaño del archivo o no es sintácticamente válido.
- **Soporte de Peticiones `HEAD`**:
  - Devuelve metadatos completos (`Content-Length`, `Content-Type`, `Accept-Ranges`) con cuerpo vacío (`body.length === 0`).
- **Cabeceras CORS Permisivas para Pruebas**:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`
  - `Access-Control-Allow-Headers: Range, Content-Type`
  - `Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges`

### 2.5 Procedimiento de Parada Limpia
- El script implementa manejadores de señales del sistema para cierre ordenado:
  ```typescript
  const shutdown = () => {
    console.log('\n[TestServer] Stopping server...');
    server.close(() => {
      console.log('[TestServer] Server stopped cleanly.');
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  ```
- El operador puede detener el servidor en cualquier momento presionando `Ctrl+C` en la terminal.

---

## 3. Pruebas Unitarias Automatizadas

Las capacidades y restricciones del servidor están cubiertas por 20 pruebas unitarias en `src/utils/test-server.test.ts`, ejecutadas con Vitest:
- Parseo de argumentos CLI por defecto (`127.0.0.1:8088`).
- Parseo de `--host`, `--port`, `--lan` y `--host lan`.
- Parseo de rangos HTTP (explícitos, abiertos, sufijos, rangos inválidos, no numéricos).
- Respuesta HTTP 200 para `synthetic_test.mp4` y `synthetic_test.m3u`.
- Respuesta HTTP 206 para rangos de bytes parciales y de sufijo.
- Respuesta HTTP 416 para rangos fuera de límites.
- Respuesta HTTP 200 a peticiones `HEAD` con cuerpo vacío.
- Bloqueo HTTP 403 para intentos de path traversal con `%2e%2e`.
- Bloqueo HTTP 404 para archivos no autorizados fuera de la lista blanca.
- Verificación del tamaño exacto del conjunto `ALLOWED_FIXTURE_FILES`.

**Resultado:** 20 pruebas ejecutadas, 20 aprobadas (100% de éxito).

---

## 4. Estado Operativo Actual

Durante la realización de la Misión M2.2.1:
- El servidor de pruebas **NO ha sido iniciado**.
- No existe ningún proceso en segundo plano escuchando en los puertos `8088` ni en ninguna otra interfaz.
- Si en una misión posterior se requiere emitir el stream sintético hacia el televisor, el operador deberá ejecutarlo manualmente con:
  ```bash
  npx tsx scripts/test-server.ts --lan
  ```
  y detenerlo con `Ctrl+C` una vez finalizada la prueba.

