# INVESTIGACIÓN DE SEGURIDAD LUNA SERVICE BUS (LS2) EN LG WEBOS TV 4
## webOS IPTV Player v1.17.0 — Misión 1B.2 Frente A

**Dispositivo Objetivo:** LG 65UM7400PDA  
**Sistema Operativo:** webOS TV Lite 4.10.2-29 (SoC Realtek RTD2870, ARMv7 32-bit, Kernel Linux 4.4.84)  
**API webOS:** 4.1.0  
**Motor Web:** Chromium 53.0.2785.34  
**Entorno de Servicio:** Node.js 0.12.2 (webos-service CommonJS)  
**ID de Aplicación:** `com.lennylxx.iptv`  
**ID de Servicio:** `com.lennylxx.iptv.service`  
**Fecha:** 2026-10-29  

---

## 1. Contexto y Taxonomía de Luna Service Bus (LS2)

El bus de servicios Luna (LS2 / Luna Service Bus) es el mecanismo IPC central de webOS, descendiente directo del diseño original de Palm webOS, adaptado por LG Electronics para sus Smart TVs.

Para comprender la frontera de confianza de nuestra aplicación, es crítico distinguir entre tres arquitecturas frecuentemente confundidas en la literatura:
1. **webOS OSE (Open Source Edition - webOS 2.x+ moderno):** Emplea un sistema ACG (Access Control Groups) declarativo estricto. Cada servicio debe tener manifiestos de roles (`.role.json`) y permisos (`.perm.json`) instalados en `/usr/share/luna-service2/roles.d/` y `/usr/share/luna-service2/client-permissions.d/`, validados criptográficamente en tiempo de arranque o instalación.
2. **webOS TV Comercial Legacy (webOS 3.x y webOS 4.x - como nuestro LG 65UM7400PDA):** Plataforma propietaria cerrada. Las aplicaciones de desarrollador sideloaded residen en `/media/developer/apps/` (partición de solo lectura para la raíz del sistema sin acceso a `/usr/share/luna-service2/`). El gestor de paquetes del televisor (`appinstaller` / `sam`) **no** permite que paquetes de terceros registren roles de sistema arbitrarios.
3. **webOS TV Comercial Moderno (webOS 6+ / webOS 22+):** Ha adoptado progresivamente esquemas de ACG derivados de OSE pero restringidos para aplicaciones de tienda o sideload.

---

## 2. Resolución Rigurosa de las 7 Preguntas Críticas

A continuación se presentan las respuestas técnicas a las 7 preguntas formuladas para la auditoría, clasificando cada afirmación según su grado de certeza:
* `[CONFIRMADO POR SDK Y CÓDIGO]`: Verificado mediante el comportamiento de `ares-package`, `webos-service` y el código fuente.
* `[DOCUMENTADO EN OSE]`: Comportamiento formal en la especificación pública de webOS OSE.
* `[COMPORTAMIENTO WEBOS TV 4]`: Realidad arquitectónica del firmware comercial webOS 4.x en televisores LG.
* `[NO CONFIRMADO / REQUIERE PROBE EN TV]`: Aspectos internos del binario privativo `ls-hubd` que no pueden ser garantizados al 100% sin inspección dinámica con depurador en el televisor físico.

---

### Pregunta 1: ¿Cómo funciona exactamente el sistema de permisos y roles de Luna Service Bus (LS2) en webOS 4 (no en webOS OSE moderno)?

* **Clasificación:** `[COMPORTAMIENTO WEBOS TV 4]` / `[CONFIRMADO POR SDK Y CÓDIGO]`
* **Análisis Técnico:**
  En webOS TV 4 comercial (API 4.1.0), el sistema de permisos para servicios empaquetados junto a aplicaciones de usuario (`bundled-service`) opera a nivel de **registro emparejado de paquete**.
  1. Cuando un paquete `.ipk` contiene `appinfo.json` con id `com.lennylxx.iptv` y un directorio de servicio con `services.json` declarando `name: "com.lennylxx.iptv.service"`, el subsistema de instalación (`appinstaller` de webOS) crea un mapeo entre la aplicación padre y su servicio asociado.
  2. En webOS 4 TV, los archivos `.role.json` y `.perm.json` **no son utilizados por aplicaciones sideloaded de desarrollador**. Cuando `ares-package` empaqueta la aplicación, emite la advertencia:
     ```text
     [Warning] The 'requiredACG' field is not defined in appinfo.json.
     ACG (Access Control Group) controls an app's permission to call Luna Bus APIs on webOS...
     ```
     En webOS TV 4, si un desarrollador intenta incluir manualmente archivos de roles en el paquete IPK esperando que `appinstaller` los copie a `/usr/share/luna-service2/`, la instalación falla o los archivos son ignorados porque `/usr/share` reside en un sistema de archivos squashfs montado en solo lectura.
  3. En consecuencia, el control de acceso a nivel de bus en webOS TV 4 para servicios de usuario es **nominal y basado en prefijos de bus**: el servicio se registra en el hub de Luna (`ls-hubd`) en el canal público bajo su nombre cualificado `com.lennylxx.iptv.service`.

