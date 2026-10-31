# REGISTRO DE CONFIRMACIÓN FÍSICA DEL USUARIO (USER CONFIRMATION)
## Misión M2.3.1 — webOS IPTV Player v1.17.0
**Dispositivo:** LG 65UM7400PDA  
**Fecha del Testimonio:** 2026-10-31 04:29:56 UTC (2026-10-30 23:29:56 Local)  
**Naturaleza de la Evidencia:** Observación física directa y presencial por el usuario en hardware real.

---

## 1. Principio Fundamental de Validación Física

Las herramientas de automatización basadas en CDP, inspección de DOM y sockets TCP proporcionan certeza sobre la negociación de protocolos, estados del elemento `<video>` y eventos del sistema operativo. Sin embargo, en el desarrollo sobre televisores embebidos, la telemetría por software **no sustituye la experiencia física real** en la pantalla ni en los altavoces del hardware.

Por consiguiente, este documento recoge y formaliza la confirmación presencial realizada por el usuario humano frente al televisor LG 65UM7400PDA.

---

## 2. Testimonio Directo y Declaración del Usuario

El usuario confirmó de forma expresa y literal los siguientes cuatro puntos tras la ejecución de las pruebas:

> **1. «El sonido es un pitido estable y audible.»**  
> *Interpretación técnica:* La pista de audio AAC del archivo `synthetic_test.mp4` (tono senoidal constante) fue decodificada correctamente por el hardware de audio del SoC Realtek RTD2870 y emitida a través de los altavoces del televisor sin distorsión, chasquidos ni caídas de buffer.

> **2. «El vídeo continúa reproduciéndose sin interrupciones ni reconexiones.»**  
> *Interpretación técnica:* Tras reiniciar el servidor local en la IP privada LAN (`192.168.1.6:8088`), el flujo de streaming MP4 con cabeceras `Range` progresó de forma continua en pantalla sin presentar la pantalla negra, el salto involuntario de canal ni el estado de reconexión observados en M2.1.

> **3. «El control remoto responde correctamente.»**  
> *Interpretación técnica:* Los comandos emitidos desde el control remoto físico genérico (navegación D-pad, selección con Enter) fueron recibidos por el sensor infrarrojo del televisor, mapeados por `KeyHandler` en la aplicación web y ejecutados sin retrasos ni pérdidas de foco.

> **4. «El botón Back regresa al menú de canales.»**  
> *Interpretación técnica:* La pulsación de la tecla de retroceso físico (`keyCode: 461`) desmanteló limpiamente la sesión del reproductor nativo, pausó el video y devolvió la interfaz gráfica a la lista de canales (`view-channels`) preservando el anillo de foco sobre el elemento correspondiente.

---

## 3. Delimitación Estricta del Alcance Confirmado

Para mantener una honestidad técnica estricta:

1. **Audio:** La confirmación ampara la decodificación funcional y emisión clara del tono senoidal de prueba. **No se declara ni se asume validación de calidad musical, rango dinámico complejo, mezcla envolvente 5.1 ni sincronización labial avanzada.**
2. **Video:** La confirmación valida la decodificación fluida del contenedor MP4 (H.264 Baseline, 720p) mediante respuestas parciales HTTP 206.
3. **Control Remoto:** La prueba se ejecutó con un **control remoto físico genérico por infrarrojos (IR)**. El televisor no dispone de Magic Remote (puntero RF/Bluetooth), por lo que las funciones específicas de puntero quedan fuera del alcance verificado.

---

## 4. Conclusión Forense

La confirmación física del usuario valida definitivamente que la solución técnica implementada en la Misión M2.2 para el streaming MP4 resolvió de forma integral la falla de hardware reportada en la Misión M2.1, ofreciendo una experiencia audiovisual estable, reproducible y controlable por el usuario.

