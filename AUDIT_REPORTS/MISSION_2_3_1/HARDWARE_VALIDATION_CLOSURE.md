# CIERRE DE VALIDACIÓN EN HARDWARE (HARDWARE VALIDATION CLOSURE)
## Misión M2.3.1 — webOS IPTV Player v1.17.0
**Dispositivo:** LG 65UM7400PDA  
**Plataforma:** webOS TV Lite 4.10.2-29 / API 4.1.0  
**Fecha de Validación:** 2026-10-30 / 2026-10-31  
**Estado:** **APROBADO Y CONSOLIDADO (PASS)**

---

## 1. Identificación y Parámetros del Dispositivo Físico

La identificación del televisor físico se consolidó mediante consulta directa al servicio de información del dispositivo a través de `ares-device -i -d LG-TV`:

| Parámetro | Valor Registrado en Hardware | Significado Técnico |
| :--- | :--- | :--- |
| **Modelo** | `65UM7400PDA` | Televisor LG LED 65" UHD 4K (2019) |
| **Versión SDK** | `4.10.0` | webOS 4.x TV SDK |
| **Versión Firmware** | `05.40.97` | Versión oficial de firmware instalada |
| **Tipo de Placa (Board)** | `K5LP_DVB_EU` | Plataforma K5LP / DVB para mercado europeo/global |
| **ID OTA** | `HE_DTV_W19P_AFADABAA` | Identificador único de compilación over-the-air |
| **SoC** | Realtek RTD2870 (Rockhopper) | Quad-core ARM Cortex-A53 (ARMv7 32-bit execution mode) |
| **Kernel** | Linux 4.4.84 | Linux kernel LTS embebido de webOS |
| **Motor Web** | Chromium 53.0.2785.34 | `WebAppMgr` (Blink/V8 con soporte ES6/2015 parcial) |
| **Runtime de Servicios** | Node.js 0.12.2 | Motor JS legacy del sistema para servicios Luna |

---

## 2. Historial de Instalación y Corrección de CLI

### 2.1 Autorización Expresa
El usuario otorgó autorización expresa para la actualización del paquete mediante la herramienta oficial webOS CLI `ares-install`.

### 2.2 Diagnóstico y Corrección de `ares-install` en Novacom Local
Durante la fase inicial de despliegue en M2.3, la herramienta arrojó el error `Unable to exec` en la instrucción posterior a la transferencia SFTP (`/bin/ls -l /media/developer/temp/...`).
* **Causa Raíz:** En la implementación interna de novacom (`@webos-tools/cli/lib/base/novacom.js`), el método `sftpPut` ejecutaba `sftp.end()` y de inmediato invocaba `setImmediate(next)`. En el servidor SSH Dropbear de webOS 4, el canal SFTP se encontraba en proceso de desmontaje cuando la tarea siguiente solicitaba la apertura de un nuevo canal `exec`. Dropbear cerraba el canal entrante con código SSH 97 (`SSH_MSG_CHANNEL_CLOSE`), interpretado por `ssh2` como fallo de ejecución.
* **Solución Aplicada:** Se sincronizó `sftpPut` para aguardar explícitamente el evento `'close'` del canal SFTP (`sftp.once('close', done)`), permitiendo el cierre limpio antes de enviar la verificación `ls -l`.
* **Resultado de Instalación:** Código de retorno 0. Verificación MD5 en destino (`1a30cdbdd08cc7317495a9624c0e4c21`) idéntica a la del paquete host. Eliminación automática del paquete temporal de instalación por parte de `appInstallService`.

---

## 3. Estado de Ejecución en Runtime

### 3.1 Procesos Activos en el Sistema Operativo
Al iniciar la aplicación mediante `ares-launch --device LG-TV com.lennylxx.iptv`, el gestor de aplicaciones del sistema (`SAM`) y el gestor de superficie (`LSM`) transicionaron la aplicación al estado `FULLSCREEN`, visible y en primer plano:

| Proceso | PID | Usuario | VmSize | VmRSS | % RAM | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WebAppMgr (`com.lennylxx.iptv`)** | 5675 | `wam` | 584.824 kB | 93.312 kB (~91,1 MB) | 9,5% | Sleeping / Activo |
| **Servicio Node.js (`com.lennylxx.iptv.service`)** | 2800 | `6904` | 67.816 kB | 17.076 kB (~16,6 MB) | 1,7% | Sleeping / Activo |

* **Consumo Total de Memoria Residente:** ~107,8 MB RSS (11,2% de la RAM del televisor).
* **Consumo de CPU en Reposo:** 0,0% a 0,5% para ambos procesos, garantizando ausencia de bucles ocupados y excelente eficiencia energética.
* **Aislamiento del Servicio:** El servicio Node.js se ejecuta enjaulado en `/var/palm/jail/com.lennylxx.iptv.service` bajo el UID del sistema `6904`.

### 3.2 Protección de la Frontera Luna Bus (Fail-Closed)
Se confirmó en hardware que una llamada externa no autorizada en el bus Luna (`luna-send -n 1 -f luna://com.lennylxx.iptv.service/heartbeat "{}"`) es rechazada estrictamente por el servicio con:
```json
{
    "errorCode": -1,
    "returnValue": false,
    "errorText": "Unauthorized"
}
```
Esto demuestra que el blindaje implementado en la Misión M1C protege el servicio de accesos ilegítimos desde otras aplicaciones instaladas o herramientas de consola.

