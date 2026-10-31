# AUDITORÍA DE SEGURIDAD HTTP, CORS Y EMPAREJAMIENTO
## webOS IPTV Player v1.17.0 — Misión 1C

**Fecha:** 2026-10-29  
**Módulos Auditados:**  
* `bundled-service/src/lan/server.ts`  
* `bundled-service/src/lan/server.test.ts`  
* `bundled-service/src/compat.ts`  
* `src/services/service-http.ts`  
* `src/services/upload-client.ts`  
* `src/services/setup-client.ts`  

---

## 1. Arquitectura y Ciclo de Vida de Tokens

El sistema implementa un modelo de autenticación desacoplado de doble token (Dual-Token Architecture):

```
                               ┌─────────────────────────────┐
                               │     Invocación Luna Bus     │
                               │  (luna://...service/start)  │
                               └──────────────┬──────────────┘
                                              │ appToken (32 hex)
                                              ▼
┌───────────────────────────┐     ┌──────────────────────────┐
│  Teléfono / Cliente LAN   │     │    Aplicación webOS      │
│     (Navegador Móvil)     │     │  (Chromium 53 en TV)     │
└─────────────┬─────────────┘     └───────────┬──────────────┘
              │                               │
              │ QR Code o PIN (/pair)         │
              ▼                               │
     setupToken (12 hex)                      │
              │                               │
              ▼                               ▼
┌────────────────────────────────────────────────────────────┐
│         Servidor HTTP Local (Node.js 0.12.2)               │
│               Puerto Efímero (0.0.0.0:XXXX)                 │
└────────────────────────────────────────────────────────────┘
```

### 1.1 `appToken` (Autoridad de la Aplicación TV)
* **Entropía y Generación:** Generado mediante `crypto.randomBytes(16).toString('hex')` (32 caracteres hexadecimales, 128 bits de entropía criptográfica).
* **Canal de Entrega:** Transmitido **únicamente** a través de la respuesta IPC local del método Luna `start`, protegido por el validador estricto `isAuthorizedCaller()`.
* **Privilegios:** Endpoints administrativos internos:
  * `PUT /setup-state`: Actualización de proveedores y configuración de usuario desde la TV.
  * `GET /setup-actions`: Extracción y consumo de acciones encoladas por el teléfono móvil.
  * `DELETE /setup-actions/:id`: Agradecimiento y eliminación de acción consumida.
* **Higiene HTTP:** Se confirmó que `GET /info` **NO** devuelve `appToken`.

### 1.2 `setupToken` (Autoridad del Cliente Móvil LAN)
* **Entropía y Generación:** Generado mediante `crypto.randomBytes(6).toString('hex')` (12 caracteres hexadecimales, 48 bits de entropía).
* **Canal de Entrega:**
  * Incluido en la URL de configuración del Código QR mostrado en la pantalla de la TV (`/setup?token=...`).
  * O canjeado mediante el endpoint de emparejamiento `POST /pair` enviando el PIN numérico de 4 dígitos.
* **Privilegios:** Endpoints de autoservicio de configuración y subida:
  * `GET /setup-state`: Lectura del estado actual de configuración para el formulario móvil.
  * `POST /setup-actions`: Encolado de acciones de configuración desde el móvil.
  * `GET /uploads`: Listado de listas M3U subidas.
  * `POST /uploads`: Subida de nuevo archivo M3U (hasta 10 MB).
  * `GET /uploads/:id.m3u`: Descarga/reproducción del M3U subido.
  * `DELETE /uploads/:id`: Eliminación de lista M3U.

---

## 2. Validación de Red Local y CORS Estricto RFC 1918

Para impedir ataques de cruce de sitios desde páginas web maliciosas navegadas en el televisor o en la red local (DNS Rebinding o ataques de intranet), el servidor HTTP evalúa la cabecera `Origin` en cada petición entrante:

### 2.1 Reglas de Validación
1. **Rechazo de Wildcard (`*`):** El servidor **nunca** emite `Access-Control-Allow-Origin: *`.
2. **Rechazo de `Origin: null`:** Se prohíbe explícitamente el origen `null`, bloqueando iframes sandboxed, URLs de datos y redirecciones ciegas.
3. **Análisis Estricto de 4 Octetos IPv4 (RFC 1918):**
   * Se descartan comprobaciones de subcadenas o prefijos (que permitirían dominios como `http://192.168.1.attacker.com`).
   * Se extrae el hostname y se valida que conste de exactamente 4 enteros entre 0 y 255.
   * Se validan las subredes privadas:
     * `10.0.0.0/8` (`10.0.0.0` - `10.255.255.255`)
     * `172.16.0.0/12` (`172.16.0.0` - `172.31.255.255`)
     * `192.168.0.0/16` (`192.168.0.0` - `192.168.255.255`)
