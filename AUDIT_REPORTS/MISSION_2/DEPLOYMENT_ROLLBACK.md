# PROCEDIMIENTO DE ROLLBACK Y DESINSTALACIÓN CONTROLADA
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Misión:** Misión 2 — Despliegue y Validación en Hardware Real

---

## 1. Alcance y Seguridad del Procedimiento

Este procedimiento documenta las instrucciones exactas para desinstalar de forma limpia y reversible `webOS IPTV Player v1.17.0` y su servicio Node.js sin alterar las configuraciones del televisor, sin tocar particiones de sistema y sin afectar a otras aplicaciones instaladas en `/media/developer/apps/` (tales como RetroArch, Homebrew Channel o YouTube AdFree).

---

## 2. Procedimiento de Desinstalación Oficial por LS2

### Paso 1: Cierre de Procesos Activos
Ejecutar desde la consola de administración del televisor:
```bash
luna-send -n 1 luna://com.webos.applicationManager/closeByAppId '{"id":"com.lennylxx.iptv"}'
```
* **Efecto:** Envía la señal de cierre ordenado al proceso renderer de Chromium 53 y al servicio complementario en Node.js 0.12.2.

### Paso 2: Desinstalación del Paquete
Ejecutar la desinstalación mediante el servicio oficial del sistema operativo:
```bash
luna-send -i -f luna://com.webos.appInstallService/dev/remove '{"id":"com.lennylxx.iptv"}'
```
* **Efecto:**
  1. Desregistra la aplicación en el System Application Manager (SAM).
  2. Desregistra el servicio en el bus Luna (LS2).
  3. Elimina de forma segura los directorios `/media/developer/apps/usr/palm/applications/com.lennylxx.iptv/` y `/media/developer/apps/usr/palm/services/com.lennylxx.iptv.service/`.
  4. Retira el icono y lanzador de la barra de aplicaciones de webOS.

### Paso 3: Limpieza de Archivos Temporales de Diagnóstico
```bash
rm -rf /tmp/iptv-audit-m2/
```
* **Efecto:** Elimina los registros de instalación, scripts de prueba y capturas intermedias almacenadas en la memoria temporal `tmpfs`.

---

## 3. Verificación Post-Desinstalación

Para verificar que el sistema ha retornado al estado exacto previo al despliegue, comprobar:

```bash
# 1. Comprobar ausencia de la aplicación
ls -ld /media/developer/apps/usr/palm/applications/com.lennylxx.iptv
# Resultado esperado: No such file or directory

# 2. Comprobar ausencia del servicio
ls -ld /media/developer/apps/usr/palm/services/com.lennylxx.iptv.service
# Resultado esperado: No such file or directory

# 3. Comprobar que no hay procesos huérfanos
ps aux | grep -E "com.lennylxx.iptv" | grep -v grep
# Resultado esperado: (Sin salida)
```

---

## 4. Reinstalación en Caso Necesario

Si se requiere volver a desplegar la aplicación:
1. Copiar el archivo IPK validado (`com.lennylxx.iptv_1.17.0_all.ipk`) a `/tmp/`.
2. Ejecutar la llamada de instalación:
   ```bash
   luna-send -i -f luna://com.webos.appInstallService/dev/install '{"id":"com.lennylxx.iptv","ipkUrl":"/tmp/com.lennylxx.iptv_1.17.0_all.ipk","subscribe":true}'
   ```

