# ROADMAP TÉCNICO DE ADAPTACIÓN Y OPTIMIZACIÓN
## Dispositivo Objetivo: LG 65UM7400PDA (webOS 4.10.2 / API 4.1.0)
## Proyecto: webOS IPTV Player (v1.17.0)

---

## 1. ESTRUCTURA Y FASES DEL PLAN DE ACCIÓN

El presente roadmap establece las fases, prioridades y propuestas técnicas para adaptar y optimizar el reproductor específicamente para nuestro televisor LG 65UM7400PDA.

> **RECORDATORIO METODOLÓGICO:**  
> Ninguna de las modificaciones detalladas en este documento ha sido implementada durante la fase de auditoría. Se presentan de forma estructurada para su aprobación y ejecución en la fase de implementación posterior.

```
+---------------------------------------------------------------------------------------+
| FASE 1: Habilitación del Entorno de Compilación y Generación del Paquete (Host PC)   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| FASE 2: Adaptaciones de Compatibilidad y Seguridad de Datos                           |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| FASE 3: Afinamiento de Rendimiento y Memoria para Perfil ARMv7 1GB                    |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| FASE 4: Experiencia de Usuario 4K y Optimización para Magic Remote                    |
+---------------------------------------------------------------------------------------+
```

---

## 2. PROPUESTAS DETALLADAS POR CATEGORÍA

### A. Correcciones Obligatorias (Impedirían Instalar o Ejecutar)

#### PROP-OBL-001: Instalación de Dependencias Locales y Herramientas webOS en el Host
1. **Archivo Afectado:** Entorno del sistema PC host / `package.json`.
2. **Componente:** `node_modules` y CLI `@webos-tools/cli`.
3. **Problema Detectado:**
   El workspace local en `C:\Users\amaur\Desktop\webos-iptv-player` no cuenta con la carpeta `node_modules` instalada (las dependencias no se han descargado), y el sistema host Windows no tiene instalado globalmente el comando `ares-package`. Intentar compilar (`npm run build` o `build.sh`) falla inmediatamente.
4. **Modificación Propuesta:**
   * Ejecutar en el PC host: `npm install` para instalar dependencias de desarrollo (`esbuild`, `typescript`, `eslint`, etc.).
   * Instalar el conjunto de herramientas webOS CLI oficial: `npm install -g @webos-tools/cli` para disponer de `ares-package`, `ares-install`, `ares-device-info` y `ares-launch`.
5. **Beneficio Esperado:** Capacidad de generar el archivo `.ipk` empaquetado y firmado para su instalación directa.
6. **Riesgo:** Ninguno en el código base.
7. **Prioridad:** **Crítica / Bloqueante**.
8. **Complejidad Estimada:** Baja (10 minutos de ejecución estándar).

---

### B. Correcciones de Compatibilidad con webOS 4.x y Chromium 53

#### PROP-COM-001: Verificación de Parámetros de Ventana en `appinfo.json`
1. **Archivo Afectado:** `appinfo.json`.
2. **Componente:** Manifiesto de la aplicación.
3. **Problema Detectado:**
   El manifiesto actual define `"resolution": "1920x1080"` y `"transparent": false`. En algunos modelos de la generación webOS 4.x (SoC Realtek), cuando una aplicación web reproduce vídeo nativo a través de un elemento `<video>` estándar, el plano gráfico de Chromium puede superponerse opacamente sobre el plano de vídeo subyacente si la ventana no se configura con soporte explícito de "video-hole".
4. **Modificación Propuesta:**
   Añadir en `appinfo.json` la propiedad `"supportTouchMode": false` y asegurar que los estilos de fondo del contenedor del reproductor (`#video-player` y vistas activas) mantengan `background: transparent;` cuando el reproductor esté activo.
5. **Beneficio Esperado:** Garantiza que el plano de vídeo decodificado por hardware en `dvovideosink` se proyecte sin oclusión en el televisor.
6. **Riesgo:** Muy bajo.
7. **Prioridad:** **Alta**.
8. **Complejidad Estimada:** Muy baja.

