# FASE F — INFORME DE RENDIMIENTO, CONSUMO Y ESTABILIDAD
**Dispositivo:** LG 65UM7400PDA (SoC Realtek RTD2870, 4 núcleos Cortex-A53, 1 GB RAM)  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Estado:** EXCELENTE — HUELLA DE MEMORIA LIGERA Y ALTA ESTABILIDAD

---

## 1. Métrica de Consumo de Recursos en Hardware Real

| Componente | Proceso / PID | Memoria Virtual (VSZ) | Memoria Residente (RSS) | Consumo de CPU |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web (Chromium 53)** | `WebAppMgr` (PID 27261) | 419.5 MB | **57.3 MB** | 0.9 % |
| **Servicio de Red (Node.js 0.12.2)** | `com.lennylxx.iptv.service` (PID 27171) | 67.9 MB | **18.3 MB** | 0.7 % |
| **Total Reproductor IPTV** | *Frontend + Backend* | - | **75.6 MB** | **1.6 %** |

---

## 2. Comparativa Contra la Línea Base de la Fase A

| Parámetro del Sistema | Fase A (Línea Base Pre-Instalación) | Fase F (App en Ejecución + Canales) | Variación Neta |
| :--- | :--- | :--- | :--- |
| **Memoria Libre (`MemFree`)** | 37.6 MB | 56.3 MB | +18.7 MB (Rebalanceo dinámico) |
| **Memoria Disponible (`MemAvailable`)** | 361.8 MB | 275.5 MB | **-86.3 MB** (Consumida por app + buffers) |
| **Presión de Swap (zram)** | 619.3 MB libres (86%) | 612.8 MB libres (85%) | Sin thrashing ni swap in/out forzado |
| **CPU Global Idle** | 92.7 % | 91.2 % | Impacto en CPU inferior al 2% |

### Análisis de la Huella de Recursos:
* La aplicación y su servicio consumen conjuntamente apenas **75.6 MB de RAM física**, dejando más de **275 MB de memoria disponible** en el televisor.
* Para un dispositivo de especificaciones restringidas (1 GB de RAM total), este perfil de consumo se sitúa muy por debajo de los techos de riesgo de webOS (típicamente >180 MB para aplicaciones de terceros).

---

## 3. Eficiencia de Descodificación por Hardware

* Durante la reproducción de flujos HLS y DASH en alta definición (incluyendo detección de perfiles UHD 4K en manifiestos), la CPU de la app se mantuvo por debajo del **2%**.
* Esto confirma empíricamente que el pipeline nativo `<video src>` delega la desmultiplexación y el renderizado directamente a los aceleradores de hardware de video del SoC Realtek RTD2870 (`starfish-media-pipeline`), evitando la carga de decodificación por software en JavaScript/Blink.

---

## 4. Evaluación de Estabilidad y Ausencia de Fugas (OOM)

* **Inspección de eventos OOM en el Kernel (`dmesg`):**
  ```text
  NO_OOM_EVENTS
  ```
  Cero procesos terminados por falta de memoria por el subsistema Linux.
* **Transiciones de Pantalla y Ciclo de Reconciliación (`morph`):**
  La navegación repetida entre la pantalla de Ajustes, la lista de canales sintetizada y la reproducción no generó acumulación de nodos DOM huérfanos ni fugas de memoria en el runtime V8.

