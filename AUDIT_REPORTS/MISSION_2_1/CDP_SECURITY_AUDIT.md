# AUDITORÍA DE SEGURIDAD DEL PUERTO CDP (TCP 9998) — MISIÓN M2.1
**Dispositivo:** LG 65UM7400PDA  
**Fecha:** 30 de Octubre de 2026  
**Responsable:** Ingeniero Senior de Seguridad y Software Embebido  
**Nivel de Severidad:** **ALTO (EN ENTORNOS LAN NO CONFIABLES)**

---

## 1. Verificación de Estado en el Hardware

Se inspeccionaron los puertos de escucha y la tabla de procesos del televisor:
```text
# netstat -tuln | grep 9998
tcp        0      0 0.0.0.0:9998            0.0.0.0:*               LISTEN
```

### 1.1 Proceso Responsable
```text
wam 3325 1.3 13.4 615980 132488 ? SLsl /usr/bin/WebAppMgr ... --remote-debugging-port=9998 ...
```
* **Enlace de Interfaz:** `0.0.0.0` (Todas las interfaces de red del televisor).
* **Alcance:** El puerto es accesible directamente desde cualquier computadora, teléfono móvil o dispositivo conectado a la misma red local (LAN / Wi-Fi) en `http://192.168.1.8:9998/json`.

---

## 2. Vector de Ataque y Análisis de Riesgo

Al estar abierto el protocolo Chrome DevTools Protocol (CDP) sin autenticación en la red local:

1. **Ejecución Arbitraria de Código en el Navegador (`Runtime.evaluate`):**  
   Cualquier cliente en la LAN puede enviar comandos JSON-RPC a través de WebSocket para ejecutar código JavaScript con los privilegios completos del origen `file:///media/developer/apps/...`.
2. **Exfiltración de Credenciales y Listas:**  
   Un atacante puede extraer el contenido completo de `localStorage` y `IndexedDB`, obteniendo contraseñas de cuentas Xtream, URLs privadas de listas M3U y tokens de sesión.
3. **Espionaje Visual (`Page.captureScreenshot`):**  
   Es posible capturar en tiempo real fotogramas de la pantalla del televisor sin el conocimiento ni consentimiento del usuario.
4. **Manipulación de Interfaz y Teclas:**  
   Es posible inyectar eventos de teclado (`Input.dispatchKeyEvent`) para cambiar canales, modificar ajustes o activar compras no autorizadas.

---

## 3. Causa Raíz de la Exposición

1. **Modo Desarrollador / Homebrew Channel del Sistema:**  
   En webOS TV con Homebrew Channel habilitado, el gestor del sistema (`WebAppMgr`) se inicia con el argumento global `--remote-debugging-port=9998`.
2. **Atributo `inspectable` en el Paquete:**  
   Las aplicaciones instaladas en `/media/developer/apps/` son tratadas por el System Application Manager (SAM) como aplicaciones de prueba. Si el archivo `appinfo.json` no define explícitamente `"inspectable": false`, SAM publica el objetivo de depuración en la lista `/json`.

---

## 4. Solución Recomendada para Producción

### 4.1 Configuración en `appinfo.json`
Para compilaciones de distribución final, establecer explícitamente:
```json
{
  "id": "com.lennylxx.iptv",
  "version": "1.17.0",
  "inspectable": false
}
```

### 4.2 Automatización en `esbuild.config.mjs`
Configurar el script de empaquetado para que `"inspectable": false` sea el valor por defecto en compilaciones estándar, permitiendo `"inspectable": true` únicamente cuando se invoque un flag explícito de depuración:
```javascript
// scripts/sync-version.mjs o esbuild.config.mjs
const isDebugBuild = process.env.WEBOS_DEBUG === 'true';
appinfo.inspectable = isDebugBuild;
```

### 4.3 Mitigación de Red Inmediata
En redes domésticas o compartidas, aislar el televisor en una VLAN para dispositivos IoT o restringir el tráfico entrante al puerto 9998 mediante las reglas de cortafuegos del router local.

