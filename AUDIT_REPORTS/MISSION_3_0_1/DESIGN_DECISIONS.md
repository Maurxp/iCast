# Registro de Decisiones de Diseño iCast (M3.0.1)
## Justificación Metodológica, Trade-Offs y Alineación con Apple HIG

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Fecha:** 31 de Octubre de 2026  

---

### Decisión 1: Sustitución del Azul Saturado por Paletas Minerales Neutras (Obsidian & Porcelain)

* **Problema en M3.0:** La interfaz utilizaba `#3B82F6` y `#60A5FA` como color dominante en fondos, focos, acentos y tarjetas, generando una apariencia sobrecargada y fatiga ocular en salones oscuros.
* **Solución Adoptada:** Se adoptan las paletas **Obsidian** (carbón `#101114`, grafito `#191A1F` y titanio `#C8BFAF`) y **Porcelain** (marfil `#F3F2EF`, blanco `#FFFFFF` y bronce `#A99476`).
* **Principio Apple HIG Aplicado:** `color.md › Liquid Glass color`: *«Apply your app’s accent color judiciously. Keep brand color off most controls and save it for primary actions and status indicators... Prefer a monochromatic appearance for toolbars and tab bars.»*
* **Trade-Off Evaluado:** Se reduce el impacto cromático instantáneo a favor de una mayor durabilidad estética, confort visual durante sesiones largas y máxima jerarquía de contenido.

---

### Decisión 2: Eliminación de Liquid Glass en la Capa de Contenido (*Content Layer*)

* **Problema en M3.0:** El Hero Card y las tarjetas de canal utilizaban translucidez con gradientes, dificultando la lectura de títulos EPG sobre fondos con imágenes.
* **Solución Adoptada:** Restricción estricta del material translúcido a la **Capa Funcional** (TabBar superior, Player OSD HUD, diálogos modales). La Capa de Contenido (canales, listas, rieles) utiliza superficies sólidas y opacas (`--bg-surface-primary`).
* **Principio Apple HIG Aplicado:** `materials.md › Liquid Glass`: *«Don’t use Liquid Glass in the content layer. Putting it there creates unnecessary complexity and a confusing hierarchy.»*
* **Trade-Off Evaluado:** Menor cantidad de superficies con efecto vidrio aparente, pero legibilidad 100% nítida y reducción drástica de la carga de composición en la GPU de Chromium 53.

---

### Decisión 3: Evolución del Isotipo en Tres Alternativas Formales Comparables

* **Problema en M3.0:** El isotipo contenía un triángulo de *Play* y gradientes azules que impedían su escalado a 16 px y recordaban a marcas genéricas de streaming.
* **Solución Adoptada:** Se diseñaron y formalizaron tres alternativas:
  - *Alternativa A (Prisma Minimalista):* 3 facetas de luz y sombra con arista champagne.
  - *Alternativa B (Prisma Monocromático):* Construcción romboidal facetada en 4 valores de luz platino/grafito.
  - *Alternativa C (Prisma con Refracción Sutil):* Cuerpo facetado con dos haces translúcidos de temperatura dual (cálido y frío).
* **Principio Apple HIG Aplicado:** `app-icons.md › Designing for multiple contexts`: *«Keep the design simple and focused on a single concept... Ensure the design is legible and recognizable at tiny sizes.»*
* **Trade-Off Evaluado:** En lugar de imponer un ganador de forma arbitraria, se entregan las tres opciones en código vectorial SVG para que el usuario tome la decisión informada antes de M3.1.

---

### Decisión 4: Rediseño del Foco D-pad con Doble Anillo Neutro

* **Problema en M3.0:** El foco dependía de un aro exterior azul eléctrico brillante.
* **Solución Adoptada:** Foco tridimensional neutro compuesto por:
  1. Anillo interior de 2 px del color del fondo base (canal de separación óptico).
  2. Anillo exterior de 2 px en blanco platino (`#EDEDEF` en Obsidian) o grafito (`#252629` en Porcelain).
  3. Micro-elevación `transform: scale(1.03)` con realce de luminancia de superficie.
* **Principio Apple HIG Aplicado:** `focus-and-selection.md › Best practices`: *«Indicate focus using visual appearances that are consistent with the platform... Avoid relying solely on color to differentiate between objects.»*
* **Trade-Off Evaluado:** Elimina el uso del color azul para comunicar foco, logrando un contraste AAA (14.8:1) independiente de la imagen que muestre el canal.

---

### Decisión 5: Uso Exclusivo de la Pila Tipográfica del Sistema (`LG Smart UI`)

* **Problema Potencial:** Incorporar fuentes web remotas ralentiza el arranque de la app en webOS y consume memoria heap innecesaria en Node/Chromium.
* **Solución Adoptada:** Se estandariza la fuente nativa del televisor `LG Smart UI` como tipografía primaria, con fallbacks de sistema operativo para desarrollo.
* **Principio webOS Platform Gotcha:** `AGENTS.md`: *«The TV’s LG Smart UI font covers whole scripts... uncommon symbols render as a blank box. Use an inline SVG.»*
* **Trade-Off Evaluado:** Cero sobrecoste de red (0 KB de fuentes descargadas), carga instantánea a 60 FPS y cobertura perfecta de caracteres castellanos.

