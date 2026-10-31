# AUDITORÍA DE SEGURIDAD Y PRIVACIDAD
## Proyecto: webOS IPTV Player (v1.17.0)

---

## 1. RESUMEN DE LA POSTURA DE SEGURIDAD

La auditoría de seguridad del proyecto revela una aplicación orientada a la privacidad del usuario en su diseño de red (sin telemetría invasiva, sin análisis de terceros y sin servidores intermedios de recopilación), combinada con defensas robustas contra ataques comunes de frontend como DOM-XSS y fuerza bruta en la LAN.

Sin embargo, se identificaron vulnerabilidades en la persistencia local de credenciales, donde las contraseñas de proveedores IPTV y claves de API de servicios externos se almacenan en texto plano en el `localStorage` del navegador. Si bien en un entorno cerrado de Smart TV el modelo de aislamiento de orígenes de Chromium mitiga el acceso directo entre aplicaciones web, en un televisor con acceso root habilitado o mediante volcados de diagnóstico, dichas credenciales son plenamente legibles.

---

## 2. HALLAZGOS ESTRUCTURADOS DE SEGURIDAD

### AUD-SEC-001: Almacenamiento de Credenciales IPTV en Texto Plano
* **Categoría:** Seguridad / Persistencia de Datos.
* **Severidad:** **ALTA**.
* **Archivo:** `src/services/storage-service.ts`.
* **Ubicación:** Funciones `getPlaylists()` y `setPlaylists()`, claves `iptv_playlists`.
* **Descripción del Hallazgo:**
  Los objetos `PlaylistEntry` almacenan la URL completa del proveedor M3U y, en el caso de cuentas Xtream Codes, los campos `username` y `password` en texto claro dentro de `localStorage` bajo la clave `iptv_playlists`.
* **Evidencia en Código:**
  ```ts
  // src/services/storage-service.ts
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  ```
  La estructura JSON resultante en flash almacena:
  `{"id":"pl_1","name":"Mi IPTV","type":"xtream","url":"http://servidor:8080","username":"usuario123","password":"passwordSecreto"}`
* **Impacto en el Televisor:**
  Cualquier proceso con acceso al sistema de archivos local (`/var/luna/preferences/` o `/var/palm/jail/com.lennylxx.iptv/`), scripts de volcado de datos o copias de seguridad de Homebrew pueden extraer las contraseñas de las suscripciones IPTV del usuario.
* **Recomendación:**
  Implementar ofuscación o cifrado simétrico mediante `crypto.subtle` utilizando una clave derivada localmente (o del identificador único del televisor obtenido vía Nyx) antes de serializar en `localStorage`, o almacenar las credenciales en una base de datos protegida de IndexedDB.
* **Estado:** **Confirmado**.

---

### AUD-SEC-002: Almacenamiento de Claves API de Subtítulos en Texto Plano
* **Categoría:** Seguridad / Credenciales de Terceros.
* **Severidad:** **MEDIA**.
* **Archivo:** `src/services/storage-service.ts`.
* **Ubicación:** Métodos `getOnlineSubtitleConfig()` y `setOnlineSubtitleConfig()`.
* **Descripción del Hallazgo:**
  Las claves de API de SubDL, Assrt y el usuario, contraseña y token de acceso de OpenSubtitles se almacenan en texto plano en la clave `iptv_online_subtitles` de `localStorage`.
* **Impacto en el Televisor:**
  Exposición de credenciales de servicios de terceros ante inspección del sistema de archivos local.
* **Recomendación:**
  Almacenar únicamente tokens de sesión temporales y no retener contraseñas en claro cuando el servicio admita autenticación por token.
* **Estado:** **Confirmado**.

---

### AUD-SEC-003: Mecanismo Criptográfico del PIN Parental (Diseño Seguro)
* **Categoría:** Seguridad / Control de Acceso.
* **Severidad:** **INFORMATIVA / POSITIVA**.
* **Archivo:** `src/services/parental-pin.ts`.
* **Ubicación:** Funciones `createParentalPin()` y `verifyParentalPin()`.
* **Descripción del Hallazgo:**
  El sistema de control parental no almacena el PIN numérico en claro. Utiliza un algoritmo estándar y robusto:
  1. Genera un salt criptográfico aleatorio de 16 bytes mediante `crypto.getRandomValues(salt)`.
  2. Deriva el hash mediante `crypto.subtle.digest('SHA-256', salt + pin)`.
  3. Compara los bytes resultantes con una función de tiempo constante (`equalBytes`) para evitar ataques de temporización (timing attacks).
* **Evidencia en Código:**
  ```ts
  function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
    let mismatch = a.length ^ b.length;
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i++) {
      mismatch |= (a[i] ?? 0) ^ (b[i] ?? 0);
    }
    return mismatch === 0;
  }
  ```
* **Estado:** **Confirmado / Correctamente Implementado**.

---

