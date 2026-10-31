# Endurecimiento de Seguridad CDP y Configuración de Producción
## Misión M2.2 — webOS IPTV Player (LG 65UM7400PDA / webOS 4.10.2)
**Fecha:** 30 de Octubre de 2026  
**Módulos Evaluados:** `appinfo.json`, `esbuild.config.mjs`, `@webos-tools/cli`  

---

## 1. Análisis del Esquema Oficial de webOS y la Propiedad `inspectable`

### 1.1 Hallazgo en el Esquema del SDK de LG
Al inspeccionar el archivo de esquema JSON oficial distribuido con `@webos-tools/cli`:
`files/schema/ApplicationDescription.schema`

Se confirmó la especificación exacta de la propiedad:
```json
"inspectable": {
  "type": "boolean",
  "default": false,
  "description": "This field is used to tell WAM if an application should be inspectable in DevMode, based on the app's install location (/media/developer) or the presence of an \"inspectable\" field (if true) in the app's appinfo.json file."
}
```

### 1.2 Interpretación de la Plataforma webOS
1. **Comportamiento por defecto en DevMode:**
   - Si una aplicación está instalada en `/media/developer/apps/` (directorio de Homebrew Channel y Developer Mode) y la propiedad `"inspectable"` no está definida, `WebAppMgr` (WAM) asume `inspectable: true` por ser una ruta de desarrollo.
2. **Efecto de `"inspectable": false`:**
   - La inclusión explícita de `"inspectable": false` en `appinfo.json` instruye a `WebAppMgr` a **no registrar el contexto web de la aplicación en el servidor interno de Chrome DevTools Protocol**.
   - Como resultado, el destino (*target*) de nuestra aplicación no aparece en `http://<tv-ip>:9998/json/list` y ningún cliente remoto puede acoplar una sesión de depuración WebSocket ni inyectar comandos JavaScript.

---

## 2. Diferenciación del Listener Global del Sistema (Puerto 9998)

Es fundamental distinguir dos conceptos independientes:
1. **El Listener Global `0.0.0.0:9998`:**
   - Es creado por el binario del sistema `WebAppMgr` cuando el televisor se inicia con el argumento `--remote-debugging-port=9998` (activado globalmente por la aplicación Homebrew Channel / DevMode de webOS).
   - Este listener es compartido por todo el sistema operativo del televisor. **Una aplicación de usuario individual no puede ni debe intentar cerrar o matar este listener**, ya que requeriría modificar particiones protegidas del firmware (`rootfs`, `kernel`, `tvservice`), violando las reglas de seguridad del hardware.
2. **La Exposición de Nuestra Aplicación:**
   - Al configurar `"inspectable": false` en nuestro `appinfo.json`, cerramos el vector de ataque hacia nuestra aplicación. Los atacantes en la LAN no podrán acceder al DOM de `com.lennylxx.iptv`, no podrán extraer listas de canales, ni interceptar credenciales Xtream o tokens de servicio.

---

## 3. Separación de Perfiles de Compilación

| Perfil | Destino | `"inspectable"` | Propósito |
| :--- | :--- | :---: | :--- |
| **Producción (Release)** | IPK oficial / GitHub Releases | **`false`** | Máxima seguridad en despliegues reales y redes LAN compartidas. |
| **Desarrollo / Auditoría** | Pruebas locales / Laboratorio | `true` (vía variable `APP_INSPECTABLE=true`) | Inspección remota de depuración y diagnósticos CDP. |

En el paquete generado para M2.2 (`AUDIT_REPORTS/MISSION_2_2/package/com.lennylxx.iptv_1.17.0_all.ipk`), se verificó mediante descompresión binaria que `usr/palm/applications/com.lennylxx.iptv/appinfo.json` contiene explícitamente:
```json
"inspectable": false
```

---

## 4. Auditoría de Sanitización de Logs

Se verificó el cumplimiento estricto de la política de registros en todo el código fuente:
- **URLs de Streaming:** Pasan invariablemente por `diagnosticStreamUrl(url)`, eliminando contraseñas, usuarios Xtream y parámetros como `token`, `key` o `auth`.
- **Luna Bus:** No se imprimen respuestas JSON completas ni tokens de emparejamiento.
- **Códigos PIN / Tokens de Sesión:** Cero exposición en logs de consola o trazas del sistema.

