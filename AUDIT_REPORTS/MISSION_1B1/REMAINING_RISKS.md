# RIESGOS RESIDUALES Y CONSIDERACIONES DE DESPLIEGUE — REMAINING RISKS
## webOS IPTV Player v1.17.0 — Misión 1B.1

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / API 4.1.0 / SoC Realtek RTD2870)  
**Fecha:** 2026-10-29  

---

## 1. Riesgos Residuales Identificados

A pesar de que el código estático y las pruebas automatizadas locales han cerrado el 100% de las vulnerabilidades lógicas de seguridad (bypass de loopback, orígenes CORS no autorizados, permisos laxos y referencias huérfanas en el paquete), existen factores inherentes al hardware embebido real que deben monitorizarse durante el despliegue físico:

### 1.1 Gestión de Memoria en Hardware con 1,5 GB de RAM
* **Riesgo:** El SoC Realtek RTD2870 cuenta con 1,5 GB de memoria RAM compartida entre el sistema operativo webOS, el compositor gráfico y la reproducción de video.
* **Impacto:** La carga de listas M3U o guías XMLTV de gran tamaño (>100.000 canales o guías EPG >50 MB) puede generar picos de uso en el motor V8 de Chromium 53, activando el *Out-of-Memory Killer* (OOM) de Linux en el televisor.
* **Mitigación Implementada:** El reproductor cuenta con un Web Worker dedicado (`app-worker.js`) y paginación virtual en `VirtualGrid`. Sin embargo, en listas extremadamente masivas se recomienda limitar las categorías en la interfaz del televisor.

### 1.2 Persistencia de Almacenamiento en `/media/internal`
* **Riesgo:** `UploadStore.resolveDataDir()` busca directorios candidatos en el siguiente orden:
  1. `/media/internal/iptv-uploads`
  2. `./uploads` (dentro del directorio del servicio, típicamente de solo lectura)
  3. `/tmp/iptv-uploads`
* **Impacto:** Si la partición `/media/internal` no estuviera disponible o tuviera cuota saturada, el servicio caería en `/tmp/iptv-uploads`, lo que provocaría que las listas subidas se borraran cada vez que el televisor se apague o reinicie.
* **Acción en Despliegue:** Confirmar mediante telemetría local o logs que el directorio activo es `/media/internal/iptv-uploads`.

### 1.3 Advertencia de `requiredACG` en `appinfo.json`
* **Riesgo:** Durante la ejecución de `ares-package`, la herramienta emitió la siguiente advertencia:
  `[Warning] The 'requiredACG' field is not defined in appinfo.json.`
* **Análisis:** webOS introduce a partir de webOS 6.0 el sistema ACG (*Access Control Groups*) para controlar qué aplicaciones pueden invocar métodos de Luna. En **webOS TV Lite 4.10.2 (API 4.1.0)**, el sistema ACG **no está activo** y el sistema operativo no requiere este campo.
* **Recomendación para Futuras Versiones:** Si el proyecto planea soportar webOS 6.0+, se deberá declarar `"requiredACG": []` en `appinfo.json`. Para webOS 4, la ausencia es compatible y no genera ningún fallo.

### 1.4 Renderizado Nativo de Video sobre Plano Gráfico
* **Riesgo:** En webOS, la etiqueta HTML `<video>` no dibuja los frames dentro del DOM de Chromium; en su lugar, Chromium crea un "agujero transparente" en la ventana gráfica y el chip de procesamiento de video de LG renderiza el video directamente en un plano de hardware subyacente.
* **Impacto:** Si la capa DOM superior tiene fondos opacos o si las animaciones de CSS no se pausan durante la reproducción a pantalla completa, la GPU puede sufrir caídas de framerate.
* **Mitigación:** La arquitectura del proyecto maneja clases `hidden` y apaga los overlays tras unos segundos de inactividad (`player-osd.ts`).

---

## 2. Recomendaciones de Transición para la Misión 1C

Para la fase de despliegue físico e inspección dinámica en el televisor:
1. **Instalación en Frío:** Ejecutar `build.sh --install` (o `ares-install`) seguido de un reinicio completo de la aplicación, garantizando que el servicio Node.js y la app carguen los bundles de M1B.1 y no instancias en caché.
2. **Monitoreo de Logs de Luna:** Utilizar el capturador de eventos de diagnóstico para verificar que el método Luna `luna://com.lennylxx.iptv.service/start` responda con el `appToken` y que `setServicePort` configure el puerto correcto.
3. **Comprobación de Reproducción Local:** Verificar que la reproducción de listas subidas (`/uploads/:id.m3u?token=...`) se inicialice sin errores de autenticación 403 en el pipeline nativo de webOS.

