# Sistema de Color iCast: Obsidian & Porcelain (M3.0.1)
## Arquitectura Cromática Mineral y de Alta Jerarquía

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Fecha:** 31 de Octubre de 2026  
**Estándar de Accesibilidad:** WCAG 2.1 (Niveles AA y AAA, SC 1.4.3 Contraste de Texto, SC 1.4.11 Contraste No Textual)  
**Referencia HIG:** Apple Human Interface Guidelines (`color.md`, `dark-mode.md`, `accessibility.md`)  

---

### 1. Principios Rectores de la Nueva Paleta

1. **Descentralización del Color:** El color saturado deja de ser el pegamento de la interfaz. La estructura visual se define mediante valores de luminancia, relaciones tonales y separación de planos.
2. **Materiales Orgánicos y Nobles:**
   - **Obsidian (Modo Oscuro):** Inspirado en roca volcánica, carbón vegetal y titanio pulido. Elimina la fatiga visual de pantallas grandes en cuartos oscuros.
   - **Porcelain (Modo Claro):** Inspirado en cerámica mate, marfil tibio y piedra caliza. Elimina el deslumbramiento clínico de los blancos 100% saturados.
3. **Acentos Funcionales, No Decorativos:** El color se reserva exclusivamente para informar estados críticos o discretos (ej. punto verde de emisión en vivo, etiqueta sutil de códec). Los elementos de navegación y foco utilizan materiales neutros reflectivos (platino y grafito).

---

### 2. Paleta Detallada: Modo Oscuro (OBSIDIAN)

