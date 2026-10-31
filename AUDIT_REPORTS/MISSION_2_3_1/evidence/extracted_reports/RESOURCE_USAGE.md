# INFORME DE CONSUMO DE RECURSOS (RESOURCE USAGE)
## Misión M2.3 — webOS IPTV Player v1.17.0
**Fecha:** 2026-10-30  
**Dispositivo:** LG 65UM7400PDA  
**SoC:** Realtek RTD2870 (K5LP) / ARMv7 32-bit (Quad-core)  
**Memoria Total del Sistema:** 987.348 kB (~964 MB) RAM, 716.796 kB Swap  
**Estado:** DENTRO DE LOS LÍMITES SEGUROS (PASS)

---

## 1. Memoria de los Procesos de la Aplicación

Se tomaron lecturas directas del sistema de archivos `/proc/<pid>/status` en el televisor:

| Proceso | PID | Usuario | Memoria Virtual (VmSize) | Memoria Residente (VmRSS) | % Memoria Física | Hilos Activos |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend WebAppMgr** | 5675 | `wam` | 584.824 kB (~571 MB) | 93.312 kB (~91,1 MB) | 9,5% | 43 |
| **Servicio Node.js** | 2800 | `6904` | 67.816 kB (~66,2 MB) | 17.076 kB (~16,6 MB) | 1,7% | 7 |
| **Total Combinado** | — | — | **652.640 kB (~637 MB)** | **110.388 kB (~107,8 MB)** | **11,2%** | **50** |

### Evaluación Respecto a los Límites de webOS
* **Límite de Advertencia de la Plataforma:** 150 MB RSS para aplicaciones web de terceros.
* **Consumo Real:** ~108 MB RSS combinado (91 MB para el motor Chromium y 17 MB para el servicio Node.js).
* **Margen de Seguridad:** > 40 MB por debajo del umbral de advertencia de SAM. No se detectaron advertencias de memoria en `fullhome` ni en `messages`.

---

## 2. Consumo de CPU

Se registraron muestras de CPU mediante `top -b` en intervalos sucesivos:

| Estado de la Aplicación | % CPU WebAppMgr (PID 5675) | % CPU Servicio Node.js (PID 2800) | % CPU Sistema Global | % CPU Idle Global |
| :--- | :--- | :--- | :--- | :--- |
| **Reposo en Menú de Canales** | 0,0% – 0,5% | 0,0% – 0,5% | 7,4% – 8,5% | **91,3% – 93,4%** |
| **Reproducción Multimedia Activa** | 2,1% – 4,8% | 0,0% – 0,2% | 11,2% – 14,5% | **85,5% – 88,8%** |

### Observaciones
1. **Descompresión por Hardware:** El bajo uso de CPU durante la reproducción en los tres formatos (HLS, DASH y MP4) confirma que el SoC Realtek RTD2870 está decodificando H.264 mediante su pipeline de aceleración por hardware (`vdec`/`omx`), sin recurrir a decodificación por software en el hilo principal de V8/Chromium.
2. **Ausencia de Bucles Ociosos:** En reposo, tanto el frontend como el backend Node.js permanecen en estado `S` (Sleeping) con menos del 0,5% de uso de CPU, garantizando que no existen fugas de timers, polling descontrolado ni consumo de energía innecesario.

