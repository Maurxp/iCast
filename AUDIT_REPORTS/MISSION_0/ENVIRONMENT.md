# MISIÓN 0 — INFORME DE ENTORNO TÉCNICO (ENVIRONMENT.md)

**Proyecto:** `lennylxx/webos-iptv-player` (v1.17.0)  
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29 / API 4.1.0)  
**Fecha de Auditoría:** 2026-10-29  
**Rama de Trabajo:** `baseline/mission-0` (Commit base `52b5dfa`)

---

## 1. Entorno del Host de Desarrollo (PC Local)

### 1.1. Especificaciones del Sistema y Herramientas Base
* **Sistema Operativo:** Windows 11 Pro (x64, Build 26100/Windows NT 10.0).
* **Terminal / Intérprete:** PowerShell 5.1 / PowerShell Core, Windows Command Prompt (`cmd.exe`).
* **Node.js:** `v24.18.0` (Motor V8 moderno, Soporte nativo ESM y Fetch API).
* **npm:** `11.16.0`.
* **Git:** `2.55.0.windows.3` (Configuración `core.autocrlf=true`).
* **Python:** `3.14.6` (64-bit).
* **Playwright Core:** `v1.63.0` (Instalado vía `devDependencies` en `node_modules`).
* **Herramientas SSH / Conectividad:**
  * PuTTY Suite: `plink.exe` (`C:\Program Files\PuTTY\plink.exe`), `pscp.exe`.
  * OpenSSH Client for Windows (`ssh.exe`).

### 1.2. Herramientas Especializadas de webOS
* **webOS CLI (`ares-*`):** **NO INSTALADAS** globalmente en el host (`ares-package`, `ares-install`, `ares-setup-device`, `ares-inspect` ausentes del `%PATH%`).
  * *Impacto:* Los scripts bash del proyecto (`scripts/tv.sh`) y las utilidades Node (`scripts/cdp-client.mjs`, `benchmarks/tv-runner.mjs`) dependen de `ares-setup-device` para resolver credenciales y dispositivos por defecto.
* **Intérprete Expect (`expect` / `tcl`):** **NO DISPONIBLE** nativamente en Windows (`scripts/tv-ssh.exp` y `scripts/tv-scp.exp` requieren Unix `expect`).
  * *Mitigación Verificada:* Conexión directa y ejecución remota de solo lectura vía `plink.exe -P 22 -pw <redacted> root@192.168.1.8`.

### 1.3. Estado del Repositorio y Preservación del Proyecto (Regla 1)
* **Rama Activa:** `baseline/mission-0`.
* **Commit Base:** `52b5dfa` (*"Clamp Guide descriptions instead of cutting at 200 chars"*).
* **Archivos Modificados del Repositorio:** `0` (Árbol rastreado limpio).
* **Archivos Sin Seguimiento (Untracked):** Directorio de auditoría `AUDIT_REPORTS/` (exclusivo para informes y métricas).
* **Integridad de Dependencias:** Se ejecutó `npm ci` estricto en la rama de trabajo, respetando íntegramente `package-lock.json` (317 paquetes instalados, 0 vulnerabilidades, sin alteración de versiones).

---

## 2. Entorno del Dispositivo Objetivo (LG 65UM7400PDA)

### 2.1. Identificación y Hardware de la Plataforma
* **Fabricante / Modelo:** LG Electronics / `65UM7400PDA` (Serie UM7400, 65 pulgadas IPS 4K Ultra HD).
* **SoC / Plataforma Interna:** Realtek RTD2870 (Código de ingeniería LG: `k5lp` / `K5LP_DVB`).
* **Microarquitectura CPU:** Quad-Core ARMv7 Processor rev 4 (v7l), 32-bit (Cortex-A53/A73 big.LITTLE / Energy-efficient configuration).
* **Frecuencias de CPU:** Escalamiento dinámico `scaling_governor=interactive` (Rango: 900 MHz – 1.2 GHz).
* **BogoMIPS:** 48.00 por núcleo (Total 4 núcleos activos).
* **Kernel:** `Linux 4.4.84-p.649.grampians.k5lp.1 armv7l` (Compilado para plataforma SMP `goldilocks2-grampians`).

### 2.2. Perfil de Memoria y Almacenamiento
* **Memoria RAM Física:** 1.5 GB DDR3/DDR4 compartida con el subsistema gráfico y procesador de video.
* **Mapeo de Memoria Kernel (`/proc/meminfo`):**
  * `MemTotal`: 987,144 kB (~964 MB dedicados al espacio de usuario y sistema operativo).
  * `MemFree`: ~22,464 kB.
  * `MemAvailable`: ~370,000 – 450,000 kB (~361 – 439 MB de memoria disponible real para procesos).
  * `Buffers` + `Cached`: ~375,000 kB.
  * `SwapTotal`: 716,796 kB (~700 MB zram / swap dinámico).
  * `SwapFree`: ~685,000 kB.
* **Almacenamiento eMMC / Particionado:**
  * `ROOTFS`: Montado en `/` como `squashfs` de **solo lectura** (integridad del sistema protegida).
  * `/media/internal`: Memoria flash de usuario montada en lectura/escritura (ext4).
  * `/media/developer`: Directorio para aplicaciones de desarrollo y Homebrew Channel (`org.webosbrew.hbchannel`).

