# OBSERVACIONES DE SEGURIDAD EN HARDWARE REAL
**Dispositivo:** LG 65UM7400PDA (webOS 4.10.2)  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Seguridad y Software Embebido  
**Misión:** Misión 2 — Despliegue y Validación en Hardware Real

---

## 1. Evaluación de la Frontera de Confianza en Luna (LS2)

Durante la misión se evaluó la resistencia real del servicio `com.lennylxx.iptv.service` frente a vectores de ataque locales procedentes de otras aplicaciones instaladas o procesos del sistema.

### 1.1 Invocación No Autenticada (Fail-Closed)
* **Vector:** Un proceso del sistema o cliente del bus llama a un método administrativo (`/start`) sin proporcionar credenciales o identidad en el mensaje.
* **Comportamiento en Hardware:** El servicio comprueba la colección de declaraciones de identidad (`claims.length === 0`). Al no haber identidad validada por LS2, el acceso es denegado de forma fail-closed (`{"returnValue": false, "errorCode": -1, "errorText": "Unauthorized"}`).
* **Veredicto:** **SEGURO**. No existe modo fail-open residual en el código compilado ni en el binario desplegado.

### 1.2 Suplantación de Identidad de Aplicación (Caller Spoofing)
* **Vector:** Un actor hostil intenta invocar el servicio registrando una identidad falsificada (`-a com.attacker.app`).
* **Comportamiento en Hardware:** El servicio verifica de manera estricta que todas las declaraciones de identidad coincidan unívocamente con `AUTHORIZED_APP_ID` (`com.lennylxx.iptv`). Ante cualquier discrepancia, la invocación es rechazada categóricamente con código de error `Unauthorized`.
* **Veredicto:** **SEGURO**.

---

## 2. Seguridad del Servidor HTTP en Red de Área Local (LAN)

El servicio `com.lennylxx.iptv.service` expone un servidor HTTP en un puerto efímero dinámico (observado en TCP 43992) para permitir la carga de listas y emparejamiento desde teléfonos o computadoras.

### 2.1 Protección del Endpoint `/info` y Fuga de Secretos
* **Comportamiento:** Peticiones no autenticadas reciben `HTTP 403 Forbidden` (`{"error":"Unauthorized: appToken required"}`).
* **Observación:** Se verificó exhaustivamente que en ningún caso se filtre el `appToken`, la dirección IP de control ni los identificadores internos a clientes de la LAN sin credenciales válidas.

### 2.2 Defensa contra Ataques de Fuerza Bruta y DoS Distribuido
* **Prueba de Resistencia:** Se enviaron intentos consecutivos con códigos de emparejamiento inválidos.
* **Comportamiento:**
  1. Los primeros 3 intentos reciben `HTTP 401 Unauthorized`.
  2. En el 4.º intento, el limitador de tasa activa el bloqueo por cliente (`HTTP 429 Too Many Requests`) con una ventana de enfriamiento de 60 segundos (`retryAfter: 60`).
  3. Durante el bloqueo, el cliente continúa recibiendo `HTTP 429` sin que sus peticiones incrementen el contador de fallos globales. Esto mitiga con éxito el vector de denegación de servicio (DoS) donde un atacante podía bloquear deliberadamente a usuarios legítimos de la misma red.

### 2.3 Cabeceras de Seguridad
* Todas las respuestas HTTP incluyen la cabecera `X-Content-Type-Options: nosniff`, impidiendo que clientes maliciosos ejecuten ataques de confusión de tipos MIME.

---

## 3. Modelo de Aislamiento y Privilegios en webOS

* **Espacio de Archivos:** La aplicación y el servicio operan con UID `6904` en `/media/developer/apps/usr/palm/`.
* **Particiones del Sistema:** No se realizaron lecturas indebidas ni escrituras sobre particiones críticas del sistema (`/old_root`, `/mnt/tvservice`, `/media/cryptofs`).
* **Higiene de Diagnósticos:** Las URLs de listas y streams registradas en logs y consolas ofuscan tokens y credenciales privadas mediante `diagnosticStreamUrl()`.

