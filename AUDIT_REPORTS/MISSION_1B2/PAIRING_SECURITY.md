# ANÁLISIS Y HARDENING DE SEGURIDAD DEL EMPAREJAMIENTO PIN — PAIRING SECURITY
## webOS IPTV Player v1.17.0 — Misión 1B.2 Frente E

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / Node.js 0.12.2 / Chromium 53)  
**Endpoint:** `POST /pair`  
**Fecha:** 2026-10-29  

---

## 1. Análisis de Espacio de Claves del PIN de 4 Dígitos

La funcionalidad de emparejamiento manual permite que un usuario en la red local introduzca en la pantalla web del teléfono (`/setup`) el código PIN numérico de 4 dígitos mostrado en el televisor LG:
$$\text{Espacio total de combinaciones} = 10^4 = 10.000 \text{ combinaciones } (0000 \text{ a } 9999)$$

### 1.1 Evaluación de Vulnerabilidades Anteriores
1. **Ataque de Canal Lateral por Tiempos (Timing Attacks):**
   La comprobación original utilizaba el operador de igualdad estándar de JavaScript:
   ```typescript
   if (submitted !== pairingCode)
   ```
   El motor V8 de Node.js interrumpe la comparación de cadenas en el primer byte diferente. Si bien la latencia de una red WiFi doméstica introduce ruido estadístico, en entornos locales de baja fluctuación un atacante automatizado puede explotar la diferencia de microsegundos para adivinar el PIN dígito a dígito.
2. **Limitación de Tasa Exclusivamente por IP de Cliente:**
   El contador de fallos se mantenía únicamente en `pairingAttempts[client]`.
   Si un atacante en la red local controlaba múltiples direcciones IP (por ejemplo, mediante alias de red, múltiples interfaces o distribución entre dispositivos comprometidos en la LAN), podía enviar peticiones en paralelo eludiendo el límite de 5 intentos por IP.
3. **Persistencia Indefinida del Código:**
   El `pairingCode` no caducaba nunca mientras el servicio no fuera reiniciado. Con un límite de 5 intentos por minuto por IP, un solo cliente podía probar las 10.000 combinaciones en aproximadamente 33 horas.
4. **Ausencia de Bloqueo Progresivo:**
   El tiempo de bloqueo era fijo (60 segundos tras 5 fallos). Tras cumplirse el minuto, el atacante tenía otros 5 intentos inmediatos a velocidad constante.

---

## 2. Medidas de Hardening Implementadas (Misión 1B.2)

### 2.1 Comparación en Tiempo Constante Compatible con Node 0.12.2
En Node.js moderno existe `crypto.timingSafeEqual`, pero esta API **no está disponible en Node.js 0.12.2** (incorporada a partir de Node 6.6.0).

Se diseñó e implementó en `bundled-service/src/compat.ts` una función pura de comparación en tiempo constante:
```typescript
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const codeA = i < a.length ? a.charCodeAt(i) : 0;
    const codeB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= codeA ^ codeB;
  }
  return mismatch === 0;
}
```
* **Garantías Criptográficas:**
  * Itera exactamente `Math.max(a.length, b.length)` veces sin bifurcaciones tempranas.
  * Acumula diferencias mediante operaciones bit a bit (`|= codeA ^ codeB`).
  * Es 100% compatible con el runtime Node 0.12.2 del televisor LG 65UM7400PDA y con Node moderno en desarrollo.

---

### 2.2 Bloqueo Global de Red (Global Lockout Threshold)
Se implementó un acumulador global de intentos fallidos en `bundled-service/src/lan/server.ts`:
* Constantes:
  * `GLOBAL_PAIRING_MAX_FAILURES = 20`
  * `GLOBAL_PAIRING_LOCK_MS = 5 * 60 * 1000` (5 minutos)
* **Comportamiento:**
  * Si la suma de fallos de todos los clientes de la red local alcanza 20 intentos, se activa un bloqueo global inmediato de 5 minutos (`HTTP 429 Too Many Requests`).
  * **Rotación Inmediata de PIN:** Al activarse el bloqueo global, el `pairingCode` **se invalida y regenera aleatoriamente de inmediato**, destruyendo cualquier progreso o cálculo que el atacante hubiera acumulado.
  * Se emite `onChange('setup-changed')` para que la pantalla de Ajustes del televisor actualice automáticamente el PIN visible.

---

### 2.3 Bloqueo Progresivo Exponencial por Cliente (Progressive Lockout)
Para ralentizar drásticamente los ataques continuados desde una misma IP:
* Intentos 1 a 4: `401 Unauthorized` (permite corrección de errores tipográficos humanos).
* Intento 5: Bloqueo base de 60 segundos (`HTTP 429`).
* Intentos 6 a 8+: Multiplicador exponencial $60\text{s} \times 2^{(\text{fallos} - 5)}$, con tope en 300 segundos (5 minutos):
  * Intento 5: 60s
  * Intento 6: 120s
  * Intento 7: 240s
  * Intento 8+: 300s (5 min)

---

### 2.4 Caducidad y Rotación de Código PIN
* **Tiempo de Vida (TTL):** El código PIN tiene una caducidad predeterminada de 15 minutos (`PAIRING_CODE_TTL_MS = 15 * 60 * 1000`). Si nadie completa el emparejamiento en 15 minutos, la siguiente consulta o intento genera un nuevo PIN criptográfico aleatorio.
* **Rotación tras Emparejamiento Exitoso:** Soporta la opción configurable `rotateOnSuccess: true`, regenerando el PIN una vez que un cliente legítimo ha canjeado el código por el `setupToken`.

---

## 3. Matriz de Resistencia a Fuerza Bruta

| Parámetro | Antes de M1B.2 | Con Hardening M1B.2 |
| :--- | :---: | :---: |
| Algoritmo de Comparación | `===` (tiempo variable, fuga de tiempos) | `timingSafeEqualString` (tiempo constante) |
| Intentos antes de Bloqueo por IP | 5 | 5 |
| Escalado de Bloqueo por IP | Fijo en 60 segundos | Progresivo exponencial (60s -> 300s) |
| Límite Global de Fallos en LAN | Ninguno (ataque distribuido ilimitado) | 20 fallos totales -> Bloqueo global de 5 min |
| Rotación ante Ataque Detectado | Ninguna (código permanecía idéntico) | Inmediata (se destruye el PIN atacado) |
| Caducidad Automática (TTL) | Indefinida | 15 minutos |
| Probabilidad de Acierto en 20 Intentos | $\frac{20}{10.000} = 0.2\%$ | $\frac{20}{10.000} = 0.2\%$ y el código se invalida |

---

## 4. Pruebas Unitarias Automatizadas

Las mejoras fueron incorporadas en `bundled-service/src/lan/server.test.ts` bajo la suite `Pairing Security & Hardening (Misión 1B.2 Frente D & E)`:
* `rotates pairing code immediately on successful pairing when rotateOnSuccess is true`: Pasa.
* `triggers global lockout and rotates pairing code after 20 network-wide failures`: Pasa.
* `expires pairing code after pairingTtlMs`: Pasa.
* Pruebas de `timingSafeEqualString` en `bundled-service/src/compat.test.ts`: 8 casos de prueba pasan.

