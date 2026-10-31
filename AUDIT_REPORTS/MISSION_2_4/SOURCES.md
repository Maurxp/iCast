# FUENTES CONSULTADAS Y BIBLIOGRAFÍA TÉCNICA (SOURCES)
## Misión M2.4 — webOS IPTV Player v1.17.0
**Fecha:** 2026-10-31  

---

## 1. Documentación Oficial de LG webOS Developer Portal

1. **LG webOS TV Developer — Web App Configuration (`appinfo.json`)**
   * **URL:** `https://webostv.developer.lge.com/develop/specifications/appinfo-json`
   * **Alcance:** Definición del esquema del manifiesto de aplicaciones webOS, estructura de propiedades obligatorias y opcionales.
   * **Cita Relevante:** Describe las propiedades estándar reconocidas por el empaquetador `ares-package` y el ciclo de vida de la aplicación.
   * **Nivel de Confianza:** MUY ALTO (Documentación Oficial del Fabricante).

2. **LG webOS TV Developer — Using the Web Inspector (`ares-inspect`)**
   * **URL:** `https://webostv.developer.lge.com/develop/tools/cli-dev-tools#ares-inspect`
   * **Alcance:** Operación del comando `ares-inspect`, conexión hacia el puerto de depuración del televisor y generación de URLs `chrome-devtools://`.
   * **Cita Relevante:** Confirma que el depurador web establece la conexión con el motor web del dispositivo para aplicaciones en ejecución bajo modo desarrollador.
   * **Nivel de Confianza:** MUY ALTO.

3. **LG webOS TV Developer — Developer Mode App Guide**
   * **URL:** `https://webostv.developer.lge.com/develop/tools/developer-mode-app`
   * **Alcance:** Requisitos de autenticación de cuenta LG, temporizador de sesión con cuenta regresiva, habilitación del servidor SSH y montaje de `/media/developer`.
   * **Cita Relevante:** Establece que Developer Mode es un estado temporal y transitorio destinado exclusivamente a propósitos de prueba en hardware comercial.
   * **Nivel de Confianza:** MUY ALTO.

---

## 2. Documentación y Repositorios de webOS Open Source Edition (webOS OSE)

4. **webOS OSE Architecture — Web App Manager (WAM)**
   * **URL:** `https://www.webosose.org/docs/guides/architecture/components/wam/`
   * **Alcance:** Arquitectura interna del gestor de aplicaciones web, ciclo de vida de procesos `wam`, integración con el compositor LSM y Chromium.
   * **Cita Relevante:** WAM actúa como el contenedor principal de Chromium encargado de instanciar WebContents para las aplicaciones webOS.
   * **Nivel de Confianza:** MUY ALTO.

5. **webOS OSE Repository — `webosose/ares-cli`**
   * **URL:** `https://github.com/webosose/ares-cli`
   * **Alcance:** Implementación en Node.js de la suite CLI oficial (`ares-package`, `ares-install`, `ares-inspect`).
   * **Cita Relevante:** Contiene la lógica de reenvío de puertos mediante novacom hacia el puerto TCP 9998 del dispositivo remoto.
   * **Nivel de Confianza:** ALTO.

---

## 3. Especificación de Chromium y Chrome DevTools Protocol (CDP)

6. **Chromium Project — Chrome DevTools Protocol Specification (v1.2)**
   * **URL:** `https://chromedevtools.github.io/devtools-protocol/1-2/`
   * **Alcance:** Especificación formal de los dominios `Runtime`, `DOM`, `Page`, `Network` y `CSS` soportados en Chromium 53.
   * **Cita Relevante:** Describe el esquema de comunicación JSON-RPC 2.0 a través de conexiones WebSocket y la estructura del endpoint de descubrimiento `/json/list`.
   * **Nivel de Confianza:** MUY ALTO (Estándar de la Industria).

7. **Chromium Source Code — `content/browser/devtools/devtools_http_handler.cc`**
   * **Referencia:** Chromium Branch 53.0.2785.34 (2016)
   * **Alcance:** Manejador C++ responsable de inicializar el servidor HTTP TCP cuando se suministra el argumento `--remote-debugging-port`.
   * **Cita Relevante:** `DevToolsHttpHandler::DevToolsHttpHandler(...)` crea el socket de escucha en el hilo de E/S y enlaza automáticamente a `INADDR_ANY` (`0.0.0.0`) a menos que se restrinja expresamente en compilación.
   * **Nivel de Confianza:** MUY ALTO.

---

## 4. Documentación Técnica de la Comunidad webOSbrew

8. **webOS Homebrew Project — Application Manifest Reference**
   * **URL:** `https://webosbrew.org/pages/appinfo.html`
   * **Alcance:** Análisis comparativo de la directiva `inspectable` en hardware comercial con webOS 1 a 6+.
   * **Cita Relevante:** *"inspectable: Default: true for Developer Mode apps; false otherwise. Non-system applications connect on port 9998... Apps installed from official Content Store (/media/cryptofs) are not inspectable by default."*
   * **Nivel de Confianza:** ALTO (Verificado empíricamente por la comunidad de ingeniería inversa).

---

## 5. Evidencias Forenses Propias del Proyecto (Hardware LG 65UM7400PDA)

9. **Registro de Procesos en Hardware (Misión M2.3 / M2.3.1)**
   * **Archivo:** `AUDIT_REPORTS/MISSION_2_3/RUNTIME_VALIDATION.md`
   * **Evidencia:** Registro del comando en ejecución:
     `/usr/bin/WebAppMgr --remote-debugging-port=9998 ...` (PID 5675, UID `wam`).
   * **Nivel de Certeza:** EMPÍRICO 100% COMPROBADO EN HARDWARE.

10. **Respuesta Forense de Red en Puerto 9998 (Misión M2.3 / M2.3.1)**
    * **Archivos:** `AUDIT_REPORTS/MISSION_2_3/CDP_RUNTIME_STATUS.md` y `AUDIT_REPORTS/MISSION_2_3_1/CDP_SECURITY_HANDOFF.md`
    * **Evidencia:** Captura íntegra de la respuesta JSON HTTP 200 en `http://192.168.1.8:9998/json/list` exponiendo `com.lennylxx.iptv` a pesar de tener `"inspectable": false` en su manifiesto.
    * **Nivel de Certeza:** EMPÍRICO 100% COMPROBADO EN HARDWARE.

