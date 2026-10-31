# EVALUACIÓN DE RIESGOS REMANENTES Y FRONTERAS DE CONFIANZA — REMAINING RISKS
## webOS IPTV Player v1.17.0 — Misión 1B.2

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Node.js 0.12.2 / ARMv7 32-bit)  
**Fecha:** 2026-10-29  

---

## 1. Declaración de Honestidad Técnica: Limitaciones Inmutables de webOS TV 4

Con la culminación de la Misión 1B.2, todas las vulnerabilidades identificadas a nivel de aplicación, servicio Node.js y comunicación de red local han sido mitigadas mediante código verificado.

Sin embargo, como ingenieros de sistemas embebidos, debemos dejar constancia explícita de aquellas limitaciones arquitectónicas inherentes al firmware propietario de webOS TV 4.x que no pueden ser resueltas unilateralmente por el código de una aplicación sideloaded:

### 1.1 Inexistencia de ACG Declarativo en Paquetes de Terceros
* En webOS OSE moderno o en webOS 6+, el sistema operativo cuenta con soporte para listas de control de acceso criptográficas (ACG - Access Control Groups).
* En **webOS TV Lite 4.10.2**, el subsistema `appinstaller` rechaza o ignora manifiestos de roles `.role.json` para aplicaciones no firmadas por LG en la raíz del sistema.
* **Consecuencia:** La plataforma **no** rechaza las conexiones al bus Luna a nivel de kernel/demonio antes de que lleguen al proceso del servicio. La protección descansa enteramente en la lógica defensiva que hemos implementado en `isAuthorizedCaller` dentro de `bundled-service/src/lan/service.ts`.

### 1.2 Dependencia de la Fidelidad de `msg.applicationId` en `ls-hubd`
* Nuestra defensa en `service.ts` confía en que el binario de sistema `ls-hubd` inyecta de forma inalterable el campo `msg.applicationId` al despachar mensajes originados en el navegador webOS (`PalmServiceBridge`).
* Si bien esto está documentado y verificado en la arquitectura de webOS, el comportamiento exacto de `ls-hubd` ante llamadas emitidas desde binarios nativos ELF de C ejecutados como usuario root (por ejemplo, utilidades de Homebrew ejecutadas vía telnet/SSH) puede variar.
* **Estado:** `[PARCIALMENTE COMPLETADO / REQUIERE CONFIRMACIÓN EN DISPOSITIVO FÍSICO]`. Para auditar formalmente si un proceso nativo en el televisor puede suplantar `applicationId`, se requerirá una prueba de inyección dinámica cuando se habilite el acceso SSH al televisor.

---

## 2. Matriz de Riesgos Remanentes y Mitigaciones Existentes

| Riesgo Remanente | Nivel de Severidad | Probabilidad | Mitigación Actual en M1B.2 | Acción Requerida en Futura Misión |
| :--- | :---: | :---: | :--- | :--- |
| **Suplantación de `applicationId` por binario nativo en TV rooteado** | Medio | Baja | Los métodos Luna no devuelven `setupToken` ni `pairingCode`. Solo se expone `appToken` que controla el puerto local. | Ejecutar script de prueba con `luna-send` desde SSH en el televisor real para caracterizar metadatos inyectados. |
| **Ataque de fuerza bruta de PIN por botnet local masiva** | Bajo | Mínima | Bloqueo global tras 20 intentos en 5 min con **rotación inmediata y destrucción del PIN**. | El usuario puede deshabilitar el emparejamiento manual una vez configurada la app. |
| **Ataque físico por HDMI / CEC** | Informativo | Despreciable | Fuera del alcance del software. | No aplica. |
| **Agotamiento de almacenamiento por subidas M3U legítimas muy grandes** | Bajo | Media | Límite estricto de 20 MB por subida impuesto en `readBody(req, 20 * 1024 * 1024)`. | Monitor de cuota en disco en la UI de Ajustes. |

---

## 3. Plan de Pruebas Dinámicas Pendientes en el Televisor Real

Cuando se autorice la siguiente fase en el televisor físico LG 65UM7400PDA (IP `192.168.1.8`), se deberán ejecutar las siguientes comprobaciones de caja negra y caja blanca:

1. **Prueba de Inyección desde CLI Luna:**
   Ejecutar desde terminal SSH en el televisor:
   ```bash
   luna-send -n 1 luna://com.lennylxx.iptv.service/start "{}"
   luna-send -n 1 luna://com.lennylxx.iptv.service/getInfo "{}"
   ```
   Verificar que `getInfo` no retorne ningún secreto y que `start` se comporte de forma determinista ante llamadores de terminal sin `applicationId`.
2. **Prueba de Invocación Cruzada entre Apps:**
   Instalar una aplicación de prueba mínima `com.test.caller` en el televisor y verificar que al invocar `luna://com.lennylxx.iptv.service/start` reciba estrictamente `{ returnValue: false, errorText: 'Unauthorized' }`.
3. **Auditoría de Logs en Vivo:**
   Ejecutar `ares-inspect -a com.lennylxx.iptv` durante el arranque y verificar que la consola de depuración no imprima ningún token ni contraseña.

