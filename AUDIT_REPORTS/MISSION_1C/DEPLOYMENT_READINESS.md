# GUÍA DE PREPARACIÓN PARA DESPLIEGUE CONTROLADO (DEPLOYMENT READINESS)
## webOS IPTV Player v1.17.0 — LG 65UM7400PDA

> [!CAUTION]
> **RECORDATORIO ESTRICTO DE SEGURIDAD:**  
> Ninguno de los comandos descritos a continuación debe ser ejecutado contra el televisor sin autorización expresa del usuario. Esta guía documenta el procedimiento técnico para cuando se ordene la instalación.

---

## 1. Parámetros del Entorno Objetivo

* **Dispositivo:** LG 65UM7400PDA (LG webOS TV 4.10.2-29 / SoC RTD2870).
* **Dirección IP del Televisor:** `192.168.1.8`
* **Puerto SSH:** `22` (Usuario `root` con clave SSH configurada).
* **ID de la Aplicación:** `com.lennylxx.iptv`
* **ID del Servicio Luna:** `com.lennylxx.iptv.service`
* **Paquete IPK a Desplegar:** `AUDIT_REPORTS/MISSION_1C/package/com.lennylxx.iptv_1.17.0_all.ipk`

---

## 2. Procedimiento de Instalación Paso a Paso

### Paso 1: Comprobación de Conectividad de Red
Antes de interactuar con el televisor, verificar que la interfaz de red responda al ping y que el puerto SSH esté abierto:
```bash
# Ping al televisor
ping 192.168.1.8

# Comprobación de puerto SSH 22 abierto
ssh -p 22 -o ConnectTimeout=5 root@192.168.1.8 "uname -a"
```
*Salida esperada:*  
`Linux LGwebOSTV 4.4.84-28.bld1.rockhopper ... armv7l GNU/Linux`

### Paso 2: Instalación del Paquete IPK
Mediante las herramientas oficiales de webOS CLI (`ares-install`):
```bash
# Instalación del IPK de Misión 1C
ares-install --device tv AUDIT_REPORTS/MISSION_1C/package/com.lennylxx.iptv_1.17.0_all.ipk
```
O alternativamente mediante SCP directo si se trabaja sobre la consola SSH:
```bash
# Copia e instalación directa con opkg
scp -P 22 AUDIT_REPORTS/MISSION_1C/package/com.lennylxx.iptv_1.17.0_all.ipk root@192.168.1.8:/tmp/
ssh -p 22 root@192.168.1.8 "opkg install /tmp/com.lennylxx.iptv_1.17.0_all.ipk"
```

### Paso 3: Reinicio en Frío (Cold Restart) de la Aplicación
webOS mantiene suspendida en memoria la aplicación anterior a través de las actualizaciones. Un simple relanzamiento reanuda la copia en memoria vieja. Es imprescindible terminar el proceso previo antes de lanzar:
```bash
# Terminar proceso previo
ares-launch --device tv --close com.lennylxx.iptv

# Pausa de 1 segundo
sleep 1

# Lanzamiento en frío
ares-launch --device tv com.lennylxx.iptv
```

---

## 3. Verificación Post-Instalación (Smoke Test)

Una vez lanzada la aplicación, se debe ejecutar la siguiente rutina de verificación de salud:

### Prueba 1: Inspección de Logs en Vivo
Conectar el inspector para verificar el arranque limpio del frontend y del servicio:
```bash
# Inspección de consola remota en tiempo real
ares-inspect --device tv --app com.lennylxx.iptv
```
*Verificar en los logs:*
* `[service] registered with Luna as com.lennylxx.iptv.service`
* `[lan] HTTP server ready on port <puerto>`
* `[lan] Bundled service start onSuccess: running=true, port=<puerto>, hasToken=true`
* **Confirmar ausencia absoluta de cadenas de tokens o PINs en los registros.**

### Prueba 2: Verificación de la Política Fail-Closed de Luna
Probar desde el shell root del televisor una llamada directa con `luna-send`:
```bash
ssh -p 22 root@192.168.1.8 "luna-send -n 1 luna://com.lennylxx.iptv.service/start '{}'"
```
*Resultado esperado (Demostración Fail-Closed):*
```json
{
    "returnValue": false,
    "errorCode": -1,
    "errorText": "Unauthorized"
}
```
*Esto confirma que el servicio rechaza invocaciones que no provengan del contenedor autenticado de la aplicación.*

### Prueba 3: Verificación de Salud del Servidor HTTP LAN
Desde una terminal del PC en la misma red local:
```bash
# Consulta al endpoint /info (sustituir <puerto> por el puerto activo obtenido en el log)
curl -i http://192.168.1.8:<puerto>/info
```
*Resultado esperado:*
* HTTP `200 OK`
* JSON contiene `{ "returnValue": true, "running": true, "port": <puerto>, "ip": "192.168.1.8" }`.
* **`appToken` NO debe estar presente en la respuesta.**

---

## 4. Procedimiento de Recuperación y Rollback

Si surge alguna anomalía imprevista durante la ejecución en hardware real:

### Desinstalación Inmediata
```bash
# Desinstalar la aplicación y su servicio
ares-install --device tv --remove com.lennylxx.iptv
```

### Reversión al Paquete Anterior
Para reinstalar el paquete estable previo de Misión 1B.2 o 1B.1:
```bash
ares-install --device tv AUDIT_REPORTS/MISSION_1B2/package/com.lennylxx.iptv_1.17.0_all.ipk
ares-launch --device tv --close com.lennylxx.iptv
ares-launch --device tv com.lennylxx.iptv
```

