# Informe de Cierre de Seguridad y Endurecimiento Definitivo
## Misión M2.2.1.1 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Rama:** `fix/mission-2-2-stabilization`  
**Dispositivo Destino:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Chromium 53.0.2785.34, Node.js 0.12.2, ARMv7 Realtek RTD2870)  
**Estado:** Endurecimiento Completado — Cero interacción con el hardware  

---

## 1. Contexto y Objetivos de la Misión M2.2.1.1

La auditoría externa independiente realizada sobre la entrega de la Misión M2.2.1 validó con éxito el paquete IPK candidato:
- **Tamaño:** 734.610 bytes
- **SHA-256:** `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531`

No obstante, la auditoría identificó dos observaciones puntuales que debían resolverse antes de considerar el proceso de preparación cerrado:
1. **Binding inseguro explícito en `scripts/test-server.ts`:** Aunque el servidor no escuchaba en `0.0.0.0` por defecto, la función `parseServerCliArgs` admitía cualquier valor proporcionado mediante `--host` o la variable `TEST_SERVER_HOST`, permitiendo potencialmente que un operador especificara manualmente `0.0.0.0` o `::`, o una interfaz virtual/VPN insegura.
2. **Discrepancia en el inventario criptográfico de artefactos:** Los metadatos declarados en informes previos para el archivo ZIP consolidado no coincidían con el hash y tamaño reales del archivo generado debido a un orden de empaquetado asíncrono.

Esta Misión M2.2.1.1 solventó ambas observaciones de manera estricta y verificable en el entorno local del PC.

---

## 2. Resolución de la Observación 1: Endurecimiento de `scripts/test-server.ts`

Se refactorizó completamente la gestión de direcciones de red y argumentos en `scripts/test-server.ts`, estableciendo una arquitectura **fail-closed**:

### 2.1 Rechazo Explícito de Direcciones Wildcard
Se implementó la función `isWildcardIp(ip)` que intercepta y bloquea cualquier variante de dirección comodín:
- IPv4 wildcard: `0.0.0.0`, y cualquier combinación `0.0.0.0` con espacios.
- IPv6 wildcard: `::`, `::0`, `0:0:0:0:0:0:0:0` y cualquier expansión nula.
- Si se suministra una dirección wildcard vía `--host`, `--host <wildcard>` o `TEST_SERVER_HOST`, el sistema aborta de inmediato con una excepción explícita:
  ```text
  Wildcard binding address "<ip>" is strictly prohibited for test server safety
  ```

### 2.2 Validación Sintáctica de Direcciones IP
- Se integró el validador estándar de Node.js `net.isIP(ip)`.
- Si la dirección contiene caracteres alfanuméricos no válidos (por ejemplo, `abc`, `not-an-ip`, `999.999.999.999` o máscaras incompletas como `192.168.1`), el sistema rechaza la ejecución arrojando:
  ```text
  Invalid IP address syntax: "<ip>"
  ```

### 2.3 Validación contra Interfaces Locales Activas
- Mediante `getAvailableLocalIps()`, el sistema enumera las interfaces de red reales del equipo anfitrión (`os.networkInterfaces()`).
- Si un usuario o script especifica una dirección IP válida sintácticamente pero que no pertenece a ninguna interfaz local activa (por ejemplo, `198.51.100.1` de la red de documentación RFC 5737), el sistema falla de inmediato:
  ```text
  Host address "<ip>" does not correspond to any active local network interface
  ```
- Se permite el alias `'localhost'`, el cual es normalizado de forma segura a `127.0.0.1`.

### 2.4 Comportamiento Predeterminado Seguro
- Sin parámetros en línea de comandos ni variables de entorno, el host se vincula **exclusivamente a `127.0.0.1`** y el puerto a `8088`.

### 2.5 Selección Inteligente de Interfaz LAN (`--lan`)
- Se implementó la heurística `isVirtualOrVpnInterface(name)` para filtrar automáticamente adaptadores virtuales o VPNs (Radmin VPN, Tailscale, ZeroTier, WireGuard, Docker, Hyper-V, vEthernet WSL, túneles Teredo, etc.).
- La función `getLanIp()` clasifica las interfaces físicas en tres niveles de prioridad:
  1. **Nivel 1:** Adaptador físico con dirección IPv4 en `192.168.0.0/16` (subred residencial estándar de webOS).
  2. **Nivel 2:** Adaptador físico en subredes privadas `10.0.0.0/8` o `172.16-31.0.0/12`.
  3. **Nivel 3:** Cualquier otra interfaz IPv4 física no interna.
- **Fail-Closed:** Si el equipo solo dispone de interfaces virtuales o no existe ninguna interfaz LAN física válida, el sistema **no asume ninguna IP** y aborta con:
  ```text
  Unable to identify a safe physical LAN interface: no suitable non-virtual, non-VPN LAN interface found
  ```