4. **Orígenes de Loopback Permitidos:** `localhost`, `127.0.0.1`, `::1`, `[::1]`.
5. **Esquema de Empaquetado Local:** `file://` (requerido para los recursos web locales de webOS).
6. **Manejo de Preflight OPTIONS:** Retorna HTTP `204 No Content` si el origen es autorizado; de lo contrario, responde HTTP `403 Forbidden` sin cabeceras CORS.
7. **Ausencia de `X-Forwarded-For` no confiable:** La dirección IP del cliente se extrae directamente de `req.socket.remoteAddress`, impidiendo la suplantación de identidad de red.

---

## 3. Auditoría del Emparejamiento por PIN y Mitigación de DoS

### 3.1 Modelo de Amenaza del PIN
* **Espacio de Claves:** 4 dígitos numéricos (`0000` - `9999` = 10.000 combinaciones posibles).
* **Vectores de Ataque:**
  * Ataque de fuerza bruta por diccionario desde una IP local.
  * Ataque distribuido desde múltiples dispositivos en la misma LAN.
  * Ataque de temporización (*timing attacks*) sobre la comparación de cadenas.
  * Ataque de denegación de servicio (DoS) para inutilizar el emparejamiento legítimo.

### 3.2 Salvaguardas Implementadas y Refinadas en Misión 1C

#### A. Comparación en Tiempo Constante (`timingSafeEqualString`)
Node.js 0.12.2 carece de `crypto.timingSafeEqual`. En [compat.ts](file:///c:/Users/amaur/Desktop/webos-iptv-player/bundled-service/src/compat.ts) se implementó una función que recorre siempre el máximo de longitud entre ambas cadenas mediante operaciones bit a bit XOR y OR sin cortocircuito, evitando la filtración por canal lateral de temporización.

#### B. Bloqueo Progresivo por IP
* Tras **5 intentos fallidos consecutivos** desde una misma dirección IP, la IP queda bloqueada inicialmente por 60 segundos.
* Los fallos subsecuentes aplican un multiplicador exponencial ($60\text{s} \times 2^{(\text{fallos} - 5)}$) con un tope de **300 segundos** (5 minutos).
* Las peticiones rechazadas reciben HTTP `429 Too Many Requests` con la cabecera/propiedad `retryAfter`.

#### C. Destrucción Inmediata del PIN en Ataque Distribuido
* Si la red en su conjunto acumula **20 fallos globales** antes de un acierto, se asume un ataque coordinado de fuerza bruta.
* **El PIN actual se destruye y rota inmediatamente** generando un nuevo código de 4 dígitos criptográficamente seguro (`secureRandomInt(10000)`).
* Se emite el evento `setup-changed` para actualizar el PIN visualmente en la pantalla de la TV.
* **Efecto Matemático:** Cualquier conocimiento acumulado por el atacante (las 20 combinaciones probadas) queda invalidado instantáneamente, reduciendo la probabilidad de éxito de fuerza bruta prácticamente a cero.

#### D. Inmunidad a Denegación de Servicio (DoS Fix Misión 1C)
* **Defecto en M1B.2:** Un atacante cuya IP ya estaba bloqueada podía seguir enviando peticiones e incrementando `globalFailures`, causando que el PIN rotara continuamente e impidiendo que un usuario legítimo completara el emparejamiento.
* **Corrección en M1C:** Si la IP cliente ya está en estado bloqueado (`current.blockedUntil > now`), la petición se rechaza de inmediato con HTTP 429 **sin incrementar `globalFailures`**. Un cliente bloqueado no puede evaluar PINs y no puede provocar la rotación forzada del PIN.

#### E. Expiración Temporal (TTL)
* El PIN de emparejamiento tiene una vida útil de **15 minutos** (`pairingTtlMs = 900.000 ms`).
* Al expirar, se genera automáticamente un nuevo PIN al recibir la siguiente solicitud.

---

## 4. Resultados de Pruebas Automatizadas

La suite `bundled-service/src/lan/server.test.ts` valida todas estas salvaguardas con **90 pruebas aprobadas** (100% pass):

* 14 pruebas de orígenes RFC 1918 válidos.
* 10 pruebas de rechazo de imitaciones y prefijos maliciosos.
* 4 pruebas específicas de emparejamiento y mitigación de DoS:
  * Rotación tras emparejamiento exitoso.
  * Bloqueo global y rotación de PIN tras 20 fallos de red.
  * Inmunidad a DoS cuando una IP bloqueada martillea el endpoint.
  * Expiración automática del PIN por TTL.

