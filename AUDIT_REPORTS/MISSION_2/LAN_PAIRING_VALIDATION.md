# FASE D — VALIDACIÓN DE CONECTIVIDAD LAN Y EMPAREJAMIENTO
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Software Embebido  
**Estado:** VALIDADO CON ÉXITO — 100% PRUEBAS DE SEGURIDAD PASADAS

---

## 1. Descubrimiento y Estado del Servidor LAN

* **Dirección IP del Televisor:** `192.168.1.8`
* **Puerto HTTP asignado dinámicamente:** `43992`
* **Proceso responsable:** `com.lennylxx.iptv.service` (Node.js 0.12.2)

---

## 2. Resultados de las Pruebas de Seguridad y Endpoints

| Endpoint | Método | Condición de Prueba | Código HTTP | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/info` | GET | Sin cabecera `appToken` | `403 Forbidden` | `{"error":"Unauthorized: appToken required"}` | **PASS** |
| `/setup` | GET | Petición normal desde navegador LAN | `200 OK` | Documento HTML completo (89.8 KB), `nosniff` activo | **PASS** |
| `/pair` | POST | PIN inválido (`{"code":"0000"}`) | `401 Unauthorized` | `{"error":"Invalid pairing code"}` | **PASS** |
| `/pair` | POST | Intentos consecutivos repetidos | `429 Too Many Requests` | Bloqueo automático activado en el 4.º intento | **PASS** |
| `/pair` | POST | Peticiones subsecuentes bloqueadas | `429 Too Many Requests` | `{"error":"Too many pairing attempts","retryAfter":60}` | **PASS** |

---

## 3. Verificación de Cabeceras de Seguridad y Aislamiento

1. **Cabecera `X-Content-Type-Options: nosniff`:**  
   Confirmada en todas las respuestas (`/info`, `/setup`, `/pair`). Previene ataques de tipo MIME sniffing en clientes web locales.
2. **Protección de Secretos en `/info`:**  
   Se verificó exhaustivamente que el endpoint `/info` **no divulga** el valor del `appToken`, la dirección IP de control ni el estado del emparejamiento ante clientes no autenticados en la red de área local.
3. **Mecanismo Anti-Fuerza Bruta y Mitigación DoS:**  
   * Tras 3 intentos fallidos consecutivos, el cliente atacante es bloqueado por una ventana de enfriamiento de 60 segundos (`retryAfter: 60`).
   * Se comprobó que el cliente bloqueado recibe inmediatamente `HTTP 429` sin incrementar innecesariamente el contador de fallos globales, evitando que un atacante sature el servicio para denegar el acceso a otros dispositivos legítimos de la LAN.

