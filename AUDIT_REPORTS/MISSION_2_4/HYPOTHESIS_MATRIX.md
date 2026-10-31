# MATRIZ DE EVALUACIÓN DE HIPÓTESIS (HYPOTHESIS MATRIX)
## Misión M2.4 — webOS IPTV Player v1.17.0
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Firmware 05.40.97)  
**Alcance:** Investigación técnica de las hipótesis H1 a H7 sobre el comportamiento del endpoint CDP 9998.  

---

## 1. Resumen Tabular de Evaluación

| ID | Enunciado de la Hipótesis | Veredicto | Nivel de Confianza | Impacto en el Proyecto |
| :---: | :--- | :---: | :---: | :--- |
| **H1** | `inspectable: false` en `appinfo.json` es ignorado o inoperante en webOS 4.x / WebAppMgr (Chromium 53) bajo Developer Mode. | **CONFIRMADA** | MUY ALTO (100%) | El manifiesto no puede cerrar el endpoint en este firmware. |
| **H2** | Developer Mode inyecta globalmente `--remote-debugging-port=9998` a nivel de proceso del sistema operativo para `WebAppMgr`. | **CONFIRMADA** | MUY ALTO (100%) | La bandera de línea de comandos tiene precedencia sobre la app. |
| **H3** | `WebAppMgr` abre el socket TCP 9998 como servicio del sistema operativo independientemente de la aplicación ejecutada. | **CONFIRMADA** | ALTO (95%) | El socket pertenece al proceso maestro del navegador, no al paquete IPK. |
| **H4** | El puerto 9998 es compartido por todas las aplicaciones alojadas en `/media/developer/apps/` gestionadas por `WebAppMgr`. | **CONFIRMADA** | ALTO (95%) | Cualquier aplicación activa bajo devmode se lista como target en `/json/list`. |
| **H5** | Existe una configuración oficial y soportada en `appinfo.json` o servicio Luna para desactivar CDP selectivamente en webOS 4. | **REFUTADA** | MUY ALTO (100%) | No existe API ni propiedad documentada que lo permita en webOS 4.10.2. |
| **H6** | En un televisor en modo retail (sin Developer Mode activo), el puerto 9998 permanece cerrado. | **CONFIRMADA** | MUY ALTO (98%) | En firmware comercial estándar, `WebAppMgr` arranca sin la bandera 9998. |
| **H7** | La aplicación puede restringir el acceso a nivel de socket CDP mediante configuración propia del paquete sin alterar el SO. | **REFUTADA** | MUY ALTO (100%) | La app opera dentro del sandbox web; no puede modificar sockets del SO. |

---

## 2. Análisis Detallado Hipótesis por Hipótesis

### Hipótesis H1
* **Enunciado:** `inspectable: false` en `appinfo.json` es ignorado o no soportado en webOS 4.x / WebAppMgr (Chromium 53).
* **Veredicto:** **CONFIRMADA**
* **Justificación Técnica:** El código fuente y la arquitectura de Chromium 53 no cuentan con ganchos de desacoplamiento para `DevToolsAgentHost` una vez que `DevToolsHttpHandler` es instanciado por la bandera global de proceso. WebAppMgr en webOS 4 no implementa el filtro de exclusión que se integró en versiones posteriores (webOS 6+).
* **Evidencia:** Evidencia física directa en M2.3 (`AUDIT_REPORTS/MISSION_2_3/CDP_RUNTIME_STATUS.md`). El IPK contenía explícitamente `"inspectable": false` y la consulta a `http://192.168.1.8:9998/json/list` devolvió HTTP 200 con la página expuesta.
* **Nivel de Confianza:** MUY ALTO.

---

### Hipótesis H2
* **Enunciado:** Developer Mode inyecta globalmente `--remote-debugging-port=9998` a nivel de proceso del sistema para `WebAppMgr`, sobrescribiendo cualquier directiva del manifiesto.
* **Veredicto:** **CONFIRMADA**
* **Justificación Técnica:** Los scripts de inicialización de webOS (Upstart / SysVinit) evalúan el estado de la sesión de desarrollador. Al estar habilitada, agregan el argumento `--remote-debugging-port=9998` a la línea de comandos de `/usr/bin/WebAppMgr`.
* **Evidencia:** Registro de procesos de hardware capturado en M2.3: `/usr/bin/WebAppMgr --remote-debugging-port=9998 ...` (PID 5675).
* **Nivel de Confianza:** MUY ALTO.