### AUD-SEC-004: Servidor HTTP LAN para Configuración (Diseño Robusto)
* **Categoría:** Seguridad / Comunicaciones de Red Local.
* **Severidad:** **INFORMATIVA / POSITIVA**.
* **Archivo:** `bundled-service/src/lan/server.ts`.
* **Descripción del Hallazgo:**
  El servidor HTTP auxiliar para carga de listas y configuración desde smartphones cuenta con múltiples capas de protección:
  1. **Restricción Loopback:** Los endpoints sensibles de introspección (`/info`, `/setup-actions` GET, `/setup-state` PUT) verifican `isLoopback(req)` y responden `403 Forbidden` a cualquier cliente externo.
  2. **Emparejamiento Seguro (Pairing PIN):** El smartphone debe ingresar un código numérico de 4 dígitos generado aleatoriamente y visible en la pantalla del televisor (`/pair`).
  3. **Protección contra Fuerza Bruta:** Cuenta con limitador de tasa: tras 5 intentos fallidos de emparejamiento, bloquea la IP del cliente por 60 segundos (`PAIRING_MAX_FAILURES = 5; PAIRING_LOCK_MS = 60000`).
  4. **Token de Sesión:** Tras emparejarse, entrega un token de 12 caracteres hexadecimales (`crypto.randomBytes(6)`), requerido en todas las peticiones posteriores.
  5. **Límite de Carga:** El cuerpo de subida de archivos M3U está limitado estrictamente a 16 MB para evitar agotamiento de memoria en Node 0.12.2.
* **Estado:** **Confirmado / Correctamente Implementado**.

---

### AUD-SEC-005: Prevención de Inyección DOM-XSS en Contenido M3U / XMLTV
* **Categoría:** Seguridad / Sanitización de Entradas.
* **Severidad:** **INFORMATIVA / POSITIVA**.
* **Archivo:** `src/utils/dom.ts` y `src/utils/morph.ts`.
* **Descripción del Hallazgo:**
  Los nombres de canales, logotipos, títulos de programas y descripciones EPG provienen de fuentes M3U/XMLTV no confiables que podrían contener cargas útiles maliciosas de XSS (`<script>`, `<img onerror=...>`).
  El proyecto implementa una regla arquitectónica estricta:
  * Se prohíbe el uso de `innerHTML` directo con variables sin escapar.
  * Todas las plantillas se construyen mediante el tagged template `html` (`src/utils/dom.ts`), que escapa por defecto caracteres peligrosos (`&`, `<`, `>`, `"`, `'`).
  * Solo los fragmentos explícitamente marcados con `raw(...)` son tratados como HTML seguro.
* **Estado:** **Confirmado / Correctamente Implementado**.

---

### AUD-SEC-006: Ofuscación de Credenciales en Registros de Diagnóstico
* **Categoría:** Seguridad / Logging y Privacidad.
* **Severidad:** **INFORMATIVA / POSITIVA**.
* **Archivo:** `src/utils/url.ts`.
* **Ubicación:** Función `diagnosticStreamUrl(url)`.
* **Descripción del Hallazgo:**
  En los logs generados por el reproductor y en los volcados de diagnóstico para soporte técnico (`tv.sh diag`), las URLs de streaming que contienen credenciales incrustadas (típicas en Xtream Codes: `/live/usuario/clave/canal.ts`) son saneadas automáticamente:
  * Los segmentos de usuario y contraseña en la ruta se reemplazan por `***`.
  * Los parámetros de consulta (query params) que no coinciden con una lista blanca segura (`start`, `end`, `duration`, `extension`, `stream`) son sustituidos por `***`.
  * Se eliminan credenciales HTTP básicas (`user:pass@host`).
* **Estado:** **Confirmado / Correctamente Implementado**.

---

### AUD-SEC-007: Tráfico HTTP en Claro y Mixed Content
* **Categoría:** Seguridad / Cifrado en Tránsito.
* **Severidad:** **MEDIA**.
* **Componente:** Transporte de Streams y XMLTV.
* **Descripción del Hallazgo:**
  La gran mayoría de servidores de proveedores IPTV operan a través de HTTP sin TLS (puertos 80, 8080, etc.).
  * **Comportamiento en webOS:** Dado que la aplicación se ejecuta localmente bajo el esquema `file:///`, Chromium 53 no bloquea peticiones HTTP salientes por "Mixed Content" (como ocurriría si la app se sirviera desde un origen HTTPS).
  * **Riesgo:** El tráfico IPTV que viaja en claro es susceptible de inspección o alteración en redes locales compartidas (por ejemplo, Wi-Fi abierta).
* **Recomendación:** Informar al usuario cuando configure listas M3U o Xtream bajo HTTP sin cifrado y recomendar HTTPS siempre que el proveedor lo soporte.
* **Estado:** **Confirmado**.

---

## 3. DEPENDENCIAS DE TERCEROS Y CADENA DE SUMINISTRO

* **Dependencias de Producción en el Paquete:**
  * `assjs` (v0.1.10): Renderizador ligero de subtítulos, código abierto (MIT).
  * `fflate` (v0.8.3): Librería de descompresión pura de alto rendimiento, sin dependencias transitivas (MIT).
  * `iso-639-1` y `iso-639-2`: Tablas estáticas de idiomas (MIT).
  * `qrcode-generator`: Generador de código QR offline (MIT).
  * `shaka-player` (v5.2.12): Mantenido por Google / Shaka Project (Apache-2.0).
* **Evaluación de Riesgo de Cadena de Suministro:** **Bajo**. Ninguna de las dependencias de producción ejecuta scripts de instalación arbitrarios, no utilizan binarios nativos compilados externos y no se conectan a servidores de telemetría de terceros.

