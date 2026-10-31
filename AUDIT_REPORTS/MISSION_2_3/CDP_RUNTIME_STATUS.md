# INFORME DE ESTADO Y SEGURIDAD DEL PUERTO CDP (CDP RUNTIME STATUS)
## Misión M2.3 — webOS IPTV Player v1.17.0
**Fecha:** 2026-10-30  
**Dispositivo:** LG 65UM7400PDA  
**Puerto Inspeccionado:** TCP 9998 (Chrome DevTools Protocol)  
**Estado:** IDENTIFICADO Y ANALIZADO (AUDITED)

---

## 1. Comprobación de Conectividad y Exposición

Se consultó el endpoint de descubrimiento HTTP del puerto 9998:
`http://192.168.1.8:9998/json/list`

### Respuesta Obtenida
```json
[
  {
    "description": "",
    "devtoolsFrontendUrl": "/devtools/inspector.html?ws=192.168.1.8:9998/devtools/page/8ffc34f8-2c53-4bd0-b0d0-62841e6d35c2",
    "id": "8ffc34f8-2c53-4bd0-b0d0-62841e6d35c2",
    "title": "webOS IPTV Player",
    "type": "page",
    "url": "file:///media/developer/apps/usr/palm/applications/com.lennylxx.iptv/index.html",
    "webSocketDebuggerUrl": "ws://192.168.1.8:9998/devtools/page/8ffc34f8-2c53-4bd0-b0d0-62841e6d35c2"
  }
]
```

* **Código de Estado HTTP:** `200 OK`
* **Proceso Responsable:** `/usr/bin/WebAppMgr --remote-debugging-port=9998 ...` (PID 5675)
* **Página Expuesta:** Exclusivamente la aplicación `com.lennylxx.iptv` montada desde `/media/developer/apps/usr/palm/applications/com.lennylxx.iptv/index.html`.

---

## 2. Análisis de Seguridad y Causa Raíz del Listener

1. **Configuración de Origen:**
   El parámetro `--remote-debugging-port=9998` es inyectado por el sistema operativo de webOS al arrancar `WebAppMgr` cuando el televisor está configurado en Developer Mode / modo de depuración oficial.
2. **Restricción de Modificación:**
   En cumplimiento riguroso de las directrices inmutables ("*No modificar la configuración del listener ni del sistema*"), no se modificó el script de inicio de `WebAppMgr` ni se alteraron las reglas de `iptables` del firmware de LG.
3. **Frontera de Red:**
   El puerto 9998 únicamente es accesible dentro del segmento LAN local (`192.168.1.0/24`). No está expuesto a Internet público.
4. **Riesgos Residuales y Mitigaciones:**
   * **Riesgo:** Un cliente en la misma red LAN privada podría conectarse al WebSocket de depuración e inspeccionar el DOM o emitir comandos de consola en la aplicación web mientras esta se encuentra en ejecución.
   * **Mitigación:** La aplicación no almacena credenciales de usuario ni claves maestras en el DOM. Las llamadas a los métodos protegidos del servicio Node.js en el bus Luna (`/lan/service`) cuentan con tokens de autenticación independientes y política *fail-closed*, por lo que el acceso a la consola del navegador no compromete el bus del sistema ni el servicio Node.js.
   * **Recomendación para Producción:** Al desactivar Developer Mode en los ajustes de webOS o en despliegues comerciales oficiales fuera de pruebas de laboratorio, `WebAppMgr` omite la bandera `--remote-debugging-port` cerrando automáticamente el puerto 9998.