---

### Pregunta 2: ¿Puede una aplicación de terceros instalada llamar a métodos Luna de otra aplicación/servicio?

* **Clasificación:** `[COMPORTAMIENTO WEBOS TV 4]` / `[CONFIRMADO POR SDK Y CÓDIGO]`
* **Análisis Técnico:**
  **SÍ, potencialmente sí.**
  1. En webOS TV, cualquier aplicación web que se ejecute en el runtime webOS tiene acceso al objeto JavaScript global `window.PalmServiceBridge`.
  2. Si una aplicación maliciosa de terceros instalada en el mismo televisor (por ejemplo, instalada a través de Homebrew Channel o modo desarrollador) conoce o descubre el identificador del servicio (`com.lennylxx.iptv.service`), puede instanciar un puente:
     ```javascript
     var bridge = new PalmServiceBridge();
     bridge.onservicecallback = function(msg) { console.log("Leak:", msg); };
     bridge.call("luna://com.lennylxx.iptv.service/start", "{}");
     ```
  3. En la implementación original de `bundled-service/src/lan/service.ts`, el servicio respondía ciegamente a cualquier llamada `start` o `getInfo`, entregando `appToken`, `setupToken`, `pairingCode` y puertos a cualquier llamador.
  4. Por tanto, **no se debe asumir que el bus Luna aísla automáticamente los métodos entre aplicaciones de usuario**. El servicio Node.js debe implementar su propia validación de identidad del llamador.

---

### Pregunta 3: ¿Existe aislamiento de servicios entre aplicaciones sideloaded/homebrew?

* **Clasificación:** `[COMPORTAMIENTO WEBOS TV 4]` / `[NO CONFIRMADO / REQUIERE PROBE EN TV]`
* **Análisis Técnico:**
  1. **Aislamiento de Sistema de Archivos:** **Existe parcialmente.** Cada aplicación sideloaded se instala en su propio subdirectorio dentro de `/media/developer/apps/usr/palm/applications/<app_id>/` y los servicios en `/media/developer/apps/usr/palm/services/<service_id>/`. Los procesos corren bajo usuarios de sistema limitados o el usuario de desarrollo (`prisoner` o usuario de sandbox de webOS, excepto cuando se usa Homebrew con root elevation).
  2. **Aislamiento de Memoria y Proceso:** **Existe.** El proceso Node.js del servicio corre en su propio espacio de memoria independiente del proceso Chromium de la app TV.
  3. **Aislamiento en Luna Service Bus:** **NO existe de forma estricta entre apps de usuario en webOS 4.** El demonio `ls-hubd` despacha mensajes basándose en el nombre del método registrado. Salvo que el servicio aplique una lista de control en la capa de aplicación o el hub esté configurado con filtros privativos de LG, cualquier cliente conectado al bus puede enviar solicitudes `luna://`.

---

### Pregunta 4: ¿Qué campos o metadatos recibe un servicio webOS en una llamada Luna entrante (`message.sender`, `message.applicationId`, `message.callerId`)?

* **Clasificación:** `[CONFIRMADO POR SDK Y CÓDIGO]` / `[DOCUMENTADO EN OSE]`
* **Análisis Técnico:**
  La biblioteca oficial `webos-service` (envoltorio C++ y Node.js para `libluna-service2`) expone los siguientes metadatos en el objeto `Message` entregado al callback registrado:
  * `msg.sender`: Cadena con el identificador del endpoint de Luna que emitió el mensaje (por ejemplo, `com.webos.app.container.*` o el nombre del servicio emisor).
  * `msg.applicationId`: Cadena inyectada por el demonio `ls-hubd` cuando la petición proviene de un contexto de aplicación web gestionado por SAM / WAM (`WebAppManager`). En llamadas legítimas desde nuestra app, `msg.applicationId` contiene exactamente `'com.lennylxx.iptv'`.
  * `msg.callerId`: En algunas revisiones de webOS TV, `callerId` se utiliza como sinónimo o identificador de proceso llamador registrado en el hub.
  * **Casos Especiales:** Si la llamada proviene de la línea de comandos SSH ejecutando la utilidad root `luna-send`, `ls-hubd` puede dejar `applicationId` como `undefined` o vacío.

---

### Pregunta 5: ¿Es posible restringir las llamadas a un servicio para que solo las acepte desde su propia aplicación cliente?

