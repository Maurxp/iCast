# Procedimiento Oficial de Rollback a Versión M2
## Misión M2.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha de Revisión:** 30 de Octubre de 2026 (M2.2.1 Deployment Safety Closure)  
**Paquete de Retorno Seguro:** `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk`  
**Herramienta Oficial Exclusiva:** `@webos-tools/cli` (`ares-install`, `ares-launch`)  

> [!CAUTION]
> **AUTORIZACIÓN REQUERIDA:** La ejecución de este rollback requiere confirmación y autorización expresa del usuario. No se ejecuta ningún comando de forma desatendida ni sin supervisión.

---

## 1. Justificación y Criterios de Activación del Rollback

El rollback se activará de inmediato si, tras un intento de despliegue en el televisor físico:
- Se produce una regresión funcional en la reproducción de canales HLS o DASH.
- Se producen bloqueos de la interfaz de usuario con el mando a distancia.
- El servicio Luna o la aplicación experimentan caídas o cierres inesperados.
- Se detecta cualquier comportamiento anómalo que comprometa la estabilidad del dispositivo.

---

## 2. Paquete de Respaldo Inmutable

El paquete de la versión anterior que cuenta con reproducción HLS y DASH 100% probada en el hardware real se encuentra resguardado localmente:
- **Ruta:** `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk`
- **Tamaño:** 733.772 bytes
- **SHA-256:** `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`

---

## 3. Flujo Oficial de Reversión Paso a Paso

> [!IMPORTANT]
> Se prohíbe el uso de comandos de bajo nivel como `opkg`, scripts SSH con contraseñas en texto plano o accesos directos al sistema de archivos del televisor. Se utiliza únicamente la interfaz de desarrollo oficial de webOS.

### Paso 1: Cierre de la Instancia Activa
```bash
npx @webos-tools/cli ares-launch --close --device <device_name> com.lennylxx.iptv
```

### Paso 2: Reinstalación del Paquete Aprobado de M2
Instalar el paquete inmutable de M2 para sobrescribir de forma limpia la aplicación:
```bash
npx @webos-tools/cli ares-install --device <device_name> AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk
```
*Criterio de éxito:* La salida del CLI debe indicar `Success`.

### Paso 3: Relanzamiento y Comprobación de Línea Base
Lanzar la aplicación para verificar el restablecimiento del estado operativo previo:
```bash
npx @webos-tools/cli ares-launch --device <device_name> com.lennylxx.iptv
```

### Paso 4: Verificación Funcional
1. Comprobar que el menú de canales carga normalmente.
2. Sintonizar el canal HLS (`test.m3u8`) y verificar reproducción fluida.
3. Sintonizar el canal DASH (`test.mpd`) y verificar reproducción fluida durante al menos 1 minuto.
4. Confirmar que la navegación con el mando a distancia responde inmediatamente.

El estado funcional previo queda totalmente restaurado de forma segura y controlada sin manipular particiones del firmware ni poner en riesgo la integridad del televisor.
