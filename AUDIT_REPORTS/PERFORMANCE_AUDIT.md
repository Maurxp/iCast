# AUDITORÍA DE RENDIMIENTO, MEMORIA Y ESCALABILIDAD
## Evaluación en LG 65UM7400PDA (RAM disponible: ~400 MB / Chromium 53 Ignition)

---

## 1. PRESUPUESTO DE RECURSOS DEL DISPOSITIVO OBJETIVO

A partir de la inspección directa del kernel (`/proc/meminfo`) y de los procesos del sistema (`top`, `ps`), se establece el siguiente presupuesto de recursos para la aplicación:

| Recurso | Capacidad Total | Ocupación del Sistema en Reposo | Margen Seguro para la Aplicación |
|---|---|---|---|
| **Memoria RAM Espacio de Usuario** | 987 MB (Linux MemTotal) | ~550 MB (servicios webOS, tvservice, surface-manager) | **150 MB - 200 MB máximo** (superar 200 MB activa OOM-killer) |
| **Memoria V8 Heap (Chromium 53)** | Compartida con RAM del proceso | WebAppMgr en reposo: VmRSS ~51 MB | **Máximo 80 MB de Heap JS** antes de degradar GC |
| **Memoria CMA (Hardware Vídeo)** | 172 MB | Asignada dinámicamente por `starfish-media-pipeline` | Reservada exclusivamente para buffers de vídeo 4K |
| **CPU ARMv7 (4 núcleos)** | 4x Cortex-A73/A53 derivative | Carga en reposo: 5% - 9% | Mantener uso medio de CPU de la app < 25% |
| **Almacenamiento en Flash (`/media`)** | 617 MB total | 320 MB ocupados (apps existentes: Netflix, Disney, etc.) | **284 MB libres** (Caché de app no debe superar 50 MB) |

---

## 2. COMPORTAMIENTO CON LISTAS IPTV Y ESCALABILIDAD

### 2.1. Escenarios de Carga de Canales

#### Escenario A: Lista Pequeña (hasta 500 canales)
* **Consumo de Memoria:** ~8 MB en memoria JS.
* **Tiempo de Parseo:** < 150 ms en el Web Worker.
* **Experiencia de Usuario:** Instantánea. Desplazamiento fluido a 60 fps en el D-Pad del Magic Remote.

#### Escenario B: Lista Mediana (2,000 canales)
* **Consumo de Memoria:** ~20 MB en memoria JS.
* **Tiempo de Parseo:** ~500 ms en el Web Worker.
* **Experiencia de Usuario:** Excelente. La virtualización `VirtualList` solo renderiza en el DOM los ~12 canales visibles más 5 de sobreexploración (`overscan`), manteniendo el DOM con menos de 50 nodos.

#### Escenario C: Lista Masiva (5,000 a 15,000 canales)
* **Consumo de Memoria:** ~45 MB - 90 MB.
* **Tiempo de Parseo:** 1.5 a 3.5 segundos en el Web Worker.
* **Técnicas de Mitigación Implementadas en Código:**
  1. **Internación de Cadenas de Grupos:** `groupPool = new Map<string, string>()` (`src/parsers/m3u-parser.ts`, línea 55). Los nombres de categorías repetidos (ej. "DEPORTES", "CINE") se desduplican en memoria, evitando miles de copias de la misma cadena en el heap de V8.
  2. **String Detaching Batching:** `STRING_DETACH_BATCH_SIZE = 512` (`m3u-parser.ts`, línea 39). En el motor V8 de Chromium 53, una subcadena obtenida mediante `.slice()` retiene una referencia al búfer de la cadena padre original. Al procesar un archivo M3U de 20 MB, si se mantienen miles de rebanadas, V8 retiene el archivo completo en memoria por cada canal. El parser rompe explícitamente estas referencias concatenando una cadena vacía o forzando la desvinculación en lotes.

#### Escenario D: Listas Extremas (>25,000 canales mundiales)
* **Riesgo:** **ALTO**. Archivos M3U superiores a 40 MB de texto plano pueden generar picos de memoria durante el streaming fetch en el Worker (`fetchLimitedText`), acercando el proceso WebAppMgr al límite de 150 MB.
* **Recomendación de Optimización:** Para el televisor LG 65UM7400PDA, se recomienda encarecidamente utilizar conexiones **Xtream Codes** (que permiten solicitar categorías específicas mediante la API web de Xtream) en lugar de descargar archivos M3U monolíticos de decenas de megabytes.

