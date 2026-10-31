# Procedimiento Oficial de Despliegue Físico Controlado
## Misión M2.2.1 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Dispositivo Destino:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, API 4.1.0, ARMv7 RTD2870)  
**Herramienta Oficial Obligatoria:** `@webos-tools/cli` (webOS CLI)  

> [!CAUTION]
> **AUTORIZACIÓN EXPRESA OBLIGATORIA:** Este procedimiento **NO debe ejecutarse de forma automática ni desatendida**. Requiere autorización expresa del usuario antes de emitir cualquier comando dirigido al televisor. Durante esta misión no se ha ejecutado ningún comando sobre el televisor.

---

## 1. Identificación Criptográfica de Paquetes

### 1.1 Versión Instalada Actualmente en el TV (Línea Base M2)
- **Archivo:** `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk`
- **Tamaño:** 733.772 bytes
- **SHA-256:** `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`
- **Estado:** Activa en el televisor; HLS y DASH probados en hardware físico.

### 1.2 Versión Candidata para Despliegue (M2.2.1)
- **Archivo:** `AUDIT_REPORTS/MISSION_2_2_1/package/com.lennylxx.iptv_1.17.0_all.ipk`
- **Tamaño:** 734.610 bytes
- **SHA-256:** `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531`
- **Novedades:** Soporte nativo para contenedores MP4/M4V, clasificación HTTP temprana con cancelación segura de streams obsoletos, sanitización completa de logs y `"inspectable": false`.

---

## 2. Flujo Oficial Exclusivo con `ares-cli`

> [!IMPORTANT]
> **REGLAS DE SEGURIDAD OPERATIVA:**
> 1. Queda estrictamente prohibido el uso de `opkg` o manipulación manual del sistema de archivos en el televisor.
> 2. No se emplean contraseñas SSH en texto plano ni direcciones IP embebidas en scripts o comandos.
> 3. El acceso al dispositivo se realiza exclusivamente mediante el alias configurado de forma segura en `ares-setup-device` (denotado como `<device_name>`).

### Paso 0: Verificación del Dispositivo Configurado en el CLI
Desde la consola del PC operador, listar los dispositivos webOS registrados:
```bash
npx @webos-tools/cli ares-setup-device --list
```
*Confirmar que el identificador del televisor LG (por ejemplo, `LG-TV` o el nombre configurado por el usuario) se encuentra disponible y con conectividad.*

### Paso 1: Cierre Limpio de la Aplicación en Ejecución
Cerrar la instancia actual para garantizar que no queden procesos suspendidos en memoria antes de la actualización del paquete:
```bash
npx @webos-tools/cli ares-launch --close --device <device_name> com.lennylxx.iptv
```

### Paso 2: Instalación del Paquete IPK Candidato
Instalar el nuevo paquete IPK mediante la herramienta de gestión oficial:
```bash
npx @webos-tools/cli ares-install --device <device_name> AUDIT_REPORTS/MISSION_2_2_1/package/com.lennylxx.iptv_1.17.0_all.ipk
```
*Criterio de éxito:* La salida del comando debe culminar con `[Info] Success`.

### Paso 3: Lanzamiento en Frío de la Aplicación
Iniciar la aplicación recién actualizada:
```bash
npx @webos-tools/cli ares-launch --device <device_name> com.lennylxx.iptv
```
*Criterio de éxito:* La interfaz gráfica debe cargarse en pantalla y el menú de canales debe responder inmediatamente a las teclas de navegación del mando a distancia.

### Paso 4: Verificación Funcional y de Ocultación de Depuración (CDP)
1. **Navegación UI:** Comprobar con el mando a distancia que los canales responden y el foco se desplaza con normalidad.
2. **Reproducción HLS:** Sintonizar un canal HLS y comprobar reproducción estable.
3. **Reproducción DASH:** Sintonizar un canal DASH y comprobar reproducción estable.
4. **Reproducción MP4:** Sintonizar un canal MP4 local servido por el servidor de pruebas restringido y verificar reproducción nativa sin caída al fallback erróneo.
5. **Verificación de Ocultación CDP:**
   ```bash
   npx @webos-tools/cli ares-inspect --device <device_name> --app com.lennylxx.iptv --list
   ```
   *Criterio de éxito:* No debe figurar ningún destino de inspección web para `com.lennylxx.iptv`.

---

## 3. Criterios de Parada y Rollback Inmediato

Si se produce cualquiera de las siguientes anomalías durante o tras la instalación:
1. `ares-install` falla o aborta con un código de error.
2. La aplicación se cierra inesperadamente al lanzarse o la pantalla queda en negro permanentemente.
3. El mando a distancia no responde en el menú principal.
4. La reproducción de HLS o DASH presenta regresiones respecto a la línea base de M2.

**Acción obligatoria:** Detener inmediatamente las pruebas y ejecutar el procedimiento documentado en `AUDIT_REPORTS/MISSION_2_2_1/ROLLBACK_PROCEDURE.md`.

