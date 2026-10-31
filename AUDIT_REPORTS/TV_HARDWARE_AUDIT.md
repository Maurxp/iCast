# AUDITORÍA TÉCNICA DE HARDWARE Y SISTEMA
## Dispositivo Objetivo: LG 65UM7400PDA
### Inspección Dinámica de Solo Lectura vía SSH (192.168.1.8)

---

## 1. IDENTIFICACIÓN GENERAL DEL DISPOSITIVO

| Parámetro | Valor Obtenido vía SSH | Comando / Fuente de Evidencia |
|---|---|---|
| **Fabricante** | LG Electronics | `nyx-cmd DeviceInfo query` |
| **Modelo Comercial** | **65UM7400PDA** | `nyx-cmd DeviceInfo query` |
| **Número de Serie** | 907RMKUAG277 | `nyx-cmd DeviceInfo query` |
| **Plataforma SoC** | **Realtek RTD2870 (k5lp / K5LP_DVB)** | `/proc/cpuinfo` (`Hardware: rtd287o`), `nyx-cmd` |
| **Nombre de Plataforma webOS** | **Rockhopper** | `/etc/starfish-release` |
| **Versión de webOS** | **4.10.2-29 (goldilocks2-grampians)** | `/etc/starfish-release` |
| **Versión de API webOS** | **4.1.0** | `/etc/starfish-release` |
| **Tipo de Sistema Operativo** | **webOS TV Lite** | `/etc/starfish-release` |
| **Versión de Firmware** | **05.40.97** | `/etc/starfish-release` |
| **Fecha de Compilación del Sistema** | **2025-07-02 08:36:07 KST** | `nyx-cmd OSInfo query` |
| **Imagen del Sistema** | starfish-dvb-secured | `/etc/starfish-release` |
| **Dirección MAC Ethernet** | `74:40:BE:7B:20:C2` | `nyx-cmd DeviceInfo query` |
| **Dirección MAC Wi-Fi** | `20:17:42:89:0C:87` | `nyx-cmd DeviceInfo query` |

---

## 2. KERNEL Y ARQUITECTURA DE PROCESAMIENTO

### 2.1. Kernel Linux
* **Versión del Kernel:** `Linux LGwebOSTV 4.4.84-p.649.grampians.k5lp.1 #1 SMP PREEMPT Wed Jul 2 19:04:22 KST 2025 armv7l GNU/Linux`
* **Tipo:** Monolítico con soporte SMP y kernel preemptivo (`PREEMPT`).
* **Arquitectura:** **ARMv7l (32 bits Little-Endian)**.

### 2.2. Procesador (CPU)
* **Procesador:** Realtek RTD2870 quad-core ARMv7.
* **Núcleos Activos:** 4 núcleos (`processor 0` a `processor 3`).
* **Implementador:** ARM Ltd (`0x41`), Parte: Cortex-A73/A53 derivative (`0xd05`), Variante: `0x1`, Revisión: `0`.
* **BogoMIPS:** 54.00 por núcleo.
* **Flags / Características de Hardware:**
  `half thumb fastmult vfp edsp neon vfpv3 tls vfpv4 idiva idivt vfpd32 lpae evtstrm aes pmull sha1 sha2 crc32`
* **Aspectos Destacados de la CPU:**
  * Dispone de extensiones SIMD vectoriales **NEON**.
  * Dispone de instrucciones criptográficas por hardware (`aes`, `pmull`, `sha1`, `sha2`, `crc32`).
  * Dispone de división por hardware en enteros (`idiva`, `idivt`).

---

## 3. MEMORIA RAM Y GESTIÓN DE SWAP

### 3.1. Distribución de Memoria (desde `/proc/meminfo`)
* **Memoria Física Instalada en Placa:** **1.5 GB DDR3/DDR4** (reportada por `nyx-cmd DeviceInfo query: 1.5 GB`).
* **Memoria Total Asignada a Linux (`MemTotal`):** **987,348 kB (~964 MB)**. (Aproximadamente 512 MB de la memoria física están reservados permanentemente para el procesador de vídeo, decodificadores y hardware gráfico).
* **Memoria Libre (`MemFree` en reposo):** **30,488 kB (~30 MB)**.
* **Memoria en Buffers y Caché (`buff/cache`):** **410,644 kB (~401 MB)**.
* **Memoria Disponible para Nuevas Aplicaciones (`MemAvailable`):** **~370,000 kB a 450,000 kB (~370 MB a ~440 MB)**.
* **Memoria de Decodificación Hardware CMA (`CmaTotal`):** **172,032 kB (168 MB)**.
  * `CmaFree`: ~5,364 kB (la memoria contigua es reclamada dinámicamente al abrir decodificadores de vídeo).