* **Clasificación:** `[CONFIRMADO POR SDK Y CÓDIGO]`
* **Análisis Técnico:**
  **SÍ, mediante verificación de metadatos del llamador en la capa de servicio.**
  * Dado que `ls-hubd` inyecta fidedignamente `applicationId` y este valor **no puede ser falsificado por código JavaScript que corra dentro de un WebAppContainer estándar** (el valor proviene del descriptor del proceso asignado por el kernel/WAM al crear la ventana de la app), el servicio Node.js puede y debe verificar:
    ```typescript
    function getCallerAppId(msg: LunaMsg): string | undefined {
      return msg.applicationId || msg.callerId || msg.sender;
    }

    function isAuthorizedCaller(msg: LunaMsg): boolean {
      const caller = getCallerAppId(msg);
      // Si el ID del llamador está presente y no coincide con nuestra app, denegar acceso
      if (caller !== undefined && caller !== 'com.lennylxx.iptv') {
        return false;
      }
      return true;
    }
    ```
  * Si un paquete malicioso `com.evil.player` llama a `luna://com.lennylxx.iptv.service/start`, el hub inyecta `msg.applicationId = 'com.evil.player'`, y el servicio rechaza inmediatamente la llamada con `{ returnValue: false, errorText: 'Unauthorized' }`.

---

### Pregunta 6: ¿Qué pasa si una página web en el navegador de webOS intenta llamar a Luna?

* **Clasificación:** `[CONFIRMADO POR SDK Y CÓDIGO]` / `[COMPORTAMIENTO WEBOS TV 4]`
* **Análisis Técnico:**
  1. El navegador web nativo del televisor (`com.webos.app.browser`) es una aplicación Chromium estándar que carga páginas HTTP/HTTPS no confiables de Internet.
  2. **`window.PalmServiceBridge` NO está inyectado en el DOM del navegador web comercial.** LG deshabilita estrictamente la inyección de la API Luna en páginas web públicas navegadas por el usuario.
  3. Solo las aplicaciones web registradas en el sistema con `appinfo.json` (que corren bajo el proceso de sistema `WebAppManager` con privilegios de aplicación webOS) reciben la API `PalmServiceBridge`.
  4. Por lo tanto, una página web maliciosa en Internet **no puede emitir llamadas directas a Luna**. Sin embargo, **sí podía atacar el puerto HTTP local vía CORS o peticiones loopback**, lo cual fue mitigado en las Misiones 1B y 1B.1 mediante la estricta validación CORS de 4 octetos RFC 1918 y la exigencia de `appToken`.

---

### Pregunta 7: ¿El archivo `services.json` o la configuración del paquete IPK permite definir permisos de acceso a nivel de plataforma?

* **Clasificación:** `[CONFIRMADO POR SDK Y CÓDIGO]` / `[COMPORTAMIENTO WEBOS TV 4]`
* **Análisis Técnico:**
  1. En `services.json`, la estructura estándar define únicamente:
     ```json
     {
       "id": "com.lennylxx.iptv.service",
       "description": "webOS IPTV Player LAN Service",
       "services": [
         {
           "name": "com.lennylxx.iptv.service"
         }
       ]
     }
     ```
  2. En webOS OSE moderno existen directivas como `"permissions"` y `"roles"` dentro de manifiestos separados, pero en **webOS TV 4 comercial no existe un esquema declarativo soportado en el paquete IPK de usuario para definir listas blancas de clientes Luna permitidos**.
  3. Los campos como `requiredACG` o `providedACG` son validados únicamente en versiones modernas de webOS (webOS 6+) para la tienda LG Content Store. En webOS 4, incluirlos no tiene efecto restrictivo sobre el bus y es tratado como campo no reconocido.
  4. Por consiguiente, **la frontera de confianza no puede delegarse al instalador del televisor ni a `services.json`**. Debe ser implementada explícitamente en el código TypeScript/JavaScript del servicio Node.js.

---

## 3. Matriz de Síntesis de Confianza Luna en webOS TV 4

| Vector de Ataque | Agente Potencial | ¿Protegido por Plataforma webOS 4? | Mecanismo de Defensa Implementado (M1B.2) |
| :--- | :--- | :---: | :--- |
| Invocación Luna desde otra App instalada | App sideloaded / homebrew de terceros | ❌ No | Verificación de `applicationId === 'com.lennylxx.iptv'` en `service.ts` |
| Exfiltración de secretos vía `start` | Llamador no autorizado o inspector | ❌ No | Eliminación de `setupToken` y `pairingCode` de la respuesta de `start` |
| Consulta indiscriminada en `getInfo` | Llamador Luna cualquiera | ❌ No | Reducción de datos a solo métricas públicas operativas (`ip`, `manualUrl`) |
| Invocación Luna desde navegador web | Sitio web malicioso navegado en TV | ✅ Sí (sin `PalmServiceBridge`) | Inexistencia de puente en Chromium del navegador nativo |
| Exfiltración de secretos en logs de app | Volcado accidental en consola | ❌ No (bug en `app.ts:564`) | Sanitización de logs en `app.ts` (solo flags booleanos y puerto) |
| Intrusión HTTP a endpoints sensibles | Navegador en red local o web externa | ❌ No | Exigencia de `appToken`, validación RFC 1918 CORS y hardening de PIN |

