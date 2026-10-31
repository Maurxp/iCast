# EVALUACIÓN DE RIESGOS RESIDUALES — MISIÓN M2.1
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Seguridad y Software Embebido  
**Estado:** REPORTE DE RIESGOS CONSOLIDADO

---

## 1. Riesgos de Seguridad

### 1.1 Exposición de Chrome DevTools Protocol (TCP 9998)
* **Severidad:** Moderada a Alta (dependiente del entorno de red).
* **Descripción:** Mientras la aplicación esté en ejecución bajo la instalación actual, el puerto 9998 permanecerá escuchando en `0.0.0.0:9998` debido a la configuración por defecto de SAM en `/media/developer/apps/`.
* **Riesgo:** Si un dispositivo no confiable se conecta a la misma red Wi-Fi o Ethernet, podría interactuar con la consola de depuración de Chromium.
* **Mitigación Inmediata:** Mantener el televisor en una red doméstica segura y protegida con contraseña WPA2/WPA3.
* **Cierre Definitivo:** Se cerrará en la Misión 2.2 incorporando `"inspectable": false` en la siguiente compilación del IPK.

---

## 2. Riesgos Multimedia y de Compatibilidad

### 2.1 Archivos MP4 No Optimizados para Web (Sin FastStart)
* **Severidad:** Baja.
* **Descripción:** Si una lista de reproducción IPTV suministrada por el usuario contiene archivos MP4 donde el átomo `moov` está ubicado al final del archivo en un servidor sin soporte de peticiones `Range`, el televisor necesitará descargar el archivo completo antes de iniciar la reproducción, lo que puede provocar un timeout de inicio (`STARTUP_TIMEOUT: 15s`).
* **Mitigación:** La mayoría de proveedores IPTV modernos utilizan HLS (`.m3u8`) o MPEG-TS (`.ts`) para canales en vivo, formatos que no presentan esta restricción. Para películas MP4, los servidores CDN estándar ya incorporan `qt-faststart`.

---

## 3. Preservación del Sistema Operativo y Firmware

* **Particiones del Sistema (`/old_root`, `tvservice`, `kernel`):**
  * **Riesgo:** Cero (0).
  * **Estado:** Ningún comando ejecutado en las misiones M2 o M2.1 realizó escrituras, montajes ni alteraciones sobre particiones de solo lectura del firmware. La integridad del televisor se encuentra al 100% garantizada.

