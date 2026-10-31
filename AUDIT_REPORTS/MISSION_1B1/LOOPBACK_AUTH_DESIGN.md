# DISEÑO DE SEGURIDAD Y AUTENTICACIÓN LOCAL — LOOPBACK AUTH DESIGN
## webOS IPTV Player v1.17.0 — Misión 1B.1

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Chromium 53 / Node.js 0.12.2 / ARMv7 32-bit)  
**Fecha:** 2026-10-29  
**Estado:** Implementado y Validado  

---

## 1. Modelo de Amenazas del Entorno webOS

### 1.1 La Falacia de Confianza en Loopback (`127.0.0.1`)
En arquitecturas cliente-servidor locales sobre sistemas embebidos, es un error conceptual común asumir que las conexiones originadas en `127.0.0.1` provienen exclusivamente de componentes autorizados del sistema.

En LG webOS:
1. El usuario puede abrir el navegador web integrado (`com.webos.app.browser`) y navegar a cualquier sitio web arbitrario de Internet (o interactuar con un portal cautivo/anuncio).
2. Un sitio web malicioso en el navegador del televisor puede ejecutar código JavaScript que realiza peticiones HTTP asíncronas (`fetch` / `XMLHttpRequest` / `<video>` / `<img>`) dirigidas a `http://127.0.0.1:<puerto>/...`.
3. Dado que el navegador se ejecuta en el mismo hardware del televisor, el socket TCP se origina en la dirección loopback (`127.0.0.1`).
4. Si el servicio local (`com.lennylxx.iptv.service`) otorga acceso administrativo o acceso de lectura a datos privados simplemente porque `req.socket.remoteAddress === '127.0.0.1'`, **la página web maliciosa en el navegador del televisor tiene acceso irrestricto a los datos de la aplicación**.

### 1.2 Impacto del Bypass de Loopback Anterior (Misión 1B)
En la implementación previa:
* `isLoopbackOrAuthorized(req, query)` permitía el acceso si `checkLoopback(req)` era verdadero.
* `/info` se entregaba sin token en loopback, exponiendo:
  * El código numérico de emparejamiento (`pairingCode`).
  * La URL completa de configuración con el `setupToken`.
  * La ruta física del directorio de almacenamiento (`dataDir`).
  * La IP local del televisor.
* Con `/info`, cualquier script en el navegador podía extraer el `setupToken` y consecuentemente:
  * Descargar todas las listas M3U y grabaciones privadas (`/uploads`).
  * Inyectar o eliminar fuentes de TV (`/setup-actions`).
  * Manipular o exfiltrar configuraciones y credenciales de usuario (`/setup-state`).

---

## 2. Frontera de Seguridad: El Bus Luna como Raíz de Confianza

### 2.1 Aislamiento de Privilegios en webOS
A diferencia de los puertos de red TCP (que son accesibles por cualquier proceso con permisos de socket), **el bus Luna (Luna Service Bus / PalmServiceBridge)** impone un estricto aislamiento de seguridad a nivel de sistema operativo:
* Las páginas web externas cargadas en el navegador de webOS **NO** tienen acceso al objeto `window.PalmServiceBridge`.
* Las aplicaciones web instaladas sólo pueden invocar métodos de Luna autorizados por su manifiesto (`appinfo.json` y permisos del sistema).
* El servicio Node.js en segundo plano (`com.lennylxx.iptv.service`) se comunica con la aplicación principal (`com.lennylxx.iptv`) a través del bus Luna (`luna://com.lennylxx.iptv.service/*`).

Por lo tanto:
> **El bus Luna constituye la única frontera de comunicación IPC segura y authenticated-by-design entre la interfaz de usuario del televisor y el servicio en segundo plano.**

---

## 3. Arquitectura Dual-Token (AppToken vs SetupToken)

Para satisfacer tanto la necesidad de comunicación local segura (app <-> servicio) como la facilidad de uso para configuración remota (móvil <-> servicio), se implementa un modelo de **dos tokens criptográficamente independientes**:

```
                       ┌─────────────────────────┐
                       │   Bus Luna (webOS IPC)   │
                       └────────────┬────────────┘
                                    │ Transmite appToken
                                    ▼
┌──────────────────────┐  appToken   ┌───────────────────────────────┐
│     App webOS        ├────────────►│  Servicio LAN (Node 0.12.2)   │
│ (com.lennylxx.iptv)  │ HTTP Local  │ (com.lennylxx.iptv.service)   │
└──────────────────────┘             └───────────────▲───────────────┘
                                                     │ HTTP LAN
                                                     │ setupToken
                                         ┌───────────┴───────────┐
                                         │  Teléfono / Navegador │
                                         │  (QR o Pairing Code)  │
                                         └───────────────────────┘
```