* **Espacio de Intercambio (Swap):**
  * `SwapTotal`: **716,796 kB (~700 MB)**.
  * `SwapFree`: **634,856 kB (~620 MB)**.
  * `SwapUsed`: **81,940 kB (~80 MB)**.

---

## 4. ALMACENAMIENTO Y PARTICIONAMIENTO

Evidencia obtenida de `df -h`:
* **Partición Raíz (`/`):** Sistema overlay de solo lectura montado sobre memoria flash eMMC `/dev/mmcblk0p31` (26 MB) y squashfs.
* **Partición de Aplicaciones de Usuario (`/media/cryptofs` y `/media`):**
  * Montado en `/dev/mmcblk0p58` (capacidad total 617.3 MB).
  * Usado: **320.2 MB** (53%).
  * **Espacio Libre Disponible para Aplicaciones:** **284.5 MB**.
* **Partición de Datos Comunes y Caché (`/var`, `/home`, `/mnt/lg/cmn_data`):**
  * Montado en `/dev/mmcblk0p57` (capacidad 525.3 MB).
  * Libre: **213.6 MB** (56% de uso).
* **Directorio Temporal en RAM (`/tmp`):** tmpfs de 482.1 MB (disponibles 449.1 MB).
* **Base de datos del sistema (`/var/db`):** montado en `/dev/mmcblk0p56` (104.5 MB, 87.8 MB libres).

---

## 5. SUBSISTEMA WEB Y RUNTIMES

### 5.1. Motor Web: WebAppMgr / Chromium
* **Versión Exacta de Chromium:** **53.0.2785.34** (obtenida de las cadenas binarias de `/usr/lib/libcbe.so`).
* **Librería Central:** `/usr/lib/libcbe.so` (74,257,880 bytes).
* **Proceso Activo:** `/usr/bin/WebAppMgr` (PID 3325, usuario `wam`).
* **Flags Relevantes de Ejecución de WebAppMgr:**
  * `--remote-debugging-port=9998` (puerto CDP de depuración remota activo en localhost).
  * `--js-flags=--ignition --noexpose_wasm` (**WebAssembly explícitamente deshabilitado por el fabricante; motor V8 en modo Ignition**).
  * `--disable-v8-crankshaft` (Crankshaft deshabilitado en favor de Ignition).
  * `--application-cache-domain-limit=10485760` (Límite estricto de AppCache de 10 MB por dominio).
  * `--disk-cache-size=52428800` (Caché en disco acotada a 50 MB).
  * `--skia-image-cache-size-mb=40` (Caché de imágenes Skia acotada a 40 MB).
  * `--v8-use-lightweight-gc-on-idle` (Recolección de basura agresiva en periodos de inactividad).
  * `--watchdog-render-timeout=200` (Watchdog de renderizado de 200 ms).
  * `--enable-aggressive-release-policy`
  * `--ozone-platform=wayland`
  * `--in-process-gpu`
* **Consumo de Memoria de WebAppMgr en Reposo:**
  * `VmPeak`: 529,036 kB (~516 MB virtual).
  * `VmSize`: 523,844 kB.
  * `VmRSS`: **51,132 kB (~50 MB físicos)**.

### 5.2. Runtime Node.js
* **Binario del Sistema:** `/usr/bin/node`.
* **Versión del Sistema:** **v0.12.2**.
* **Librerías Nativas Disponibles en `/usr/lib/nodejs/` y `/usr/lib/node_modules/`:**
  * `webos-service` (Módulo oficial para enlace de servicios JS al bus Luna).
  * `usocket` (Sockets Unix para IPC interna de webOS).
  * `palmbus.js`, `webos-sysbus.node`, `pmloglib.node`, `webos.node`.
* **Lanzador de Servicios JS:** `/usr/palm/services/jsservicelauncher` (`bootstrap-node.js`).

---

## 6. SUBSISTEMA MULTIMEDIA Y CODECS (GSTREAMER 1.14.1)

### 6.1. Versión de GStreamer
* **GStreamer:** versión **1.14.1** (`gst-inspect-1.0 version 1.14.1`).

