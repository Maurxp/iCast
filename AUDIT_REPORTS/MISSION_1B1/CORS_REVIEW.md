# AUDITORÍA Y HARDENING DE CORS — CORS REVIEW (RFC 1918)
## webOS IPTV Player v1.17.0 — Misión 1B.1

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Chromium 53 / Node.js 0.12.2)  
**Fecha:** 2026-10-29  
**Estado:** Implementado y Validado al 100%  

---

## 1. Problema de Seguridad Previo (Comprobación por Prefijo / Subcadena)

En implementaciones preliminares, la validación de orígenes CORS evaluaba la cabecera `Origin` mediante comprobaciones de subcadena o prefijo, por ejemplo:
```javascript
// Vulnerable: comprueba si la cadena comienza por '192.168.'
if (hostname.indexOf('192.168.') === 0) { ... }
```

### 1.1 Vector de Ataque por Dominio Mimético
Un atacante que registre un dominio como:
* `http://192.168.attacker.example`
* `http://10.attacker.example`
* `http://172.16.0.1.attacker.example`

lograría que `hostname.indexOf('192.168.') === 0` devolviera `true`. Si un usuario abriera dicho enlace en el navegador del televisor o en un teléfono conectado a la misma red, el navegador del atacante recibiría la cabecera `Access-Control-Allow-Origin: http://192.168.attacker.example`, permitiendo a su script leer respuestas que contuvieran datos sensibles.

---

## 2. Implementación de Validación Estricta RFC 1918

En `bundled-service/src/lan/server.ts`, la función `isAllowedOrigin(origin)` fue completamente reescrita para realizar un análisis sintáctico formal del URL y de los cuatro octetos decimales de la dirección IPv4.

### 2.1 Algoritmo Implementado

```typescript
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin || origin === 'null') return false;
  if (origin === 'file://' || origin.indexOf('file:///') === 0) return true;
  try {
    const parsed = parseUrl(origin);
    const protocol = parsed.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    const hostname = parsed.hostname;
    if (!hostname) return false;

    // Loopback hostnames (IPv4, localhost, IPv6 con y sin corchetes)
    const cleanHost = hostname.replace(/^\[|\]$/g, '');
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === '::1') {
      return true;
    }

    // Validación estricta de 4 octetos IPv4
    const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
    if (ipv4Match) {
      const o1 = parseInt(ipv4Match[1], 10);
      const o2 = parseInt(ipv4Match[2], 10);
      const o3 = parseInt(ipv4Match[3], 10);
      const o4 = parseInt(ipv4Match[4], 10);

      // Descartar números fuera del rango de byte (0-255)
      if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) return false;

      // 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
      if (o1 === 10) return true;

      // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

      // 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
      if (o1 === 192 && o2 === 168) return true;
    }
  } catch {
    // URL malformado
  }
  return false;
}
```

---

## 3. Matriz de Evaluación de Orígenes

| Caso de Prueba | Cabecera `Origin` | Evaluación | Cabecera ACAO Emitida | Comentario de Seguridad |
| :--- | :--- | :---: | :---: | :--- |
| **LAN Privada** | `http://192.168.1.50:8080` | **Aprobado** | Idéntico al origen | Octeto 192.168.x.x válido. |
| **LAN Privada** | `http://10.0.0.1:3000` | **Aprobado** | Idéntico al origen | Red 10.0.0.0/8 válida. |
| **LAN Privada** | `http://172.16.0.1` | **Aprobado** | Idéntico al origen | Red 172.16.0.0/12 (límite inferior). |
| **LAN Privada** | `http://172.31.255.254:9000` | **Aprobado** | Idéntico al origen | Red 172.16.0.0/12 (límite superior). |
| **Loopback** | `http://127.0.0.1:8080` | **Aprobado** | Idéntico al origen | Host loopback IPv4 estándar. |
| **Loopback** | `http://localhost:3000` | **Aprobado** | Idéntico al origen | Nombre loopback estándar. |
| **Loopback IPv6** | `http://[::1]:8080` | **Aprobado** | Idéntico al origen | Loopback IPv6 normalizado. |
| **Esquema App** | `file://` | **Aprobado** | Idéntico al origen | Empaquetado local de webOS. |
| **Ataque Prefijo** | `http://192.168.attacker.com` | **RECHAZADO** | **Ninguna (null)** | Dominio externo con prefijo numérico. |
| **Ataque Prefijo** | `http://10.attacker.com` | **RECHAZADO** | **Ninguna (null)** | Intento de engaño por prefijo. |
| **Ataque Prefijo** | `http://172.16.0.1.attacker.com`| **RECHAZADO** | **Ninguna (null)** | Subdominio con IP privada embebida. |
| **IP Fuera Rango** | `http://172.15.255.255` | **RECHAZADO** | **Ninguna (null)** | Menor a 172.16.0.0 (IP pública). |
| **IP Fuera Rango** | `http://172.32.0.1` | **RECHAZADO** | **Ninguna (null)** | Mayor a 172.31.255.255 (IP pública). |
| **IP Fuera Rango** | `http://192.169.1.1` | **RECHAZADO** | **Ninguna (null)** | IP pública adyacente a 192.168.0.0. |
| **IP Pública** | `http://8.8.8.8` | **RECHAZADO** | **Ninguna (null)** | DNS de Google (no privado). |
| **Dominio Web** | `https://evil-attacker-site.com`| **RECHAZADO** | **Ninguna (null)** | Servidor de ataque externo. |
| **Origen Opaco** | `null` | **RECHAZADO** | **Ninguna (null)** | Sandboxed iframe / data: URI. |
| **Sin Origen** | *(Cabecera ausente)* | **RECHAZADO** | **Ninguna (null)** | Peticiones normales no CORS. |

---

## 4. Tratamiento de Solicitudes OPTIONS (Preflight)

Para solicitudes CORS Preflight (`OPTIONS`):
1. **Origen Aprobado:**
   * Devuelve estado `204 No Content`.
   * Emite cabeceras de control:
     * `Access-Control-Allow-Origin: <origen exacto>`
     * `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
     * `Access-Control-Allow-Headers: Content-Type, Authorization, X-App-Token, X-Setup-Token`
     * `Access-Control-Max-Age: 86400`
2. **Origen No Aprobado:**
   * Devuelve estado `403 Forbidden`.
   * **NO** emite ninguna cabecera `Access-Control-Allow-Origin`.
   * **NUNCA** emite comodín `*`.

---

## 5. Resultados de Validación de Pruebas Automatizadas
La suite `Strict RFC 1918 CORS Validation (Frente B)` en `bundled-service/src/lan/server.test.ts` ejecuta 32 aserciones independientes probando cada combinación de orígenes válidos, dominios miméticos, IPs públicas y solicitudes preflight. **Todas las 32 pruebas pasaron con éxito de forma reproducible.**

