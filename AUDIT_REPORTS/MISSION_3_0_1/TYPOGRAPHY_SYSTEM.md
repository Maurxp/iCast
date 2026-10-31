# Sistema Tipográfico iCast (M3.0.1)
## Jerarquía Visual de Salón (10-Foot UI) para webOS 4

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Fecha:** 31 de Octubre de 2026  
**Entorno Objetivo:** LG 65UM7400PDA (Chromium 53, 1920×1080 canvas, distancia de visionado 2.5 a 3.5 m)  
**Referencia HIG:** Apple Human Interface Guidelines (`typography.md`, `accessibility.md`)  

---

### 1. Pila Tipográfica Nativa y Fallbacks para webOS

En televisores inteligentes, cargar fuentes web personalizadas (Google Fonts, WOFF2) a través de la red representa un doble riesgo:
1. Retrasos de renderizado (*Flash of Invisible Text* o FOUT) en conexiones lentas.
2. Consumo extra de memoria heap en el compositor de Chromium 53.

Por ello, iCast utiliza la fuente del sistema webOS de alta calidad: **LG Smart UI**, complementada con fallbacks universales de sistema:

```css
--font-family-tv: 'LG Smart UI', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

#### Propiedades del Motor Tipográfico en Chromium 53
- **Renderizado de Glifos:** Chromium 53 utiliza FreeType sobre Linux embebido. Se aplica `-webkit-font-smoothing: antialiased;` para evitar bordes dentados a 1080p.
- **Soporte de Caracteres Hispanos:** `LG Smart UI` incluye cobertura nativa completa para todos los caracteres del castellano: `á, é, í, ó, ú, ü, ñ, Á, É, Í, Ó, Ú, Ü, Ñ, ¿, ¡`.
- **Regla de Símbolos Especiales:** Siguiendo la regla de oro de `AGENTS.md`, los símbolos matemáticos o flechas exóticas de Unicode que no residen en `LG Smart UI` se reemplazan estrictamente por iconos SVG vectoriales inline (`fill: currentColor`).

---

### 2. Escala Tipográfica Calibrada para 10-Foot UI

Para una pantalla de 65 pulgadas a 3 metros de distancia, el umbral de agudeza visual humana exige un tamaño mínimo absoluto de 12 px para badges y 16 px para texto de lectura continua.

```
┌──────────────┬──────────┬─────────────┬────────────┬─────────────────────────────┐
│ Token        │ Tamaño   │ Altura Línea│ Peso       │ Uso en Interfaz             │
├──────────────┼──────────┼─────────────┼────────────┼─────────────────────────────┤
│ --font-hero  │ 42 px    │ 50 px       │ 700 (Bold) │ Título de evento en Hero    │
│ --font-title1│ 30 px    │ 38 px       │ 700 (Bold) │ Cabeceras de sección / View │
│ --font-title2│ 24 px    │ 32 px       │ 600 (Semib)│ Nombre de canal en celda    │
│ --font-title3│ 19 px    │ 26 px       │ 600 (Semib)│ Programa EPG en curso       │
│ --font-body  │ 16 px    │ 24 px       │ 400 (Reg)  │ Sinopsis, descripción, menu │
│ --font-call  │ 14 px    │ 20 px       │ 500 (Med)  │ Horarios, metadatos, tags   │
│ --font-cap   │ 12 px    │ 16 px       │ 700 (Bold) │ Badges de códec y calidad   │
└──────────────┴──────────┴─────────────┴────────────┴─────────────────────────────┘
```

#### Definición de Tokens Tipográficos en CSS
```css
:root {
  --font-family: var(--font-family-tv);

  /* Escala de Tamaño */
  --text-size-hero: 42px;
  --text-size-title1: 30px;
  --text-size-title2: 24px;
  --text-size-title3: 19px;
  --text-size-body: 16px;
  --text-size-callout: 14px;
  --text-size-caption: 12px;

  /* Alturas de Línea */
  --text-lh-hero: 1.18;
  --text-lh-title: 1.25;
  --text-lh-body: 1.45;
  --text-lh-tight: 1.15;

  /* Tracking / Espaciado de Caracteres */
  --tracking-hero: -0.4px;
  --tracking-title: -0.2px;
  --tracking-body: 0px;
  --tracking-badge: 0.5px;
}
```

---

### 3. Jerarquía y Aplicación por Pantallas

1. **Tarjetas de Canales (Channel Tile):**
   - Número de canal: `--text-size-callout` (14 px) en peso 600 con color `--text-muted`.
   - Nombre de canal: `--text-size-title2` (24 px) en peso 600 con color `--text-primary`.
   - Programa en emisión: `--text-size-callout` (14 px) en peso 400 con color `--text-secondary`.
   - Badges de códec (1080p, HLS): `--text-size-caption` (12 px) en peso 700 con tracking espaciado (+0.5 px).
2. **Overlay de Reproducción (Player OSD HUD):**
   - Título del programa activo: `--text-size-title1` (30 px) en peso 700.
   - Tiempo transcurrido / restante: `--text-size-callout` (14 px) con fuente monoespaciada para evitar saltos de ancho.
3. **Modal de Ajustes y Diálogos:**
   - Título del modal: `--text-size-title1` (30 px).
   - Título de opción: `--text-size-title3` (19 px).
   - Explicación de opción: `--text-size-body` (16 px).

---

### 4. Tratamiento del Texto Largo y Truncado Seguro

En pantallas de TV, un título de canal o programa demasiado largo jamás debe desbordar verticalmente la celda alterando la grilla.
Se estandariza la regla de truncado horizontal con elipsis:

```css
.truncate-single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```
Para descripciones en el Hero card, se limita a un máximo de 2 líneas con altura fija para evitar repintados dinámicos en Chromium 53.