### 3.1 `appToken` (Token Privado de la Aplicación)
* **Generación:** 16 bytes pseudoaleatorios (`crypto.randomBytes(16).toString('hex')`, 32 caracteres hexadecimales).
* **Canal de Transmisión Exclusivo:** Se transmite a través de la respuesta del método Luna `luna://com.lennylxx.iptv.service/start` y del método Luna `getInfo`.
* **Exposición:** **NUNCA** se expone en URLs públicas, código QR, interfaz web de configuración ni respuestas HTTP no autenticadas.
* **Propósito:** Autoridad total de la aplicación local webOS sobre el servicio.

### 3.2 `setupToken` (Token de Emparejamiento LAN)
* **Generación:** 6 bytes pseudoaleatorios (`crypto.randomBytes(6).toString('hex')`, 12 caracteres hexadecimales).
* **Canal de Transmisión:** Expuesto en el código QR como parámetro de consulta de la URL `/setup?token=<setupToken>`, o entregado tras intercambiar el código numérico PIN de 4 dígitos mediante `POST /pair`.
* **Propósito:** Operaciones delegadas de configuración desde dispositivos en la red local.

---

## 4. Matriz de Autorización por Endpoint

A continuación se detalla la política de control de acceso estricta implementada:

| Ruta | Método | appToken Requerido | setupToken Permitido | Anónimo en Loopback | Acción / Propósito |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/info` | `GET` | **SÍ** | No (403) | **No (403)** | Consulta metadatos internos del servicio (IP, puerto, código de emparejamiento, dataDir). |
| `/setup` | `GET` | No | Opcional | Sí (200) | Sirve la página web de emparejamiento / configuración. Si no lleva token, muestra formulario de PIN. |
| `/pair` | `POST` | No | No | Sí (200/401/429) | Intercambia el código de 4 dígitos por el `setupToken`. Protegido por rate-limiting (máx. 3 fallos). |
| `/setup-state` | `PUT` | **SÍ** | No (403) | **No (403)** | La app TV publica el snapshot de configuración (sanitizado de contraseñas). |
| `/setup-state` | `GET` | **SÍ** | **SÍ** | **No (403)** | Lee el snapshot de configuración para poblar el formulario del teléfono. |
| `/setup-actions` | `GET` | **SÍ** | No (403) | **No (403)** | La app TV consulta las acciones de configuración pendientes para ejecutarlas. |
| `/setup-actions/:id`| `DELETE` | **SÍ** | No (403) | **No (403)** | La app TV confirma y elimina una acción una vez ejecutada. |
| `/setup-actions` | `POST` | **SÍ** | **SÍ** | **No (403)** | El teléfono envía una nueva acción (agregar M3U, cuenta Xtream, EPG, subtítulos). |
| `/uploads` | `GET` | **SÍ** | **SÍ** | **No (403)** | Lista las subidas disponibles con URLs firmadas con token. |
| `/uploads` | `POST` | **SÍ** | **SÍ** | **No (403)** | Sube una lista M3U al almacenamiento local del televisor. |
| `/uploads/:id.m3u` | `GET` | **SÍ** | **SÍ** | **No (403)** | Descarga/reproduce el contenido del archivo M3U subido. |
| `/uploads/:id` | `DELETE` | **SÍ** | **SÍ** | **No (403)** | Elimina el archivo M3U y sus metadatos del almacenamiento. |

---

## 5. Formas de Transmisión del Token Aceptadas
Para maximizar la robustez en diferentes contextos de llamada (fetch en background vs reproducción nativa de video):
1. **Encabezado `Authorization: Bearer <token>`** (Estándar preferido para peticiones `fetch`).
2. **Encabezado `X-App-Token: <token>`** (Específico para llamadas de la aplicación TV).
3. **Encabezado `X-Setup-Token: <token>`** (Específico para llamadas del asistente web).
4. **Parámetro de consulta `?token=<token>`** (Requerido para etiquetas HTML `<video src="...">`, donde no es posible inyectar encabezados HTTP personalizados en Chromium 53).

---

## 6. Conclusión del Diseño
La eliminación total del bypass incondicional por IP loopback, combinada con la distribución del `appToken` a través de la frontera de privilegios de Luna, cierra definitivamente la posibilidad de ataques SSRF, CSRF y lectura no autorizada desde el navegador del televisor, sin degradar la experiencia de usuario ni alterar el flujo de emparejamiento con teléfonos móviles.

