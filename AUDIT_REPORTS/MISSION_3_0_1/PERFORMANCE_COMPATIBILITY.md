# Evaluación de Rendimiento, Compatibilidad y Presupuesto de Hardware (M3.0.1)
## Auditoría Forense y Corrección de Hipótesis Técnicas para Chromium 53

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Fecha:** 31 de Octubre de 2026  
**Hardware Objetivo:** LG 65UM7400PDA  
- SoC: Realtek RTD2870 (K5LP) / ARMv7 32-bit Quad-Core  
- RAM Total del Sistema: 987,348 KB (~1 GB)  
- Motor Web: Chromium 53.0.2785.34 (webOS TV Lite 4.10.2-29 / Firmware 05.40.97)  
- Línea Base Medida en M2.3.1: RSS 107.8 MB | CPU en reposo < 0.5% | CPU decodificación HW < 5.0%  

---

### 1. Corrección Rigurosa de Afirmaciones de M3.0

En la Misión M3.0 se incluyeron afirmaciones entusiastas que no contaban con validación experimental física en el televisor:
- *«Costo de renderizado de 0 ms CPU»* — **Corregido:** La composición de capas transparentes en Chromium 53 siempre requiere tiempo de GPU/DMA, aunque no consuma ciclos de CPU directa.
- *«60 FPS garantizados»* — **Corregido:** 60 FPS es un **objetivo de diseño**, no una garantía hasta que se ejecute la validación física en M3.7 mediante telemetría con `tv.sh diag`.
- *«Coste nulo en hardware»* — **Corregido:** Toda sombra proyectada (`box-shadow`) con radio de desenfoque (`blur-radius`) mayor a 20 px induce un coste de rasterizado en la GPU Mali del SoC Realtek.

---

### 2. Taxonomía de Evaluación Forense

Para garantizar la honestidad técnica exigida por el proyecto, cada aspecto del sistema de diseño se clasifica en una de cinco categorías:

1. **Objetivo de Diseño:** Meta visual o ergonómica deseada (ej. respuesta suave del foco en 140 ms).
2. **Hipótesis Técnica:** Suposición teórica basada en la especificación de Chromium 53 (ej. que las transformaciones de escala se componen enteramente en GPU).
3. **Propiedad CSS Utilizada:** Declaración sintáctica exacta aplicada en los estilos.
4. **Resultado Medido:** Dato empírico obtenido mediante pruebas reales en el televisor LG en M2.3.1.
5. **Validación Física Pendiente:** Comprobación instrumental que deberá realizarse en M3.7 antes del lanzamiento.

---

### 3. Matriz de Propiedades CSS y Compatibilidad en Chromium 53

| Propiedad CSS | Clasificación | Compatibilidad Chromium 53 | Fallback / Comportamiento Seguro | Coste de Renderizado Estimado | Riesgo en Hardware RTD2870 |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `background-color: rgba(...)` | **Resultado Medido** | 100% Nativo | Color sólido `#191A1F` si alfa falla. | Mínimo (composición alfa estándar). | **Bajo.** Comprobado estable en M2.3.1. |
| `linear-gradient(135deg, ...)` | **Resultado Medido** | 100% Nativo | Fondo plano sin gradiente. | Mínimo (se rasteriza una sola vez al pintar la superficie). | **Bajo.** Los gradientes estáticos no recalculan por frame. |
| `border: 1px solid rgba(...)` | **Propiedad CSS** | 100% Nativo | Borde gris opaco. | Despreciable. | **Nulo.** Líneas de 1 px son nativas en GPU. |
| `box-shadow: 0 12px 32px ...` | **Hipótesis Técnica** | 100% Nativo | Sombra plana `0 4px 8px` o borde simple. | Medio (desenfoque gaussiano de la sombra en raster). | **Moderado.** Limitar a elementos enfocados; no aplicar en 100 celdas simultáneas. |
| `transform: scale(1.03)` | **Hipótesis Técnica** | 100% Nativo | Cambio de color de borde sin escala. | Bajo si no altera el layout circundante. | **Bajo.** `scale()` en celdas aisladas no provoca reflow en el DOM. |
| `transition: transform 140ms` | **Objetivo de Diseño** | 100% Nativo | Salto discreto instantáneo sin animación. | Bajo (interpolación por hardware en hilo compositor). | **Bajo**, siempre que se limite a transform y opacity. |
| `@supports (backdrop-filter: ...)` | **Propiedad CSS** | **No soportado** (Ignorado limpiamente) | Vidrio Visual Óptico Nivel 1 (gradiente + opacidad). | Cero en webOS 4 (el bloque es omitido por el parser CSS). | **Nulo.** No degrada ni genera excepciones de sintaxis. |
| `will-change: transform` | **Hipótesis Técnica** | 100% Nativo | Omitir la directiva. | Reserva una capa gráfica en memoria VRAM. | **Moderado.** Debe usarse solo en el elemento enfocado, no globalmente. |

---

### 4. Telemetría de Hardware Real (Línea Base M2.3.1)

Los siguientes datos fueron registrados durante las pruebas de reproducción física en el televisor LG 65UM7400PDA:
- **Consumo de Memoria RSS del Navegador:** 107.8 MB (en reproducción HLS 1080p continua).
- **Consumo de Memoria del Servicio Luna:** 18.4 MB.
- **Memoria Libre del Sistema Operativo:** ~340 MB disponibles.
- **Carga de CPU en Reposo (Idle UI):** < 0.5% (con la interfaz estática sin eventos).
- **Carga de CPU en Reproducción HLS:** 3.8% – 4.5% (decodificación 100% en chip de hardware Realtek).

---

### 5. Presupuesto de Rendimiento Asignado para iCast (M3)

Para evitar fugas de memoria o saturación del recolector de basura de V8:

| Métrica del Sistema | Línea Base M2.3.1 | Presupuesto Límite M3 | Estado de Validación |
| :--- | :--- | :--- | :--- |
| **Memoria RSS Total App** | 107.8 MB | **≤ 120.0 MB** | Hipótesis Técnica (Validación en M3.7) |
| **Crecimiento de Bundle CSS** | 86.4 KB | **≤ 116.4 KB (+30 KB)** | Objetivo de Diseño (Verificable en build) |
| **Uso de CPU en Reposo** | < 0.5% | **≤ 1.0%** | Objetivo de Diseño (Validación en M3.7) |
| **Nodos DOM Activos Simultáneos**| ~600 nodos | **≤ 750 nodos** | Regla de Arquitectura (Virtualización) |
| **Latencia de Respuesta al D-pad**| ~12 ms | **< 16.6 ms (1 frame 60fps)**| Objetivo de Diseño (Validación en M3.7) |

---

### 6. Mitigaciones Técnicas de Seguridad en Renderizado

1. **Virtualización Estricta de Grilla:** Solo se mantienen en el DOM las filas visibles de canales más 2 filas de búfer superior e inferior. Esto impide que una lista de 500 canales cree miles de nodos que agoten la RAM.
2. **Prohibición de `box-shadow` Global:** Las sombras multicapa intensas se aplican **únicamente** a la tarjeta que tiene la clase `.focused` y al contenedor del `Player OSD HUD`. Las tarjetas en reposo utilizan únicamente un borde hairline de 1 px.
3. **Aislamiento de Pintura (*Paint Containment*):** Se evaluará en M3.1 la aplicación de `contain: layout style;` en las tarjetas de canal para asegurar que las actualizaciones de progreso EPG no disparen el repintado del resto de la pantalla.

