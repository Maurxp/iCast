# Matriz de Riesgos Residuales y Limitaciones del Entorno
## Misión M2.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  

---

## 1. Riesgos Residuales Identificados

| ID | Área | Descripción del Riesgo | Severidad | Mitigación Implementada | Estado |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **R1** | Multimedia | Servidores externos de MP4 que no soporten HTTP Range (`Range: bytes=`) o carezcan de átomo `moov` al inicio (*FastStart*). | **MEDIA** | El reproductor clasifica el error y conmuta automáticamente al siguiente canal en 2 segundos, marcando el canal como no disponible sin colgar la interfaz. | **Controlado** |
| **R2** | Red / CDP | El puerto `0.0.0.0:9998` sigue abierto en el televisor debido al daemon global `WebAppMgr`. | **BAJA** | Con `"inspectable": false` en `appinfo.json`, la aplicación no se registra en el catálogo CDP; los atacantes en LAN no pueden acoplarse al contexto de nuestra aplicación. | **Mitigado a nivel de aplicación** |
| **R3** | Hardware | Rendimiento y estabilidad de la decodificación por hardware de MP4 en el SoC Realtek RTD2870 bajo sesiones prolongadas. | **MEDIA** | La fixture sintética H.264/AAC 720p 30fps Main 3.1 cumple exactamente los límites de decodificación por hardware de webOS 4. | **Pendiente de Validación Física** |
| **R4** | Almacenamiento | Saturación de memoria en `/media/developer` si se generan registros excesivos o volcados de logs. | **BAJA** | La aplicación no escribe archivos de video en disco; el streaming es puramente en memoria y tubería GStreamer. | **Controlado** |

---

## 2. Limitaciones del Entorno de Desarrollo

1. **Persistencia del Puerto 9998:**
   Como se demostró en la Fase D, el socket `0.0.0.0:9998` es administrado globalmente por `WebAppMgr` cuando el televisor opera en modo desarrollador o con Homebrew Channel. Cerrar ese puerto a nivel de sistema requeriría modificar el binario del firmware o matar procesos centrales de webOS, lo cual está terminantemente prohibido para evitar brickear el televisor.
2. **Validación Física de MP4:**
   Dado que durante la Misión M2.2 está estrictamente prohibido realizar acciones destructivas o nuevas reproducciones en el televisor sin autorización previa del usuario, la reproducción real en pantalla física queda clasificada con el estado formal: **`PENDING_HARDWARE_VALIDATION`**.