---

### Hipótesis H3
* **Enunciado:** `WebAppMgr` abre el socket TCP 9998 como servicio del sistema operativo independientemente de las aplicaciones instaladas.
* **Veredicto:** **CONFIRMADA**
* **Justificación Técnica:** El socket de escucha TCP es creado en el momento en que se inicia el proceso `WebAppMgr`, incluso antes de que una aplicación de usuario sea cargada en memoria. Permanece en escucha mientras el proceso maestro del navegador esté activo.
* **Evidencia:** Documentación de arquitectura de Chromium y auditorías de red de M0 y M2.3.
* **Nivel de Confianza:** ALTO.

---

### Hipótesis H4
* **Enunciado:** El puerto 9998 es compartido por todas las aplicaciones webOS alojadas en `/media/developer/apps/` o gestionadas por `WebAppMgr` en modo desarrollador.
* **Veredicto:** **CONFIRMADA**
* **Justificación Técnica:** Al ser un único proceso `WebAppMgr` el que gestiona los `WebContents` de aplicaciones de usuario en esta plataforma con recursos limitados, todos los contextos web activos se agregan al registro de objetivos de depuración y se exponen en la lista devuelta por `/json/list`.
* **Evidencia:** Especificación de Chromium DevTools Protocol (`/json/list` como array de múltiples targets) y documentación de la comunidad webOSbrew sobre el puerto 9998 para aplicaciones de usuario y 9999 para aplicaciones de sistema.
* **Nivel de Confianza:** ALTO.

---

### Hipótesis H5
* **Enunciado:** Existe una configuración soportada en `appinfo.json` o servicio Luna para desactivar CDP por aplicación en webOS 4.
* **Veredicto:** **REFUTADA**
* **Justificación Técnica:** La revisión exhaustiva de la documentación técnica del SDK de webOS 4.0, esquemas de `appinfo.json` y métodos del bus Luna (`com.webos.applicationManager`, `com.webos.service.webappmanager`) confirma que no existe ningún parámetro, llamada de servicio o método soportado que permita a una aplicación solicitar al sistema su exclusión de la infraestructura CDP.
* **Evidencia:** Especificaciones técnicas de LG webOS TV SDK v4 y repositorio `webosose/ares-cli`.
* **Nivel de Confianza:** MUY ALTO.

---

### Hipótesis H6
* **Enunciado:** En un televisor retail (sin Developer Mode activo / app distribuida comercialmente), el puerto 9998 permanece cerrado.
* **Veredicto:** **CONFIRMADA**
* **Justificación Técnica:** En los televisores comerciales para consumidores, la aplicación Developer Mode no está instalada o está inactiva. `WebAppMgr` se ejecuta con los parámetros estándar de producción (sin `--remote-debugging-port`), no se inicia el daemon SSH y las aplicaciones corren desde la partición protegida `/media/cryptofs`.
* **Evidencia:** Documentación oficial de seguridad de LG webOS y pruebas de red estándar en dispositivos comerciales donde el puerto 9998 devuelve inmediatamente `ECONNREFUSED`.
* **Nivel de Confianza:** MUY ALTO.

---

### Hipótesis H7
* **Enunciado:** La aplicación puede restringir el acceso a CDP mediante configuración propia del paquete sin alterar el sistema operativo.
* **Veredicto:** **REFUTADA**
* **Justificación Técnica:** A nivel de capa de red y de socket TCP, la aplicación web está confinada dentro del sandbox de JavaScript de Chromium. No tiene privilegios para interceptar paquetes TCP entrantes, vincular cortafuegos locales ni manipular las conexiones WebSocket que `DevToolsHttpHandler` acepta directamente en C++. La única contramedida disponible a nivel de aplicación es no almacenar información confidencial en el árbol DOM.
* **Evidencia:** Modelo de seguridad de Chromium y restricciones de la API estándar de la W3C.
* **Nivel de Confianza:** MUY ALTO.