---

### C. Optimizaciones de Rendimiento y Memoria (ARMv7 / 1GB)

#### PROP-PERF-001: Perfil de Rendimiento Predeterminado en `essential` para webOS 4
1. **Archivo Afectado:** `src/config.ts` / `src/services/storage-service.ts`.
2. **Componente:** `StorageService.getAnimationMode()`.
3. **Problema Detectado:**
   Por defecto, la aplicación puede inicializarse en modo de animaciones completas o reducidas, requiriendo transiciones CSS y suavizado de scroll en listas. En Chromium 53 bajo el procesador de 32 bits de la TV, esto genera pequeñas caídas de frames durante desplazamientos rápidos con el Magic Remote.
4. **Modificación Propuesta:**
   Configurar el valor predeterminado de `iptv_animation_mode` en `'essential'` cuando se detecte un User-Agent o runtime correspondiente a Chromium <= 68.
5. **Beneficio Esperado:** Desplazamiento instantáneo por coordenadas sin repintados continuos, reduciendo la carga de CPU en un ~15%.
6. **Riesgo:** Estético (las transiciones visuales se realizan de forma inmediata en lugar de animada).
7. **Prioridad:** **Media**.
8. **Complejidad Estimada:** Baja.

#### PROP-PERF-002: Límite Superior de Canales en Carga Directa M3U
1. **Archivo Afectado:** `src/parsers/m3u-parser.ts`.
2. **Componente:** `M3UStreamParser` (`maxChannels`).
3. **Problema Detectado:**
   Si el usuario añade una lista M3U gratuita global con más de 20,000 canales, el consumo de heap de V8 superará los 100 MB, arriesgando la terminación del proceso por el OOM-killer de Linux.
4. **Modificación Propuesta:**
   Introducir una alerta configurable o una partición por lotes si la lista supera los 8,000 canales, sugiriendo al usuario activar filtros de país/categoría o importar mediante Xtream Codes.
5. **Beneficio Esperado:** Estabilidad absoluta de la aplicación frente a listas maliciosas o desmesuradas.
6. **Riesgo:** Ninguno.
7. **Prioridad:** **Media**.
8. **Complejidad Estimada:** Media.

---

### D. Mejoras Multimedia

#### PROP-MED-001: Limpieza Agresiva de Decodificadores Hardware (VDEC) en Zapping
1. **Archivo Afectado:** `src/components/player-pipeline.ts`.
2. **Componente:** `PlayerPipeline.destroyLoaders()` / `playNative()`.
3. **Problema Detectado:**
   El televisor solo dispone de 2 decodificadores VDEC hardware (`qty = 2` en `umediaserver`). En zapping ultra rápido (cambiar 5 canales en menos de 2 segundos), la orden de parada a `starfish-media-pipeline` puede tardar ~300 ms en completarse, provocando que la apertura del siguiente canal encuentre temporalmente los decodificadores ocupados y lance error `MEDIA_ERR_DECODE`.
4. **Modificación Propuesta:**
   Asegurar un breve retardo de desconexión (debounce) de 150 ms en el comando de zapping si se detecta que el pipeline anterior todavía está en fase de teardown, evitando enviar una nueva solicitud de reproducción antes de liberar el bus multimedia.
5. **Beneficio Esperado:** Eliminación de errores esporádicos de pantalla negra al cambiar canales consecutivamente a gran velocidad.
6. **Riesgo:** Incremento imperceptible (150 ms) en el tiempo de cambio entre canales continuos.
7. **Prioridad:** **Alta**.
8. **Complejidad Estimada:** Media.

#### PROP-MED-002: Detección y Notificación de Streams AV1 no Soportados
1. **Archivo Afectado:** `src/components/player-pipeline.ts` / `src/utils/stream-info.ts`.
2. **Componente:** Detección de variantes de stream.
3. **Problema Detectado:**
   El chip Realtek RTD2870 no posee decodificador AV1 en hardware. Si un proveedor IPTV sirve un canal exclusivamente en AV1 (`av01`), la reproducción fallará de forma silenciosa o con un error genérico.
