# PENDIENTES, OBSERVACIONES Y MEJORAS IDENTIFICADAS TRAS M2
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Misión:** Misión 2 — Despliegue y Validación en Hardware Real

---

## 1. Observaciones Técnicas y Recomendaciones

### 1.1 Flag de Inspección (`inspectable: true` en `appinfo.json`)
* **Estado Actual:** El paquete incluye `"inspectable": true`, lo que habilitó el puerto Chrome DevTools (TCP 9998) utilizado para la auditoría técnica y captura de métricas.
* **Recomendación:** Para compilaciones de producción orientadas a distribución final, se recomienda desactivar o parametrizar esta propiedad mediante esbuild para no exponer la consola CDP a la red local de forma innecesaria.

### 1.2 Latencia de Inicio en Flujos VOD MP4 Externos vs HLS/DASH
* **Hallazgo:** Los flujos HLS y MPEG-DASH inician la reproducción en menos de 1 segundo gracias a la arquitectura de segmentación y desmultiplexación acelerada por hardware de webOS. En streams MP4 progresivos servidos por CDNs externas con alta latencia de negociación HTTPS, el elemento `<video>` de Chromium 53 experimenta retardos de buffering antes de disparar `loadedmetadata`.
* **Recomendación:** En listas M3U que contengan enlaces VOD directos, priorizar el sniffing temprano de cabeceras `Content-Type` y configurar buffers iniciales reducidos.

### 1.3 Entorno de Compilación en Host Windows
* **Hallazgo:** Durante la fase de preparación de M1C/M2 se comprobó que ciertas tareas de `package.json` dependían de utilidades Unix (`rm -rf`).
* **Solución Implementada:** La creación del script multiplataforma `scripts/build-service.mjs` resolvió definitivamente la discrepancia de compilación en Windows. Se recomienda conservar esta arquitectura basada en Node.js puro para mantener paridad total entre plataformas (Windows, macOS y Linux).

### 1.4 Limpieza de Artefactos Temporales de Auditoría
* **Ubicación:** `/tmp/iptv-audit-m2/` en el televisor.
* **Estado:** Al encontrarse en el sistema de archivos temporal `tmpfs` (en memoria RAM), se destruye automáticamente con cualquier reinicio físico del televisor. No obstante, se provee el procedimiento de limpieza explícito en el informe de rollback.

