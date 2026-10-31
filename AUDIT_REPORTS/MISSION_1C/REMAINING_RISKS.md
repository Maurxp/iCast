# EVALUACIÓN DE RIESGOS RESIDUALES Y LIMITACIONES
## webOS IPTV Player v1.17.0 — LG 65UM7400PDA (Misión 1C)

**Fecha:** 2026-10-29  

---

## 1. Riesgos que Dependen Exclusivamente de Pruebas en el Televisor Real

Aunque todas las pruebas locales en PC pasan al 100%, existen particularidades del firmware comercial de LG Electronics que solo pueden ser confirmadas de forma definitiva sobre el televisor físico:

### 1.1 Exposición Exacta de Metadatos por `webos-service` en Node.js 0.12.2
* **Descripción:** En webOS OSE y versiones modernas de webOS TV, `ls-hubd` inyecta `msg.applicationId`. En algunas revisiones de webOS TV 4 comercial, la biblioteca C++ expone este dato a Node.js a través de `msg.sender` o como propiedad `applicationId` en el objeto `Message`.
* **Mitigación en Código:** Nuestra función `isAuthorizedCaller()` verifica ambos campos (`msg.applicationId` y `msg.sender`) y exige que cualquier campo presente coincida exactamente con `com.lennylxx.iptv` sin contradicciones.
* **Prueba Pendiente en TV:** Verificar durante el primer arranque en frío que la llamada legítima desde Chromium 53 sea aceptada por el servicio sin requerir ajustes en los nombres de campo.

### 1.2 Límites de Memoria RAM en el SoC Realtek RTD2870 (1 GB de RAM)
* **Descripción:** El televisor dispone de aproximadamente 1 GB de memoria RAM compartida entre el kernel Linux, el compositor gráfico de webOS, Chromium y los servicios de fondo.
* **Riesgo:** El proceso Node.js 0.12.2 del servicio maneja la subida y almacenamiento de listas M3U de hasta 10 MB. Durante el parseo y almacenamiento JSON, la memoria residente (RSS) de Node.js puede aumentar temporalmente.
* **Prueba Pendiente en TV:** Monitorear con `top` o `cat /proc/<pid>/status` el consumo RSS de Node.js al subir listas de gran tamaño (más de 50.000 canales) para asegurar que no se dispare el OOM Killer del kernel.

### 1.3 Rendimiento de Decodificación de Video en el Plano Nativo
* **Descripción:** La aplicación delega la reproducción a la etiqueta `<video>` nativa de webOS (acelerada por hardware por el chip RTD2870) o a Shaka Player para streams DASH.
* **Riesgo:** Streams con codecs no estándar o resoluciones no soportadas por el decodificador de hardware pueden causar caídas de cuadros (*frame drops*) o cierres de pipeline multimedia.
* **Prueba Pendiente en TV:** Validar la reproducción de canales en vivo en formatos HLS (TS y fMP4) y flujos MPEG-DASH.

---

## 2. Limitaciones Teóricas Conocidas

### 2.1 Garantía Criptográfica de Tiempo Constante en Node.js 0.12.2
* **Descripción:** La función `timingSafeEqualString` implementada en [compat.ts](file:///c:/Users/amaur/Desktop/webos-iptv-player/bundled-service/src/compat.ts) evita cortocircuitos algorítmicos mediante operaciones bit a bit (`mismatch |= codeA ^ codeB`) recorriendo toda la longitud de la cadena.
* **Limitación:** En un lenguaje de alto nivel interpretado por el motor V8 de Node.js 0.12.2, optimizaciones JIT, recolección de basura (*garbage collection*) y alineación de cadenas en memoria impiden garantizar matemáticamente una invariancia estricta a nivel de ciclos de reloj de CPU (como sí lo garantiza `CRYPTO_memcmp` de OpenSSL introducido en Node 6.6.0).
* **Evaluación de Riesgo:** Dado que las peticiones se realizan a través de la red local (con jitter de red de 1 a 10 ms), las variaciones sub-microsegundo de la CPU son completamente indistinguibles para un atacante en red.

### 2.2 Dependencia del Aislamiento de Sandbox de webOS
* **Descripción:** Asumimos que `WebAppManager` (WAM) asigna fidedignamente el `applicationId` y que ninguna aplicación sin privilegios de root puede falsificar su identidad de proceso ante el demonio `ls-hubd`.
* **Evaluación:** Este es el modelo de seguridad estándar de webOS. En un televisor rooteado con Homebrew Channel, si un atacante obtiene ejecución con privilegios de root en el sistema operativo, cualquier frontera a nivel de usuario queda anulada.