4. **Modificación Propuesta:**
   Identificar el FourCC `av01` en las variantes del manifiesto HLS o MPD y mostrar un mensaje claro en el OSD: *"Códec AV1 no compatible con el hardware de este televisor"*, seleccionando una variante H.264/HEVC si está disponible.
5. **Beneficio Esperado:** Información clara al usuario evitando diagnósticos confusos de fallo de red.
6. **Riesgo:** Ninguno.
7. **Prioridad:** **Media**.
8. **Complejidad Estimada:** Baja.

---

### E. Mejoras de Experiencia de Usuario (Magic Remote y Panel 4K)

#### PROP-UX-001: Ajuste de Tamaños de Tipografía para Panel de 65 Pulgadas (4K)
1. **Archivo Afectado:** `css/themes.css` / `src/components/settings.ts`.
2. **Componente:** Escalas de texto (`iptv_text_size`).
3. **Problema Detectado:**
   En un televisor de 65 pulgadas (LG 65UM7400PDA) visto a una distancia típica de salón (2.5 a 3.5 metros), los textos de la guía EPG en el ajuste por defecto pueden resultar pequeños para algunos usuarios.
4. **Modificación Propuesta:**
   Verificar y garantizar que el selector de tamaño de texto (`small`, `medium`, `large`, `xlarge`) aplique escalas basadas en `rem` calculadas para 1080p escalado a 4K, permitiendo seleccionar `large` de forma cómoda desde Ajustes.
5. **Beneficio Esperado:** Máxima legibilidad y confort visual en pantalla gigante.
6. **Riesgo:** Ninguno.
7. **Prioridad:** **Baja**.
8. **Complejidad Estimada:** Baja.

---

### F. Mejoras de Seguridad

#### PROP-SEC-001: Ofuscación / Cifrado Local de Credenciales en `localStorage`
1. **Archivo Afectado:** `src/services/storage-service.ts`.
2. **Componente:** `setPlaylists()` y `getPlaylists()`.
3. **Problema Detectado:**
   Las contraseñas de Xtream Codes y URLs IPTV se escriben en texto plano en `localStorage`.
4. **Modificación Propuesta:**
   Utilizar la API estándar `crypto.subtle` (presente y verificada en Chromium 53) para cifrar los campos sensibles (`password`, `token`) mediante AES-GCM con una clave derivada localmente, antes de escribirlos en `localStorage`.
5. **Beneficio Esperado:** Protección de las credenciales frente a inspección directa de archivos en televisores con acceso root o copias de seguridad de flash.
6. **Riesgo:** En caso de borrado de clave local, se requeriría reintroducir la contraseña.
7. **Prioridad:** **Media**.
8. **Complejidad Estimada:** Media.

---

## 3. RESUMEN DE PRIORIDADES PARA FASE DE IMPLEMENTACIÓN

| ID Propuesta | Título | Prioridad | Complejidad | Fase Sugerida |
|---|---|---|---|---|
| **PROP-OBL-001** | Instalación de dependencias y CLI webOS en el host | **Crítica** | Baja | Fase 1 (Inmediata) |
| **PROP-COM-001** | Ajuste de parámetros de ventana y vídeo en `appinfo.json` | **Alta** | Muy Baja | Fase 1 |
| **PROP-MED-001** | Limpieza agresiva de decodificadores VDEC en zapping | **Alta** | Media | Fase 2 |
| **PROP-PERF-001** | Perfil de animaciones `essential` por defecto | **Media** | Baja | Fase 2 |
| **PROP-SEC-001** | Cifrado de credenciales en `localStorage` | **Media** | Media | Fase 3 |
| **PROP-MED-002** | Manejo informativo de códec AV1 | **Media** | Baja | Fase 3 |
| **PROP-PERF-002** | Control de límites en listas M3U extremas | **Media** | Media | Fase 3 |
| **PROP-UX-001** | Ajuste de tipografía en pantalla 65" | **Baja** | Baja | Fase 4 |

