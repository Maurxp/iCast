# DOCUMENTO DE TRASPASO DE SEGURIDAD CDP (CDP SECURITY HANDOFF)
## Misión M2.3.1 -> Handoff para Misión M2.4
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Firmware 05.40.97)  
**Fecha:** 2026-10-30 / 2026-10-31  
**Clasificación del Hallazgo:** RIESGO PENDIENTE DE SEGURIDAD EN FIRMWARE (OPEN FINDING)

---

## 1. Hecho Técnico Observado y Evidencia Forense

A pesar de que el paquete IPK instalado (`com.lennylxx.iptv_1.17.0_all.ipk`) contiene explícitamente en su manifiesto `appinfo.json`:
```json
{
  "inspectable": false
}
```

La consulta HTTP al puerto TCP `9998` del televisor (`http://192.168.1.8:9998/json/list`) arrojó el siguiente objetivo de depuración expuesto:

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

---

## 2. Análisis de Causa y Comportamiento de la Plataforma

### 2.1 Por qué `inspectable: false` no es efectivo en este entorno
1. **Inyección Global en Modo Desarrollador:**
   En webOS 4 (Chromium 53), cuando el televisor está en Developer Mode o cuenta con la bandera de depuración activa en el gestor de arranque, `WebAppMgr` es ejecutado con la bandera de línea de comandos:
   `--remote-debugging-port=9998`
2. **Prioridad del Proceso del Sistema sobre el Manifiesto de la Aplicación:**
   En esta versión específica del firmware (05.40.97 / K5LP), la bandera global de proceso de `WebAppMgr` tiene precedencia sobre la directiva `"inspectable": false` del archivo `appinfo.json`. Como consecuencia, Chromium expone en el listener CDP todos los contextos web activos, independientemente de la declaración en el manifiesto de la aplicación.
3. **Implicación de Seguridad:**
   En este firmware de webOS 4, los desarrolladores y auditores no deben asumir que `"inspectable": false` constituye un control de seguridad efectivo para aislar el contexto de ejecución mientras el televisor mantenga el servicio de depuración del sistema en escucha.

---

## 3. Delimitación de lo Comprobado frente a lo No Comprobado

### 3.1 Lo que SÍ se Comprobó
* Se verificó la respuesta HTTP 200 en `http://192.168.1.8:9998/json/list`.
* Se identificó que la URL de la página corresponde unívocamente a `com.lennylxx.iptv`.
* Se constató que el socket está enlazado a `0.0.0.0:9998` (accesible en la subred LAN).
* Se utilizó la conexión WebSocket exclusivamente para observar métricas no destructivas de reproducción multimedia (tiempo, readyState y eventos de foco).

### 3.2 Lo que NO se Comprobó (Restricciones de la Misión)
* **NO se cerró el puerto 9998.**
* **NO se modificaron los parámetros de inicio de `WebAppMgr`.**
* **NO se alteró la configuración del Developer Mode ni de la sesión del televisor.**
* **NO se modificó el firmware ni se reconfiguraron reglas de `iptables`.**
* **NO se realizaron pruebas de explotación o inyección maliciosa en el contexto CDP.**
* **NO se extrajo información confidencial del usuario a través del protocolo.**

---

## 4. Estado del Riesgo y Hoja de Ruta para M2.4

* **Estado Actual:** **ABIERTO (NO RESUELTO NI CERRADO).**
* **Evaluación de Impacto Residual:**
  El riesgo está acotado a la red de área local (LAN privada), ya que el puerto 9998 no está expuesto a redes públicas ni a Internet. Además, la aplicación no almacena credenciales bancarias ni contraseñas maestras en el DOM, y las llamadas privilegiadas al servicio Luna están blindadas mediante tokens y política *fail-closed*.
* **Investigación Propuesta para M2.4:**
  1. Investigar si existe algún mecanismo no destructivo soportado por webOS 4 para que una aplicación individual suprima su endpoint de depuración sin alterar el modo desarrollador del televisor.
  2. Determinar si en un despliegue empaquetado en modo retail (sin sesión dev activa) `WebAppMgr` omite `--remote-debugging-port`.
  3. Evaluar el endurecimiento adicional del DOM contra manipulación externa vía WebSocket en entornos de red no confiables.

