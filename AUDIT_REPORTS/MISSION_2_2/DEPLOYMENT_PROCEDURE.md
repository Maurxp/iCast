# Procedimiento Oficial de Despliegue Físico Controlado
## Misión M2.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha de Revisión:** 30 de Octubre de 2026 (M2.2.1 Deployment Safety Closure)  
**Objetivo:** Procedimiento exclusivo mediante herramientas oficiales webOS CLI para la instalación del paquete en el televisor físico  

> [!CAUTION]
> **AUTORIZACIÓN REQUERIDA:** Este procedimiento **NO debe ejecutarse de manera automática ni desatendida**. Requiere autorización expresa y confirmada del usuario antes de ejecutar cualquier comando dirigido al dispositivo. No se ha ejecutado ni se ejecutará ningún comando sobre el televisor durante las misiones de preparación.

---

## 1. Identificación de Paquetes y Verificación Criptográfica

### 1.1 Versión Instalada Actualmente en el TV (Línea Base M2)
- **Archivo de origen:** `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk`
- **Tamaño:** 733.772 bytes
- **SHA-256:** `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`
- **Estado en hardware:** En ejecución activa en el televisor, con reproducción HLS y DASH validadas operativas.

### 1.2 Versión Candidata para Despliegue (M2.2 / M2.2.1)
- **Archivo:** `AUDIT_REPORTS/MISSION_2_2_1/package/com.lennylxx.iptv_1.17.0_all.ipk`
- **Tamaño:** 734.610 bytes
- **SHA-256:** `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531`
- **Novedades técnicas:** Soporte nativo para contenedores MP4/M4V, clasificación HTTP temprana con cancelación segura de streams obsoletos, sanitización completa de registros en consola y configuración `"inspectable": false`.

---

## 2. Flujo Exclusivo con Herramientas Oficiales (`@webos-tools/cli`)

> [!IMPORTANT]
> **POLÍTICA DE SEGURIDAD ESTRICTA:**
> - Queda **terminantemente prohibido** el uso de `opkg` para la instalación de aplicaciones de usuario.
> - No se utilizan contraseñas SSH en texto plano ni direcciones IP fijas sin verificar.
> - La comunicación con el televisor se realiza exclusivamente a través del dispositivo configurado en `ares-setup-device`.

### Paso 0: Verificación del Dispositivo Configurado en el CLI
Comprobar los dispositivos registrados en el entorno del operador:
```bash
npx @webos-tools/cli ares-setup-device --list
```
*(Identificar el identificador asignado al televisor objetivo, denotado aquí como `<device_name>`)*.

### Paso 1: Cierre Limpio de la Aplicación en Ejecución
Cerrar la instancia actual para asegurar que no permanezcan contextos suspendidos en memoria antes de la actualización:
```bash
npx @webos-tools/cli ares-launch --close --device <device_name> com.lennylxx.iptv
```

### Paso 2: Instalación del Nuevo Paquete IPK
Instalar el paquete candidato mediante el gestor oficial de aplicaciones de webOS (`ares-install`):
```bash
npx @webos-tools/cli ares-install --device <device_name> AUDIT_REPORTS/MISSION_2_2_1/package/com.lennylxx.iptv_1.17.0_all.ipk
```
*Criterio de éxito:* La salida del comando debe reportar `Success`.

### Paso 3: Lanzamiento en Frío de la Aplicación
Iniciar la aplicación recién instalada:
```bash
npx @webos-tools/cli ares-launch --device <device_name> com.lennylxx.iptv
```
*Criterio de éxito:* La interfaz gráfica del reproductor debe desplegarse en pantalla y el menú de canales debe responder inmediatamente al mando a distancia.

### Paso 4: Comprobación de Ocultación de Depuración (CDP)
Intentar listar los destinos inspectables de la aplicación:
```bash
npx @webos-tools/cli ares-inspect --device <device_name> --app com.lennylxx.iptv --list
```
*Criterio de éxito:* No debe figurar ningún destino activo para `com.lennylxx.iptv`, confirmando que el entorno web de la aplicación no está expuesto a clientes de depuración remota.

---

## 3. Criterios de Parada y Rollback Inmediato

Detener el procedimiento y proceder inmediatamente al procedimiento de reversión documentado en `ROLLBACK_PROCEDURE.md` si se presenta cualquiera de las siguientes condiciones:
1. `ares-install` retorna un código de error o no completa la transferencia.
2. La aplicación entra en un bucle de cierre al iniciarse o la pantalla queda en negro tras el lanzamiento.
3. El servicio en segundo plano presenta inestabilidad o fallos continuos.
4. Se pierde la respuesta del mando a distancia en el menú principal.
