# Estado Técnico y Arquitectura de Seguridad de CDP
## Misión M2.2.1 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Sistema:** webOS TV Lite 4.10.2-29 / Chromium 53.0.2785.34  
**Archivo Evaluado:** `appinfo.json` en paquete `com.lennylxx.iptv_1.17.0_all.ipk`  

---

## 1. Niveles de Realidad del Sistema y Desambiguación Técnica

Para evitar cualquier confusión técnica respecto a la seguridad de Chrome DevTools Protocol (CDP) en el televisor LG, este informe desglosa el estado del sistema en tres capas estrictamente diferenciadas:

```
+-----------------------------------------------------------------------------------+
| Capa 1: Configuración Verificada en el IPK                                       |
| - appinfo.json contiene explícitamente "inspectable": false                      |
| - Verificado en binario empaquetado (SHA-256: 9B4B02B6...)                       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| Capa 2: Comportamiento Esperado del SDK / WebAppMgr (Contrato de Plataforma)      |
| - WebAppMgr omite el contexto web de la app en http://<tv-ip>:9998/json/list      |
| - Se impide la conexión de sesiones remotas de DevTools a la aplicación          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| Capa 3: Estado de Verificación en Hardware Físico (Pendiente de Despliegue)      |
| - Confirmación empírica en el televisor tras despliegue autorizado               |
| - Comprobación con ares-inspect y consulta a /json/list                          |
+-----------------------------------------------------------------------------------+
```

---

## 2. Capa 1: Configuración Confirmada en el IPK

En el paquete candidato generado para despliegue:
- **Ruta:** `AUDIT_REPORTS/MISSION_2_2_1/package/com.lennylxx.iptv_1.17.0_all.ipk`
- **Hash SHA-256:** `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531`

Se extrajo e inspeccionó el archivo de manifiesto `appinfo.json` incluido en el paquete:
```json
{
  "id": "com.lennylxx.iptv",
  "version": "1.17.0",
  "vendor": "Lenny",
  "type": "web",
  "main": "index.html",
  "title": "IPTV Player",
  "icon": "icon.png",
  "largeIcon": "icon.png",
  "inspectable": false,
  "requiredPermissions": [
    "network"
  ]
}
```
**Hecho Comprobado:** La clave `"inspectable": false` está presente de forma inequívoca en los metadatos de la aplicación.

---

## 3. Capa 2: Comportamiento Esperado según el SDK webOS

De acuerdo con el esquema oficial de LG incluido en `@webos-tools/cli` (`files/schema/ApplicationDescription.schema`):
```json
"inspectable": {
  "type": "boolean",
  "default": false,
  "description": "This field is used to tell WAM if an application should be inspectable in DevMode, based on the app's install location (/media/developer) or the presence of an \"inspectable\" field (if true) in the app's appinfo.json file."
}
```

### Explicación del Mecanismo del Sistema Operativo:
1. **Comportamiento por defecto en DevMode:** Cuando una aplicación se instala en `/media/developer/apps/`, si el campo `"inspectable"` no está presente, `WebAppMgr` (el gestor de aplicaciones web de webOS) asume por defecto `inspectable: true` por tratarse de una ruta de desarrollo.
2. **Efecto de `"inspectable": false`:** Al definir explícitamente `"inspectable": false`, `WebAppMgr` recibe la instrucción directa de **no exponer el contexto de navegación de la aplicación en el catálogo de páginas depurables**. Como consecuencia, `com.lennylxx.iptv` no es listada como un target en la API de depuración de Chromium.

---

## 4. Aclaración Fundamental: El Socket Global del Sistema (Puerto 9998)

> [!IMPORTANT]
> **NO SE HA CERRADO NI SE DEBE CERRAR EL PUERTO 9998 DEL SISTEMA OPERATIVO:**
> - El socket `0.0.0.0:9998` es un listener global del sistema operativo abierto por el binario `WebAppMgr` durante el arranque de Linux cuando el televisor tiene habilitado el modo de desarrollo o Homebrew Channel (mediante el argumento de línea de comandos `--remote-debugging-port=9998`).
> - Este socket es compartido por todo el subsistema web del televisor.
> - **Una aplicación de usuario de webOS no tiene privilegios ni potestad técnica para cerrar sockets de demonios del sistema ni matar procesos del sistema operativo.** Intentar cerrar este socket requeriría modificar particiones protegidas del firmware (`rootfs`, `kernel`, `tvservice`), lo que violaría las directrices de seguridad y crearía un riesgo grave de inutilizar (*brickear*) el televisor.
> - La protección de nuestra aplicación consiste en **instruir a `WebAppMgr` para que omita nuestra aplicación del catálogo de depuración**, neutralizando la superficie de ataque hacia nuestro código, DOM y credenciales, sin interferir con el funcionamiento general del sistema operativo.

---

## 5. Capa 3: Estado de Verificación en Hardware (Pendiente)

Debido a que durante las misiones M2.2 y M2.2.1 no se ha ejecutado ningún comando sobre el televisor ni se ha desplegado el paquete sin autorización, la confirmación empírica en el hardware físico se encuentra formalmente **pendiente**.

Una vez que el usuario otorgue su autorización para desplegar el paquete, se realizarán las siguientes comprobaciones para validar en hardware el comportamiento esperado:
1. **Comprobación con webOS CLI:**
   ```bash
   npx @webos-tools/cli ares-inspect --device <device_name> --app com.lennylxx.iptv --list
   ```
   *Criterio de aprobación:* No debe mostrar ningún destino (*target*) de inspección para `com.lennylxx.iptv`.
2. **Comprobación directa del catálogo HTTP:**
   ```bash
   curl -s http://<tv-ip>:9998/json/list
   ```
   *Criterio de aprobación:* La respuesta JSON del puerto 9998 de `WebAppMgr` no debe contener ningún elemento con `"title": "IPTV Player"` ni `"url": "...com.lennylxx.iptv..."`.