---

## 3. AUDITORÍA DEL SISTEMA DE EPG (GUÍA DE PROGRAMACIÓN)

### 3.1. Arquitectura de Streaming XMLTV
El parser de XMLTV (`src/parsers/xmltv-parser.ts`) implementa una optimización crítica que salva la ejecución en webOS 4:
* **Filtrado Temprano en el Stream:**
  En lugar de parsear todo el XML en un árbol DOM gigante con `DOMParser` (lo que consumiría más de 100 MB de RAM y bloquearía el hilo principal durante 10 segundos), el parser lee por trozos (`chunks`) y evalúa:
  ```ts
  // Solo se admiten programas pertenecientes a los canales presentes en la lista del usuario:
  if (this.acceptedIds && !this.acceptedIds.has(channelId)) {
    this.stats.skippedFilter++;
    continue; // Descarta el programa inmediatamente antes de asignarlo a memoria
  }
  ```
* **Ventana Temporal Acotada:**
  Solo se retienen programas dentro de una ventana de tiempo relevante: desde `now - 7 días` hasta el límite futuro (`minTime`, `maxTime`).
* **Compactación Periódica del Búfer:**
  Cada 256 KB de lectura (`BUFFER_COMPACT_THRESHOLD = 256 * 1024`), el parser reajusta su cursor y elimina los fragmentos de texto ya procesados.

### 3.2. Rendimiento de la Cuadrícula EPG (`EpgGrid`)
* El componente `epg-grid.ts` organiza la visualización horizontal por horas y vertical por canales.
* Utiliza virtualización bidimensional y cálculo de índices de tiempo optimizados con búsqueda binaria (`src/utils/epg-time-index.ts`).

---

## 4. RENDERIZADO VISUAL Y CSS EN CHROMIUM 53

### 4.1. Ausencia de CSS Grid y Flex Gap
* En Chromium 53, `display: grid` y flex `gap` no existen.
* **Solución del Proyecto:**
  * La compilación genera márgenes calculados estáticamente en `css/legacy-webos-base.css` bajo la clase `html.q-no-flex-gap`.
  * La clase `html.q-no-flex-gap` es activada dinámicamente al bootear tras una prueba micrométrica en un elemento oculto (`src/engine-quirks.ts`).
  * Los fallbacks de Grid se manejan mediante `-webkit-box` y `-webkit-flex` en `css/legacy-webos-overrides.css`.
* **Impacto en Rendimiento:** **Excelente**. Al no forzar al navegador a interpretar reglas CSS modernas que descartaría o simularía torpemente, el motor de layout de WebAppMgr calcula el reflow y repaint a velocidad nativa.

### 4.2. Animaciones y Modos de Rendimiento
* En `src/services/storage-service.ts` existe la preferencia `iptv_animation_mode`:
  * `essential`: Desactiva transiciones CSS costosas y desplazamientos suaves, aplicando cambios inmediatos de scroll. **Recomendado para televisores con webOS 4**.
  * `reduced`: Animaciones mínimas.
  * `full`: Animaciones completas (pensado para webOS 22+ o PCs).
* Al arrancar en webOS 4, el reproductor puede configurarse en modo `essential`, garantizando máxima reactividad en el D-Pad del control remoto.

---

## 5. CICLO DE VIDA, EVENT LISTENERS Y FUGAS DE MEMORIA

### 5.1. Manejo de Oyentes de Eventos (Event Delegation)
* En lugar de enlazar listeners `click`, `mouseover` o `keydown` a cada uno de los cientos de elementos de la lista de canales, los componentes delegan los eventos a nivel de contenedor (`document.addEventListener` o en la raíz de la vista).
* Esto minimiza la cantidad de objetos en memoria retenidos por el Garbage Collector de V8.

### 5.2. Destrucción Determinista del Pipeline Multimedia
* Cada llamada a `PlayerPipeline.destroy()` o al cambiar de canal incrementa `this.loadToken`, cancela controladores de abort (`AbortController`), desmonta el motor MSE si estaba activo y limpia las referencias del elemento `<video>`.
* Esto garantiza que no queden flujos huérfanos consumiendo los 2 decodificadores VDEC del chip Realtek.