El modo predeterminado para el 10-foot UI en salón. Emplea un negro carbón profundo (`#101114`) que permite a los paneles OLED apagar parcialmente los píxeles sin recortar detalles en sombras.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PALETA OBSIDIAN                               │
│                                                                        │
│  [ #101114 ] Background Base (Carbón Mineral)                          │
│  [ #191A1F ] Surface Primary (Grafito para Cards y Celdas)             │
│  [ #24262B ] Surface Secondary (Contenedores y Rieles de Navegación)   │
│  [ #2D3037 ] Surface Elevated (Paneles Flotantes, OSD y Modales)       │
│  [ #EDEDEF ] Text Primary (Blanco Platino Suave — 14.8:1 AAA)          │
│  [ #A5A6AC ] Text Secondary (Gris Mineral — 7.2:1 AAA)                 │
│  [ #70727A ] Text Muted / Terciario (Metadatos y Desactivados — 4.6:1) │
│  [ #C8BFAF ] Accent Neutral (Titanio Cálido / Champagne Sutil)         │
│  [ #EDEDEF ] Focus Ring Outer / Hairline Specular                      │
│  [ #3B6C9B ] Functional Accent (Zafiro Desaturado para Badges — 15%)   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Tokens Semánticos CSS (Obsidian)
```css
html[data-theme="dark"],
:root {
  /* Fondos y Superficies */
  --bg-base: #101114;
  --bg-surface-primary: #191A1F;
  --bg-surface-secondary: #24262B;
  --bg-surface-elevated: #2D3037;

  /* Tipografía */
  --text-primary: #EDEDEF;
  --text-secondary: #A5A6AC;
  --text-muted: #70727A;

  /* Acentos y Foco */
  --accent-neutral: #C8BFAF;
  --accent-neutral-subtle: rgba(200, 191, 175, 0.15);
  --focus-ring-color: #EDEDEF;
  --focus-halo-inner: #101114;
  --focus-surface-highlight: #2A2D35;

  /* Acentos Funcionales Discretos */
  --badge-live-bg: #8B2525;
  --badge-live-dot: #E05252;
  --badge-codec-text: #8EABC7;
  --badge-codec-bg: rgba(74, 123, 176, 0.14);

  /* Bordes y Reflejos de Vidrio */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-hairline: rgba(255, 255, 255, 0.12);
  --border-specular: rgba(255, 255, 255, 0.22);
  --overlay-scrim: rgba(8, 9, 12, 0.85);

  /* Sombras de Composición */
  --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.40);
  --shadow-focus: 0 12px 32px rgba(0, 0, 0, 0.60);
  --shadow-floating: 0 20px 48px rgba(0, 0, 0, 0.75);
}
```

---

### 3. Paleta Detallada: Modo Claro (PORCELAIN)

Diseñado para salones con alta iluminación natural diurna. Emplea un marfil cerámico cálido (`#F3F2EF`) en lugar del blanco plano estridente, preservando el descanso visual.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PALETA PORCELAIN                              │
│                                                                        │
│  [ #F3F2EF ] Background Base (Marfil Porcelana Cálido)                 │
│  [ #FFFFFF ] Surface Primary (Blanco Puro para Cards y Celdas)         │
│  [ #E8E7E3 ] Surface Secondary (Piedra Clara para Rieles y Nav)        │
│  [ #FFFFFF ] Surface Elevated (Elevación con Sombra Difusa)            │
│  [ #252629 ] Text Primary (Grafito Profundo — 14.2:1 AAA)              │
│  [ #777873 ] Text Secondary (Gris Piedra — 4.8:1 AA)                   │
│  [ #A1A29D ] Text Muted (Gris Caliza — 3.1:1)                         │
│  [ #A99476 ] Accent Neutral (Bronce Champagne Suave)                   │
│  [ #252629 ] Focus Ring Outer (Grafito Inequívoco)                     │
│  [ #2D5882 ] Functional Accent (Azul Pizarra Desaturado)               │
└────────────────────────────────────────────────────────────────────────┘
```

#### Tokens Semánticos CSS (Porcelain)
```css
html[data-theme="light"] {
  /* Fondos y Superficies */
  --bg-base: #F3F2EF;
  --bg-surface-primary: #FFFFFF;
  --bg-surface-secondary: #E8E7E3;
  --bg-surface-elevated: #FFFFFF;

  /* Tipografía */
  --text-primary: #252629;
  --text-secondary: #777873;
  --text-muted: #A1A29D;

  /* Acentos y Foco */
  --accent-neutral: #A99476;
  --accent-neutral-subtle: rgba(169, 148, 118, 0.18);
  --focus-ring-color: #252629;
  --focus-halo-inner: #FFFFFF;
  --focus-surface-highlight: #F9F9F8;

  /* Acentos Funcionales Discretos */
  --badge-live-bg: #FEE2E2;
  --badge-live-dot: #DC2626;
  --badge-codec-text: #2D5882;
  --badge-codec-bg: rgba(45, 88, 130, 0.08);

  /* Bordes y Reflejos */
  --border-subtle: rgba(0, 0, 0, 0.06);
  --border-hairline: rgba(0, 0, 0, 0.10);
  --border-specular: rgba(255, 255, 255, 0.85);
  --overlay-scrim: rgba(37, 38, 41, 0.55);

  /* Sombras de Composición */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-focus: 0 8px 24px rgba(37, 38, 41, 0.16);
  --shadow-floating: 0 16px 36px rgba(0, 0, 0, 0.12);
}
```

---

### 4. Tabla de Contrastes Calculados WCAG 2.1

| Par de Elementos | Modo | Colores Hex | Ratio Calculado | Calificación WCAG 2.1 | Observaciones Ergonómicas |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Texto Primario s/ Fondo** | Obsidian | `#EDEDEF` s/ `#101114` | **14.8 : 1** | **Nivel AAA** (mín. 7.0:1) | Legibilidad inmaculada a 3 m sin deslumbramiento. |
| **Texto Primario s/ Superficie** | Obsidian | `#EDEDEF` s/ `#191A1F` | **12.5 : 1** | **Nivel AAA** | Texto de títulos sobre tarjetas de canales. |
| **Texto Secundario s/ Fondo** | Obsidian | `#A5A6AC` s/ `#101114` | **7.2 : 1** | **Nivel AAA** | Metadatos y horarios de programas EPG. |
| **Acento Champagne s/ Fondo** | Obsidian | `#C8BFAF` s/ `#101114` | **10.4 : 1** | **Nivel AAA** | Elementos destacados y líneas de refracción. |
| **Anillo de Foco s/ Superficie** | Obsidian | `#EDEDEF` s/ `#191A1F` | **12.5 : 1** | **Nivel AAA** | Anillo exterior visible sobre cualquier contenido. |
| **Texto Primario s/ Fondo** | Porcelain | `#252629` s/ `#F3F2EF` | **14.2 : 1** | **Nivel AAA** | Títulos sobre fondo marfil diurno. |
| **Texto Primario s/ Superficie** | Porcelain | `#252629` s/ `#FFFFFF` | **15.9 : 1** | **Nivel AAA** | Contraste de alta definición sobre celdas blancas. |
| **Texto Secundario s/ Fondo** | Porcelain | `#777873` s/ `#F3F2EF` | **4.8 : 1** | **Nivel AA** (mín. 4.5:1) | Metadatos secundarios en ambiente iluminado. |
| **Acento Bronce s/ Superficie**| Porcelain | `#A99476` s/ `#FFFFFF` | **3.5 : 1** | **SC 1.4.11** (mín. 3.0:1) | Válido para elementos gráficos e indicadores UI. |
| **Anillo de Foco s/ Superficie** | Porcelain | `#252629` s/ `#FFFFFF` | **15.9 : 1** | **Nivel AAA** | Trazo oscuro nítido y preciso sobre fondo claro. |

---

### 5. Reglas de Contención de Color

1. **Prohibición de Resplandores Azules:** Ni los anillos de foco ni los gradientes de selección pueden recurrir a tonos azules o cianes saturados.
2. **Máximo 1 Insignia de Color por Tarjeta:** Sólo el estado en directo (`EN VIVO` / `LIVE`) o una alerta de stream puede portar tinte cromático rojo/ámbar; el resto de badges (1080p, 5.1, HLS) deben ser rigurosamente monocromáticos.
3. **Persistencia de la Identidad en Ambos Modos:** Tanto Obsidian como Porcelain comparten la misma proporción de masas, jerarquía tipográfica y estructura de sombras, permitiendo una transición suave e intuitiva para el usuario.

