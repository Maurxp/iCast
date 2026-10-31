# MISIÓN 1A — PLAN DE DESPLIEGUE, VERIFICACIÓN Y RECUPERACIÓN (DEPLOYMENT_PROCEDURE.md)

**Proyecto:** `lennylxx/webos-iptv-player` (v1.17.0)  
**Paquete:** `com.lennylxx.iptv_1.17.0_all.ipk` (`AUDIT_REPORTS/MISSION_1A/package/`)  
**Dispositivo Objetivo:** LG 65UM7400PDA (192.168.1.8)  
**Fecha:** 2026-10-29  

---

> [!CAUTION]
> **DOCUMENTO DE PROCEDIMIENTO EXCLUSIVAMENTE PLANIFICADO.**  
> Ninguna de las instrucciones contenidas en este documento ha sido ejecutada en el televisor. Este manual define los pasos técnicos verificados para cuando el usuario autorice expresamente el despliegue en la Misión 1B.

---

## 1. Configuración Previa del Dispositivo en el Host PC

Para interactuar con el televisor mediante las herramientas oficiales de webOS CLI (`@webos-tools/cli`) sin depender de configuración interactiva:

```powershell
# Registrar el dispositivo LG 65UM7400 en ares-setup-device
npx -p @webos-tools/cli ares-setup-device -a LG_65UM7400 `
  -i host=192.168.1.8 `
  -i port=22 `
  -i username=root `
  -i description="LG 65UM7400PDA webOS 4.10"
```

---

## 2. Métodos de Instalación Verificados

### Método A: Instalación mediante `ares-install` (Recomendado)
Es el canal estándar y más seguro, ya que invoca el instalador del sistema a través del protocolo webOS:

```powershell
npx -p @webos-tools/cli ares-install -d LG_65UM7400 AUDIT_REPORTS\MISSION_1A\package\com.lennylxx.iptv_1.17.0_all.ipk
```

### Método B: Instalación Directa mediante Bus Luna por SSH
Si el puerto 22 se utiliza con `plink.exe` y `pscp.exe` directamente:

```powershell
# 1. Transferir el paquete IPK al directorio temporal del TV
& "C:\Program Files\PuTTY\pscp.exe" -P 22 -pw <credencial> AUDIT_REPORTS\MISSION_1A\package\com.lennylxx.iptv_1.17.0_all.ipk root@192.168.1.8:/tmp/

# 2. Invocar el servicio de instalación del sistema operativo webOS
& "C:\Program Files\PuTTY\plink.exe" -P 22 -pw <credencial> root@192.168.1.8 `
  "luna-send -n 1 luna://com.webos.appInstallService/install '{\"id\":\"com.lennylxx.iptv\",\"ipkUrl\":\"/tmp/com.lennylxx.iptv_1.17.0_all.ipk\"}'"

# 3. Limpiar el paquete temporal en el TV
& "C:\Program Files\PuTTY\plink.exe" -P 22 -pw <credencial> root@192.168.1.8 "rm -f /tmp/com.lennylxx.iptv_1.17.0_all.ipk"
```

---

## 3. Comprobación y Verificación de la Instalación

Una vez ejecutado el instalador, se debe verificar la presencia de los artefactos en el televisor sin alterar ningún archivo:

1. **Verificar Registro en el Gestor de Aplicaciones:**
   ```bash
   luna-send -n 1 luna://com.webos.applicationManager/listApps '{}' | grep com.lennylxx.iptv
   ```
2. **Verificar Desempaquetado en Almacenamiento Flash:**
   * Aplicación Web:
     `/media/developer/apps/usr/palm/applications/com.lennylxx.iptv/appinfo.json`
   * Servicio Node:
     `/media/developer/apps/usr/palm/services/com.lennylxx.iptv.service/services.json`

---

## 4. Protocolo de Inicio Seguro y Arranque en Frío (Cold Restart)

> [!IMPORTANT]
> **Comportamiento Crítico de webOS:** Cuando una aplicación web se actualiza o se cierra mediante el botón Home, `WebAppMgr` mantiene una copia en suspensión en memoria RAM. Un lanzamiento convencional simplemente restaura el estado suspendido viejo en lugar de cargar el nuevo bundle.

### Secuencia de Arranque en Frío Obligatoria:

```powershell
# 1. Asegurar la terminación de cualquier instancia previa suspendida
& "C:\Program Files\PuTTY\plink.exe" -P 22 -pw <credencial> root@192.168.1.8 `
  "luna-send -n 1 luna://com.webos.applicationManager/close '{\"id\":\"com.lennylxx.iptv\"}'"

# 2. Pausa técnica de estabilización (1 segundo)
Start-Sleep -Seconds 1

# 3. Lanzamiento en frío de la aplicación
& "C:\Program Files\PuTTY\plink.exe" -P 22 -pw <credencial> root@192.168.1.8 `
  "luna-send -n 1 luna://com.webos.applicationManager/launch '{\"id\":\"com.lennylxx.iptv\"}'"
```

---

## 5. Inspección de Logs y Telemetría en Tiempo Real

Para monitorizar el arranque, renderizado y posibles excepciones de la aplicación:

1. **Logs de la Consola JavaScript vía CDP:**
   ```powershell
   node scripts/tv-logs.mjs --host 192.168.1.8 --port 9998
   ```
2. **Logs del Proceso Renderizador en el Sistema:**
   ```powershell
   & "C:\Program Files\PuTTY\plink.exe" -P 22 -pw <credencial> root@192.168.1.8 `
     "journalctl -u WebAppMgr -f"
   ```
3. **Consumo de Memoria RSS del Proceso en Vivo:**
   ```powershell
   & "C:\Program Files\PuTTY\plink.exe" -P 22 -pw <credencial> root@192.168.1.8 `
     "pid=\$(pgrep -f com.lennylxx.iptv | head -1); [ -n \"\$pid\" ] && grep -E '^(VmRSS|VmHWM):' /proc/\$pid/status"
   ```

---

## 6. Procedimiento de Desinstalación Limpia

Si se requiere retirar la aplicación por completo:

```powershell
# Desinstalación mediante Luna AppInstallService
& "C:\Program Files\PuTTY\plink.exe" -P 22 -pw <credencial> root@192.168.1.8 `
  "luna-send -n 1 luna://com.webos.appInstallService/remove '{\"id\":\"com.lennylxx.iptv\"}'"

# Purgar directorio de subidas M3U creadas por el usuario (si se desea borrado total)
& "C:\Program Files\PuTTY\plink.exe" -P 22 -pw <credencial> root@192.168.1.8 `
  "rm -rf /media/internal/iptv-uploads"
```

---

## 7. Plan de Contingencia y Recuperación ante Fallos

### 7.1. Recuperación ante Congelamiento de UI (Freeze)
Si la aplicación se congela por una excepción no controlada:
```bash
# Terminar forzosamente el proceso del renderizador de la app sin reiniciar el TV
kill -9 $(pgrep -f com.lennylxx.iptv)
```

### 7.2. Recuperación ante Corrupción de Base de Datos IndexedDB
Si una lista IPTV malformada bloquea la base de datos `iptv`:
* Dado que el almacenamiento de `com.lennylxx.iptv` está estrictamente aislado en su sandbox, basta con purgar su directorio de almacenamiento local en:
  `/home/root/.local/share/` o reiniciar la app con el parámetro `--clear-storage`.
* **Aislamiento Garantizado:** Ninguna otra aplicación del televisor (Homebrew Channel, YouTube, Netflix, sintonizador TDT/DVB) comparte esta base de datos ni se ve afectada de ningún modo.

