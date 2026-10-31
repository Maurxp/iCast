# FASE A — LÍNEA BASE Y RECONOCIMIENTO DEL DISPOSITIVO
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Estado:** COMPLETADO CON ÉXITO — CONDICIONES ÓPTIMAS PARA DESPLIEGUE

---

## 1. Identificación del Hardware y SoC

| Parámetro | Valor Verificado en Hardware | Fuente / Evidencia |
| :--- | :--- | :--- |
| **Modelo Comercial** | LG 65UM7400PDA | LS2 `com.webos.service.tv.systemproperty/getSystemInfo` |
| **Plataforma / Board** | `K5LP_DVB_EU` (Rockhopper / Realtek RTD2870) | LS2 SystemInfo / `/proc/cpuinfo` |
| **SoC Hardware ID** | `rtd287o` | `/proc/cpuinfo` (Línea `Hardware: rtd287o`) |
| **Arquitectura CPU** | ARMv7 Processor rev 0 (v7l), 4 núcleos | `/proc/cpuinfo` |
| **Microarquitectura** | Cortex-A53 ejecutando en modo compatibilidad 32-bit | CPU implementer `0x41`, part `0xd05`, variant `0x1` |
| **Características CPU** | `half thumb fastmult vfp edsp neon vfpv3 tls vfpv4 idiva idivt vfpd32 lpae evtstrm aes pmull sha1 sha2 crc32` | `/proc/cpuinfo` |
| **BogoMIPS** | 54.00 por núcleo | `/proc/cpuinfo` |

---

## 2. Software y Versiones del Sistema

| Componente | Versión Verificada | Notas / Compatibilidad |
| :--- | :--- | :--- |
| **Kernel Linux** | `4.4.84-p.649.grampians.k5lp.1 #1 SMP PREEMPT armv7l` | Kernel compilado Wed Jul 2 19:04:22 KST 2025 |
| **webOS Release** | `Rockhopper release 4.10.2-29 (goldilocks2-grampians)` | `/etc/starfish-release` |
| **webOS TV Version** | `webOS TV 4.10.2` | `/etc/issue` |
| **SDK Version** | `4.10.0` | LS2 `sdkVersion` |
| **Firmware Versión** | `05.40.97` | LS2 `firmwareVersion` |
| **Motor Chromium** | `Chromium 53.0.2785.34` | Conforme a plataforma webOS 4 / API 4.1.0 |
| **Node.js en TV** | `v0.12.2` | Ejecutable `/usr/bin/node -v` |
| **Gestores disponibles** | `opkg` (`/usr/bin/opkg`), `luna-send` (`/usr/bin/luna-send`) | Binarios nativos del firmware |

---

## 3. Almacenamiento y Particiones

```text
Filesystem                Size      Used Available Use% Mounted on
/dev/root               723.0M    723.0M         0 100% /old_root
tmp                     482.1M     33.0M    449.1M   7% /tmp
/dev/mmcblk0p58         617.3M    320.2M    284.5M  53% /media
/dev/mmcblk0p57         525.3M    273.7M    213.2M  56% /var
/dev/mmcblk0p56         104.5M      8.8M     87.8M   9% /var/db
```

### Análisis de Capacidad para el Despliegue:
* **/tmp (tmpfs RAM):** **449.1 MB disponibles**. Espacio abundante para recibir el archivo IPK temporal (733 KB) y los scripts de auditoría.
* **/media/developer/apps (/dev/mmcblk0p58):** **284.5 MB disponibles** (53% de ocupación). El reproductor desplegado requiere ~3.5 MB, representando menos del 1.3% del espacio libre disponible.
* **Integridad de Particiones Críticas:** Se confirma la advertencia de hardware. Particiones del sistema como `/old_root`, `/mnt/tvservice`, `/mnt/fonts` están montadas como solo lectura. La instalación se dirigirá estrictamente a `/media/developer/apps/` a través del subsistema oficial de aplicaciones.

---

## 4. Línea Base de Memoria y Rendimiento (Pre-Instalación)

### Memoria RAM (`/proc/meminfo`):
* **MemTotal:** `987,348 kB` (~964 MB)
* **MemFree:** `37,640 kB` (~36.7 MB)
* **MemAvailable:** `361,892 kB` (~353.4 MB reales recuperables sin thrashing)
* **Buffers + Cached:** `367,408 kB`
* **SwapTotal (zram):** `716,796 kB`
* **SwapFree:** `619,312 kB` (~86% libre)

### Actividad de CPU (`top` basal):
* **CPU Idle:** **92.7%**
* **CPU User:** 1.5%
* **CPU System:** 5.7%
* **Procesos en ejecución:** 263 total, 1 running, 262 sleeping.
* **Proceso principal del sistema:** `tvservice` (PID 1326, ~14% CPU en muestreo instantáneo).

**Evaluación:** El televisor se encuentra en estado saludable y holgado para alojar el frontend en Chromium 53 y el servicio Node.js.

---

## 5. Inspección de Aplicaciones y Servicios Instalados

* **Directorio de Apps (`/media/developer/apps/usr/palm/applications/`):**
  * `com.retroarch.webos`
  * `org.webosbrew.hbchannel`
  * `youtube.leanback.v4`
  * `com.lennylxx.iptv`: **NO PRESENTE** (Se confirma que no hay instalaciones previas ni residuos).
* **Directorio de Servicios (`/media/developer/apps/usr/palm/services/`):**
  * `org.webosbrew.hbchannel.service`
  * `com.lennylxx.iptv.service`: **NO PRESENTE** (Se confirma que no hay servicios huérfanos).

---

## 6. Red y Puertos de Escucha Basales

* **Interfaz activa:** `wlan0` con IP `192.168.1.8`, MAC `74:40:BE:7B:20:C2`.
* **Puertos de escucha abiertos antes de la app:**
  * TCP 22 (SSH OpenSSH/Dropbear)
  * TCP 23 (Telnet)
  * TCP 1834, 3000, 3001, 7000, 1117, 2045, 1535, 36866, 18181, 1766, 11111, 1960.
* **Puerto de servicio LAN de la app:** Actualmente libre e inactivo.

---

## 7. Verificación del Paquete IPK a Instalar

* **Ruta local:** `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk`
* **Tamaño:** `733,772 bytes`
* **SHA-256:** `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`
* **Estado:** Coincidencia exacta (100%) con el artefacto compilado y validado en M1C-Final.

---

## 8. Conclusión de la Fase A

El entorno de hardware cumple todas las premisas operativas:
1. Conectividad SSH administrativa estable.
2. Almacenamiento holgado (284 MB en apps, 449 MB en /tmp).
3. Memoria disponible saludable (361 MB disponibles, swap zram al 86% libre).
4. Ninguna interferencia de versiones previas de la aplicación o servicio.
5. Autorización completa para proceder a la **FASE B (Instalación Controlada)**.

