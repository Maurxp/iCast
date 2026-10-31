# Informe de Cierre de Seguridad y Endurecimiento Definitivo
## Misión M2.2.1.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Rama:** `fix/mission-2-2-stabilization`  
**Dispositivo Destino:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Chromium 53.0.2785.34, Node.js 0.12.2, ARMv7 Realtek RTD2870)  
**Estado:** Endurecimiento Completado — Cero interacción con el hardware  

---

## 1. Contexto y Objetivos de la Misión M2.2.1.2

La auditoría externa independiente confirmó satisfactoriamente:
- Paquete IPK candidato: 734.610 bytes, SHA-256 `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531`.
- Paquete ZIP consolidado M2.2.1.1: 3.855.469 bytes, SHA-256 `4598E871963ECED3F237324823F448CB49D85D1DF5FA545F44C9A7FC84F20B93`.
- Bloqueo de wildcards y validación sintáctica de IPs comprobados.

Para cerrar de forma definitiva el proceso antes de autorizar cualquier despliegue, la auditoría requirió resolver dos observaciones finales:
1. **Endurecer `getLanIp()` en `scripts/test-server.ts`:** Eliminar el tercer nivel de fallback (cualquier IPv4 no interna), restringir la selección automática de `--lan` exclusivamente a subredes privadas RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), documentar `isVirtualOrVpnInterface()` como una heurística (no una garantía física), rechazar explícitamente configuraciones ambiguas con múltiples candidatos privados exigiendo `--host <ip>`, y fallar de forma cerrada.
2. **Cerrar el inventario criptográfico interno:** Incorporar `CHECKSUMS.sha256` dentro del directorio `reports/` del archivo ZIP, resolver formalmente el problema de autorreferencia criptográfica y documentar los hashes exactos de los IPK y del archivo ZIP.

---

## 2. Resolución de la Observación 1: Endurecimiento de `getLanIp()`

Se aplicaron las siguientes modificaciones arquitecturales a `scripts/test-server.ts`:

### 2.1 Eliminación del Fallback a IPv4 No Privada
- Se eliminó completamente la regla que permitía seleccionar cualquier otra dirección IPv4 no interna.
- Ahora, la función `isRfc1918PrivateIpv4(ip)` comprueba estrictamente que la dirección pertenezca a:
  - Clase A: `10.0.0.0/8` (`10.0.0.0` a `10.255.255.255`)
  - Clase B: `172.16.0.0/12` (`172.16.0.0` a `172.31.255.255`)
  - Clase C: `192.168.0.0/16` (`192.168.0.0` a `192.168.255.255`)
- Cualquier dirección fuera de estos rangos (incluyendo direcciones públicas, link-local `169.254.0.0/16`, multicast `224.0.0.0/4`, CGNAT `100.64.0.0/10` o reservadas) es descartada sin excepción.

### 2.2 Documentación de la Heurística de Nombres de Interfaz
Se documentó formalmente en el código que `isVirtualOrVpnInterface()` es una heurística por coincidencia de patrones (regex) y no garantiza a nivel de sistema operativo que una interfaz sea hardware físico. Por ello, no se confía exclusivamente en el nombre: el filtrado de nombres se combina de forma obligatoria con la verificación estricta de subred RFC 1918 y la detección de ambigüedad.

### 2.3 Rechazo de Ambigüedad (Múltiples Interfaces Privadas)
Si tras el filtrado heurístico el equipo presenta dos o más direcciones privadas RFC 1918 distintas en interfaces activas, el servidor **no selecciona silenciosamente la primera**. En su lugar, aborta arrojando:
```text
Ambiguous LAN configuration: multiple RFC 1918 private IPv4 interfaces detected [<lista_de_candidatas>]. Automatic selection is refused for safety; please specify the intended interface explicitly via --host <ip>.
```
Esto previene que en máquinas multihomed o con interfaces puenteadas se enlace un adaptador no deseado.

### 2.4 Política Fail-Closed y Host Predeterminado
- Si no existe exactamente una candidata privada inequívoca, `getLanIp()` arroja una excepción clara y se detiene.
- El host predeterminado del servidor continúa siendo estrictamente `127.0.0.1:8088`.
- Se mantienen todas las validaciones de bloqueo de wildcards (`0.0.0.0`, `::`) y validación sintáctica de IP local.
- **Aislamiento:** El servidor no fue iniciado ni se abrieron sockets.

---

## 3. Resolución de la Observación 2: Cierre Criptográfico y Solución de Autorreferencia

### 3.1 Resolución del Problema de Autorreferencia
Matemáticamente, un archivo no puede contener su propio hash SHA-256 no trivial sin violar las propiedades de resistencia a preimagen de las funciones hash criptográficas. Intentar escribir el hash final del archivo ZIP dentro de un documento que a su vez se empaqueta en ese mismo ZIP altera los bytes del archivo y cambia su hash resultante.

Para resolver esto bajo estándares de ingeniería y auditoría de software:
1. **Inventario Interno (`reports/`):** Los archivos dentro del ZIP (`reports/CHECKSUMS.sha256`, `reports/ARTIFACT_INTEGRITY.md` y `reports/mission2_2_1_2.json`) contienen los hashes y tamaños exactos de los componentes empaquetados e inmutables:
   - Paquete IPK candidato: `com.lennylxx.iptv_1.17.0_all.ipk` (734.610 bytes, SHA-256 `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531`).
   - Paquete IPK de rollback: `com.lennylxx.iptv_1.17.0_all.ipk` de M2 (733.772 bytes, SHA-256 `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5`).
2. **Verificación Externa del ZIP:** El hash SHA-256 y tamaño exacto del archivo ZIP consolidado (`mission2_2_1_2-final.zip`) se calculan inmediatamente tras cerrar el archivo binario y se entregan en el archivo lateral de verificación `CHECKSUMS.sha256` y en el informe ejecutivo final de la misión.

---

## 4. Preservación del Paquete de Producción IPK

Los cambios de código de esta misión M2.2.1.2 se limitaron exclusivamente a:
- `scripts/test-server.ts` (servidor de desarrollo en PC).
- `src/utils/test-server.test.ts` (pruebas unitarias Vitest).
- Informes de auditoría en markdown y descriptores JSON.

Ninguno de estos archivos es procesado ni empaquetado en el IPK de producción (`ares-package` solo incluye `dist/`, `build/bundled-service/` y recursos visuales). La compilación de producción y el servicio Luna permanecen 100% idénticos.

Por tanto, el paquete IPK candidato se conserva sin modificaciones con su hash inmutable verificado:
- **Archivo:** `AUDIT_REPORTS/MISSION_2_2_1_2/package/com.lennylxx.iptv_1.17.0_all.ipk`
- **Tamaño:** 734.610 bytes
- **SHA-256:** `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531`

---

## 5. Garantía de Aislamiento del Hardware

Se certifica que:
- No se estableció ninguna conexión SSH, Luna, CDP ni HTTP con el televisor LG 65UM7400PDA.
- No se instalaron ni desinstalaron aplicaciones en el televisor.
- No se ejecutó ningún comando en el dispositivo físico.
- El televisor permanece encendido en su estado operacional validado con la versión M2.
- No se solicita autorización de despliegue en esta entrega.