### 6.2. Decodificadores Hardware OpenMAX (OMX) de Realtek
Inspeccionados directamente con `gst-inspect-1.0`:
1. `omxh264dec`: OpenMAX H.264 Video Decoder (Hardware).
2. `omxh265dec`: OpenMAX H.265 / HEVC Video Decoder (Hardware).
3. `omxvp9dec`: OpenMAX VP9 Video Decoder (Hardware).
4. `omxvp8dec`: OpenMAX VP8 Video Decoder (Hardware).
5. `omxmpegvideodec`: OpenMAX MPEG-2 / MPEG-4 / XVID Video Decoder (Hardware).
6. `omxvc1dec`: OpenMAX WMV / VC-1 Video Decoder (Hardware).
7. `omxavsdec`: OpenMAX AVS Video Decoder.
8. `omxaacdec`: OpenMAX AAC Audio Decoder (Hardware).
9. `omxac3dec`: OpenMAX AC3 Audio Decoder (Hardware).
10. `omxac4dec`: OpenMAX AC-4 Audio Decoder (Dolby AC-4 Hardware).
11. `omxdtsdec`: OpenMAX DTS Audio Decoder (Hardware).
12. `omxopusdec`: OpenMAX Opus Audio Decoder (Hardware).
13. `omxmp3dec`: OpenMAX MP3 Audio Decoder (Hardware).
14. `omxflacdec`: OpenMAX FLAC Audio Decoder.

### 6.3. Elementos de Salida y Demuxers de GStreamer
* **Salida de Vídeo Hardware Directa:** `dvovideosink` (Realtek video sink hacia el plano punch-through de pantalla).
* **Salida de Audio Hardware:** `rtkalsasink` (Realtek ALSA sink).
* **Demuxers de Streaming:**
  * `hlsdemux` (Demultiplexor HLS nativo).
  * `dashdemux` y `dvrdashdemux` (Demultiplexores MPEG-DASH nativos).
  * `souphttpsrc` (Cliente HTTP de GNOME Soup para transporte de red).

### 6.4. Servidores y Gestores de Medios Activos
* `/usr/sbin/umediaserver` (PID 3220): Servidor central de políticas y recursos multimedia.
* `/usr/sbin/starfish-media-pipeline` (PID 3296): Proceso de canalización multimedia de LG.

---

## 7. ENTORNO HOMEBREW Y SERVICIOS ACTIVOS

### 7.1. Homebrew Channel
* **Ruta de Instalación:** `/media/developer/apps/usr/palm/applications/org.webosbrew.hbchannel`.
* **Versión:** **0.7.3** (comprobado en `appinfo.json`).
* **Servicio de Fondo:** `/media/developer/apps/usr/palm/services/org.webosbrew.hbchannel.service`.

### 7.2. Configuración de `webosbrew` (`/var/lib/webosbrew/`)
* Componentes instalados:
  * `startup.sh` (script de autoinicio root tras el arranque).
  * `sshd` (servidor Dropbear SSH activo en puerto 22).
  * `init.d` (scripts de inicio personalizados).
  * `keyremap` (remapeador de teclas Python `keyremap.py` en ejecución).
  * `homecustom` y `fullhomecustom`.

### 7.3. Gestor de Paquetes `opkg`
* **Versión:** `opkg 0.3.3` en `/usr/bin/opkg`.
* **Configuración:** `/etc/opkg/opkg.conf` (sin feeds remotos habilitados).
* **Arquitectura de Paquetes:** `k5lp` (prioridad 201 en `/etc/opkg/arch.conf`).

### 7.4. Herramientas del Sistema Verificadas
* `curl`: **Disponible** (`/usr/bin/curl`).
* `wget`: **Disponible** (`/usr/bin/wget`).
* `python`: **Disponible** (`Python 2.7.12` en `/usr/bin/python`).
* `python3`: **No disponible**.
* `git`: **No disponible**.
* `ffmpeg`: **No disponible** (se utilizan las librerías nativas del sistema).
* `luna-send` / `luna-send-pub`: **Disponibles** (`/usr/bin/luna-send-pub`).

---

## 8. SÍNTESIS DE LA AUDITORÍA DE DISPOSITIVO

El televisor LG 65UM7400PDA se encuentra en un estado operativo óptimo para la ejecución de aplicaciones nativas de webOS:
1. Dispone de **acceso administrativo root** permanente y funcional.
2. Posee **~370 MB - 440 MB de RAM libre/disponible** para la ejecución de la aplicación, lo cual es holgado para la huella ligera del proyecto (~40-60 MB).
3. Posee **284 MB de almacenamiento interno libre** en `/media`, más que suficiente para el IPK (~3-5 MB) y las bases de datos de caché.
4. Su motor de decodificación por hardware Realtek RTD2870 soporta directamente la totalidad de los formatos utilizados en IPTV (H.264, HEVC 4K, VP9, MPEG-2, AAC, AC3, DTS).

