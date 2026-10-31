# VALIDACIÓN TÉCNICA DEFINITIVA DEL PAQUETE IPK
## webOS IPTV Player v1.17.0 — Misión 1C Finalization

**Fecha:** 2026-10-30  
**Ubicación del Paquete Definitivo:** `AUDIT_REPORTS/MISSION_1C_FINAL/package/com.lennylxx.iptv_1.17.0_all.ipk`  
**Tamaño del Archivo:** `733.772 bytes` (716,57 KB)  
**Hash Criptográfico SHA-256:** `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`  
**Estado:** **VALIDADO EN CONTENIDO, ESTRUCTURA Y SEGURIDAD**  

---

## 1. Inspección y Extracción Interna del Archivo IPK

El archivo `com.lennylxx.iptv_1.17.0_all.ipk` fue inspeccionado mediante el extractor nativo `parseIpkArchive()`. A continuación se desglosan sus componentes físicos:

```
com.lennylxx.iptv_1.17.0_all.ipk (ar archive format)
├── debian-binary  (4 bytes: "2.0\n")
├── control.tar.gz (Metadatos de paquete para el gestor de paquetes de webOS)
│   ├── control    (Package: com.lennylxx.iptv, Version: 1.17.0, Architecture: all)
│   └── postinst   (Script post-instalación de webOS)
└── data.tar.gz    (Carga útil de la aplicación y servicio: 109 entradas)
```

---

## 2. Inspección Directa del JavaScript Empaquetado

Se extrajeron los archivos JavaScript directamente desde `data.tar.gz` para verificar que corresponden al código fuente TypeScript de Misión 1C y no a versiones intermedias:

### 2.1 Archivo `usr/palm/services/com.lennylxx.iptv.service/lan/service.js`
* **Fragmento extraído de `isAuthorizedCaller`:**
  ```javascript
  function isAuthorizedCaller(msg) {
      if (!msg || typeof msg !== 'object') {
          return false;
      }
      var m = msg;
      var appId = typeof m.applicationId === 'string' ? m.applicationId.trim() : undefined;
      var callerId = typeof m.callerId === 'string' ? m.callerId.trim() : undefined;
      var sender = typeof m.sender === 'string' ? m.sender.trim() : undefined;
      var claims = [];
      if (appId)
          claims.push(appId);
      if (callerId)
          claims.push(callerId);
      if (sender)
          claims.push(sender);
      // FAIL-CLOSED: Deny access if no identity metadata was provided by LS2
      if (claims.length === 0) {
          return false;
      }
      // All present claims must match AUTHORIZED_APP_ID with zero contradictions
      for (var i = 0; i < claims.length; i++) {
          if (claims[i] !== AUTHORIZED_APP_ID) {
              return false;
          }
      }
      return true;
  }
  ```
* **Verificación:**  
  * `claims.length === 0` -> `return false` (**Confirmado presente**).
  * Patrón `caller !== undefined && caller !== ...` (**Confirmado ausente**).
  * Métodos protegidos: `start`, `getInfo`, `heartbeat`, `stop`, `serviceEvents` (**Confirmado presente**).

### 2.2 Archivo `usr/palm/services/com.lennylxx.iptv.service/lan/server.js`
* **Fragmento extraído del control de tasa de `/pair`:**
  ```javascript
  if (current && current.blockedUntil > now) {
      // Reject immediately with 429. Do NOT increment globalFailures:
      // A blocked client cannot evaluate PINs and must not be allowed to DoS the network.
      sendJson(req, res, 429, {
          error: 'Too many pairing attempts',
          retryAfter: Math.ceil((current.blockedUntil - now) / 1000),
      });
      return;
  }
  ```
* **Verificación:**  
  * No incrementa `globalFailures` cuando el cliente ya está bloqueado (**Confirmado presente**).
  * Destruye y rota el PIN al alcanzar el umbral de 20 fallos de red sin denegar permanentemente el servicio a clientes legítimos (**Confirmado presente**).

### 2.3 Archivo `usr/palm/applications/com.lennylxx.iptv/js/app.js`
* **Fragmento extraído de la carga de playlists:**
  ```javascript
  "Failed to load Xtream playlist '".concat(O.name||rn(O.url),"'")
  ```
* **Verificación:**  
  * La función minificada `rn` corresponde a `diagnosticStreamUrl`, ofuscando credenciales incrustadas en URLs de listas de reproducción (**Confirmado presente**).

---

## 3. Validación de Recursos del Paquete

Se ejecutó el validador oficial de empaquetado:
```text
> node scripts/validate-package-resources.mjs --ipk AUDIT_REPORTS/MISSION_1C_FINAL/package/com.lennylxx.iptv_1.17.0_all.ipk
[Package Resource Validator] Inspecting IPK archive: AUDIT_REPORTS/MISSION_1C_FINAL/package/com.lennylxx.iptv_1.17.0_all.ipk...
[Package Resource Validator] IPK size: 733772 bytes, Total entries: 109
[OK] IPK package passed all architectural, security, and resource checks.
```

* **Bibliotecas de preview (`preview-libs.js`):** Excluidas.
* **Archivos fuente y mapas de desarrollo:** Excluidos.
* **Módulos `node_modules`:** Excluidos.
* **Recursos requeridos:** 26 / 26 verificados.