### 2.3. Subsistema de Software y Runtime de Ejecución
* **Sistema Operativo:** webOS TV Lite versión `4.10.2-29`.
* **Versión de API webOS:** `4.1.0`.
* **Administrador de Aplicaciones Web:** `WebAppMgr` (LGE Web Application Manager).
* **Motor Web (Chromium):** Versión `53.0.2785.34` (Blink engine).
  * **Flags de V8:** `--js-flags=--ignition --noexpose_wasm`
  * **Implicación Crítica:** WebAssembly (WASM) está **físicamente deshabilitado** en el motor a nivel de flags de V8. Todo el código debe ejecutarse en JavaScript puro (ES5 / Chrome 53 syntax).
  * **Protocolo de Depuración (CDP):** WebAppMgr expone puerto DevTools `9998` (Chrome DevTools Protocol).
* **Runtime de Servicios en Segundo Plano:** Node.js `v0.12.2` (32-bit ARMv7, CommonJS / ES5 estricto) ubicado en `/usr/bin/node`.

### 2.4. Subsistema Multimedia y Decodificación por Hardware (OpenMAX)
Inspección verificada en `/etc/umediaserver/umediaserver_resource_config.txt` y bibliotecas OpenMAX en `/usr/lib/libomx*.so`:
* **Decodificadores de Video Soportados por Hardware:**
  * `omxh264dec`: H.264 / AVC (Baseline, Main, High Profile hasta Level 5.2 / 4K@30fps).
  * `omxh265dec`: H.265 / HEVC (Main, Main 10 Profile hasta 4K@60fps).
  * `omxvp9dec`: VP9 Profile 0 / Profile 2 (4K@60fps).
  * `omxmpegvideodec`: MPEG-2 / MPEG-4 Video.
  * **AV1:** **NO SOPORTADO** por hardware ni por el SoC RTD2870.
* **Decodificadores de Audio Soportados por Hardware:**
  * `omxaacdec`, `omxac3dec`, `omxac4dec`, `omxdtsdec`, `omxeac3dec`.
* **Límite de Recursos de Hardware (`umediaserver`):**
  * `VDEC qty = 2`: Máximo **2 instancias simultáneas de decodificación de video**. Intentar PIP o reproducir un tercer stream bloquea el pipeline multimedia.

### 2.5. Estado de Servicios y Conectividad del TV
* **Homebrew Channel:** Versión `0.7.3` activa en `/media/developer/apps/usr/palm/applications/org.webosbrew.hbchannel`.
* **SSH Root:** Servidor OpenSSH `7.2p2` escuchando en puerto `22` (acceso administrativo validado en modo solo lectura).
* **Bus del Sistema Luna:** Daemon `ls-hubd` gestionando llamadas IPC `luna://`.
* **Dirección IP del Dispositivo:** `192.168.1.8` en LAN local.

---

## 3. Matriz Comparativa de Discrepancias (Host vs. TV)

| Parámetro | Host de Desarrollo (PC) | Dispositivo Objetivo (LG 65UM7400PDA) | Impacto en el Proyecto |
| :--- | :--- | :--- | :--- |
| **Sistema Operativo** | Windows 11 Pro (x64) | webOS TV Lite 4.10.2 (Linux 4.4 ARMv7) | Rutas de archivos, permisos POSIX, saltos de línea CRLF/LF. |
| **Arquitectura de CPU** | x86_64 (Intel/AMD) | ARMv7l 32-bit (Realtek RTD2870) | Endianness, alineación de memoria, límites de puntero de 32 bits (máx 2GB por proceso). |
| **Memoria Disponible** | 16+ GB RAM | ~370 MB disponibles | Riesgo de OOM killer con fixtures grandes (50k canales). |
| **Motor Chromium** | 124+ (Playwright headless) | **53.0.2785.34** (2016) | Flexbox `gap` ausente, ES2017+ roto, sin `IntersectionObserver`, sin `ResizeObserver`. |
| **WebAssembly** | Habilitado nativamente | **Deshabilitado** (`--noexpose_wasm`) | No se pueden utilizar parsers o códecs compilados a WASM. |
| **Node.js** | `v24.18.0` (ESM nativo) | `v0.12.2` (ES5 / CJS) | El servicio empaquetado (`bundled-service/`) debe pasar el gate de compatibilidad Node 0.12. |
| **Herramientas webOS** | Ausentes (`ares-*` missing) | Homebrew Channel 0.7.3 instalado | Requiere invocar CDP vía IP directa o instalar `ares-cli` en el host. |

---

## 4. Conclusiones del Entorno

1. **Aislamiento Seguro:** La rama `baseline/mission-0` mantiene intacto el árbol original de Git del repositorio.
2. **Capacidad de Compilación Local:** El host dispone de Node.js 24 y npm 11, capaces de ejecutar TypeScript, esbuild y ESLint/Stylelint.
3. **Restricción de Recursos del TV:** El televisor real tiene un presupuesto estricto de memoria (~370 MB libres) y carece de WASM, lo que exige que cualquier benchmark o prueba de carga sea estrictamente calibrada para evitar colapsar el proceso `WebAppMgr`.

