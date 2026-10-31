# Procedimiento Oficial de Rollback Inmediato a Versión M2
## Misión M2.2.1 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Paquete de Retorno Seguro:** `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk`  
**Herramienta Oficial Obligatoria:** `@webos-tools/cli` (`ares-install`, `ares-launch`)  

> [!CAUTION]
> **AUTORIZACIÓN REQUERIDA:** La ejecución de este rollback requiere confirmación y autorización expresa del usuario. No se ejecuta ningún comando de forma desatendida.

---

## 1. Justificación y Criterios de Activación

El procedimiento de reversión (*rollback*) se activará de forma inmediata si durante el despliegue del paquete M2.2.1 en el hardware físico se manifiesta cualquiera de los siguientes escenarios:
- Regresión en la reproducción de canales HLS o DASH (canales que ya estaban validados al 100% en la Misión M2).
- Bloqueo o falta de respuesta ante las teclas del mando a distancia en el menú principal.
- Errores de carga o reinicios continuos del proceso web o del servicio Luna en segundo plano.
- Cualquier degradación de la estabilidad o del rendimiento del televisor.

---

## 2. Paquete de Respaldo Inmutable

El paquete de la versión anterior que cuenta con reproducción HLS y DASH 100% probada en el hardware real se encuentra resguardado localmente:
- **Ruta:** `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk`
- **Tamaño:** 733.772 bytes
- **SHA-256:** `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`

---

## 3. Flujo Oficial de Reversión Paso a Paso

> [!IMPORTANT]
> Se prohíbe terminantemente el uso de `opkg`, scripts SSH con contraseñas en texto plano o modificaciones manuales en las particiones del televisor. Toda la operación se realiza a través de las herramientas oficiales de webOS CLI desde el PC operador.

### Paso 1: Cierre de la Aplicación en el Televisor
Cerrar la aplicación que se encuentre en ejecución para liberar los recursos del sistema:
```bash
npx @webos-tools/cli ares-launch --close --device <device_name> com.lennylxx.iptv
```

### Paso 2: Reinstalación del Paquete Aprobado de M2
Instalar el paquete inmutable de la Misión M2 para sobrescribir la instalación de forma limpia y controlada:
```bash
npx @webos-tools/cli ares-install --device <device_name> AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk
```
*Criterio de éxito:* La salida del comando debe culminar con `[Info] Success`.

### Paso 3: Relanzamiento en Frío
Iniciar la aplicación restaurada:
```bash
npx @webos-tools/cli ares-launch --device <device_name> com.lennylxx.iptv
```
*Criterio de éxito:* La pantalla principal debe mostrar la lista de canales de la versión base de M2.

### Paso 4: Verificación Funcional de Línea Base
1. Comprobar la respuesta del mando a distancia en la lista de canales.
2. Sintonizar el canal de prueba HLS (`test.m3u8`) y comprobar reproducción estable durante 1 minuto.
3. Sintonizar el canal de prueba DASH (`test.mpd`) y comprobar reproducción estable durante 1 minuto.
4. Presionar `Back` para volver al menú y verificar que el foco visual y la navegación permanecen activos.

Con este procedimiento, el televisor queda restaurado en el estado operacional de referencia en menos de 60 segundos, sin riesgos para el firmware ni alteraciones en particiones protegidas.