### 2.6 Aplicación Idéntica a Variables de Entorno
- La variable `TEST_SERVER_HOST` es evaluada bajo las mismas reglas que los parámetros CLI.
- Los parámetros de línea de comandos tienen mayor precedencia que las variables de entorno.

### 2.7 Preservación Absoluta del Subsistema HTTP
- No se modificó el comportamiento del servidor respecto a:
  - Manejo de cabeceras de rango parcial (`Range: bytes=`, HTTP 206 y 416).
  - Peticiones `HEAD` con cabeceras completas y cuerpo vacío.
  - Cabeceras CORS permisivas para desarrollo (`Access-Control-Allow-*`).
  - Lista blanca estricta inmutable `ALLOWED_FIXTURE_FILES = Set(['synthetic_test.mp4', 'synthetic_test.m3u'])`.

### 2.8 Cobertura de Pruebas Unitarias
Se crearon y ejecutaron 31 pruebas unitarias en `src/utils/test-server.test.ts` con Vitest, cubriendo:
- Detección de comodines IPv4 e IPv6.
- Filtro de interfaces virtuales/VPN.
- Rechazo de `--host 0.0.0.0`, `--host ::` y `TEST_SERVER_HOST=0.0.0.0`.
- Rechazo de IPs malformadas (`999.999.999.999`, `abc`, etc.).
- Rechazo de IPs no locales (`198.51.100.1`).
- Aceptación de `127.0.0.1` y `localhost`.
- Límites de puertos (`--port`).
- Resolución de `--lan` y priorización de interfaces físicas frente a VPN.
- Mecanismo fail-closed ante ausencia de interfaz LAN.
- Peticiones HTTP reales: 200, 206, 416, HEAD, path traversal 403 y lista blanca 404.

**Resultado:** 31 pruebas ejecutadas, 31 aprobadas (100% éxito).  
**Garantía de Aislamiento:** El servidor de pruebas **NO fue iniciado ni se abrieron puertos** durante esta misión.

---

## 3. Resolución de la Observación 2: Integridad del Inventario de Artefactos

### 3.1 Causa Raíz de la Discrepancia Anterior
En la Misión M2.2.1, el resumen documental se redactó antes de generar el paquete ZIP final. Al intentar actualizar el resumen con el hash del ZIP resultante, la modificación del archivo obligó a una re-compresión, la cual alteró ligeramente el tamaño en bytes del ZIP y su correspondiente SHA-256, provocando una discrepancia entre el valor textual dentro del paquete y el hash externo.

### 3.2 Corrección Metodológica
Para esta misión M2.2.1.1 se estableció una secuencia de auditoría determinista:
1. Todos los documentos de auditoría (`SAFETY_CLOSURE.md`, `ARTIFACT_INTEGRITY.md`, `TEST_RESULTS.md`, `mission2_2_1_1.json`) se estructuran de forma final y completa.
2. Se documentan con cálculo criptográfico real verificado:
   - Hash y tamaño del **IPK candidato** (`9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531`, 734.610 bytes).
   - Hash y tamaño del **IPK de rollback** (`253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`, 733.772 bytes).
3. Se genera el paquete consolidado `mission2_2_1_1-final.zip`.
4. Inmediatamente tras su creación en disco, se calcula su hash SHA-256 y tamaño exacto en bytes mediante `Get-FileHash` y se consignan en el informe final y en el archivo de verificación `CHECKSUMS.sha256`.

---

## 4. Preservación del Paquete de Producción IPK

Los cambios de código implementados en esta misión afectaron exclusivamente a:
- `scripts/test-server.ts` (script auxiliar para pruebas de desarrollo local en PC).
- `src/utils/test-server.test.ts` (suite de pruebas unitarias para Vitest).

Ninguno de estos archivos forma parte de la compilación de producción del paquete `dist/` ni del servicio empaquetado `build/bundled-service/`. La herramienta oficial `ares-package` solo incluye los directorios `dist/` y `build/bundled-service/`, junto con el manifiesto `appinfo.json` e iconos.

Por consiguiente, el paquete IPK candidato **es bit a bit idéntico al paquete aprobado por la auditoría externa**, con hash SHA-256 `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531` y tamaño de 734.610 bytes. No se requirió alterar el paquete de producción.

---

## 5. Garantía de No Interacción con el Televisor

Durante el transcurso de toda la Misión M2.2.1.1:
- Cero conexiones de red (SSH, Luna, CDP, HTTP) hacia el televisor LG 65UM7400PDA (`192.168.1.8`).
- Cero comandos remotos o de depuración ejecutados.
- Cero alteraciones en las particiones o estado del dispositivo físico.
- No se solicita autorización de despliegue en esta entrega, quedando supeditada a la auditoría independiente de este nuevo paquete.

