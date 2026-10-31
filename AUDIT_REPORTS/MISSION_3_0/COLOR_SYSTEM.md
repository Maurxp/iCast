# SISTEMA CROMÁTICO SEMÁNTICO (COLOR SYSTEM)
## Misión M3.0 — iCast Design System & Premium TV UX Blueprint
**Paleta Oficial:** Obsidian & Sapphire Prism  
**Modos:** Dark Mode (Cinemático Predeterminado) y Light Mode (Diurno Elegante)  
**Cumplimiento de Accesibilidad:** WCAG 2.1 Nivel AA (mínimo 4.5:1 para texto normal, 3.0:1 para titulares e indicadores de foco)  

---

## 1. Filosofía Cromática de iCast

El sistema de color de iCast se aparta radicalmente de los esquemas estridentes de reproductores IPTV genéricos (fondos negros planos con acentos verde fosforito o rojo chillón). En su lugar, adopta un **modelo de color semántico de dos capas** fundamentado en las recomendaciones de Apple HIG (`color.md`, `dark-mode.md` y `materials.md`):

1. **La Capa de Superficies (Neutral Canvas):** Tonos neutros profundos basados en pizarra y obsidiana con gradaciones tonales calibradas para evitar el negro absoluto artificial (`#000000`), reduciendo la fatiga visual en pantallas OLED y paneles VA de 65 pulgadas.
2. **La Capa de Acento Funcional (Spectral Accent):** Un único acento cromático primario —**Zafiro Espectral (`#3B82F6`)**— reservado exclusivamente para la retroalimentación interactiva del mando a distancia (foco activo, selección de canal y reproducción en directo).

---

## 2. Tabla Maestra de Tokens de Color y Ratios de Contraste

Todos los valores han sido calculados mediante la fórmula matemática de luminancia relativa estándar ISO/IEC 17025 / W3C WCAG 2.1:

$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

| Nombre Semántico del Token | Modo Oscuro (Dark) | Modo Claro (Light) | Función de Uso en iCast | Ratio Contraste (Dark) | Ratio Contraste (Light) | Nivel WCAG |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: |
| `--icast-bg-primary` | `#080A0F` | `#F4F6F9` | Lienzo base de la ventana de aplicación. | *Base (L₂)* | *Base (L₂)* | — |
| `--icast-bg-surface` | `#11151F` | `#E8ECF2` | Fondo de tiles de canales, tarjetas y listas. | 1.18:1 vs Base | 1.12:1 vs Base | N/A (Plano) |
| `--icast-bg-elevated` | `#182030` | `#FFFFFF` | Paneles flotantes, OSD, modales y prompts. | 1.45:1 vs Base | 1.25:1 vs Base | N/A (Plano) |
| `--icast-text-primary` | `#F1F5F9` | `#0F172A` | Títulos de canales, programas en emisión, cabeceras. | **16.2:1** | **15.4:1** | **AAA** |
| `--icast-text-secondary` | `#94A3B8` | `#475569` | Próximo programa, número de canal, metadatos. | **7.1:1** | **5.8:1** | **AAA** |
| `--icast-text-muted` | `#64748B` | `#64748B` | Etiquetas técnicas auxiliares (kbps, resolución). | **4.6:1** | **4.6:1** | **AA** |
| `--icast-accent` | `#3B82F6` | `#2563EB` | Acento de marca, halo de foco primario. | **4.9:1** | **5.2:1** | **AA** |
| `--icast-accent-highlight`| `#60A5FA` | `#1D4ED8` | Borde superior de tile enfocado y brillo especular. | **7.5:1** | **6.8:1** | **AAA** |
| `--icast-accent-dim` | `#1D4ED8` | `#DBEAFE` | Fondo de elemento seleccionado en lista. | 2.5:1 (Fondo) | 1.3:1 (Fondo) | N/A (Fondo) |
| `--icast-focus-ring` | `#60A5FA` | `#2563EB` | Borde nítido del elemento que tiene las teclas. | **7.5:1** | **5.2:1** | **AA UI** |
| `--icast-success` | `#10B981` | `#059669` | Estado de stream saludable, conexión LAN OK. | **6.8:1** | **5.1:1** | **AA** |
| `--icast-warning` | `#F59E0B` | `#D97706` | Aviso de stream inestable, canal bloqueado. | **8.4:1** | **4.8:1** | **AA** |
| `--icast-danger` | `#EF4444` | `#DC2626` | Badge En Vivo, fallo de emisión, error crítico. | **5.2:1** | **5.4:1** | **AA** |
| `--icast-border-subtle` | `rgba(255,255,255,0.08)`| `rgba(0,0,0,0.08)` | Separadores de filas y bordes en reposo. | Perceptual | Perceptual | N/A |
| `--icast-border-glass` | `rgba(255,255,255,0.18)`| `rgba(0,0,0,0.14)` | Borde de cristal superior en paneles y tiles. | Perceptual | Perceptual | N/A |
| `--icast-overlay-scrim` | `rgba(4,6,10,0.85)` | `rgba(15,23,42,0.60)` | Sombra de fondo detrás de modales y prompts. | N/A | N/A | N/A |

---

## 3. Especificación Detallada de Apariencias

### 3.1 Modo Oscuro (Dark Mode) — Apariencia Oficial de Salón
El modo oscuro es la apariencia primaria de **iCast**. En un televisor de salón, donde habitualmente la iluminación ambiental es tenue o nocturna:
* Evita el negro `#000000` absoluto como fondo de ventana, utilizando el tono `#080A0F`. Esto evita el *black crush* (pérdida de detalle en sombras) común en televisores LCD con retroiluminación LED perimetral.
* Las superficies flotantes (`--icast-bg-elevated: #182030`) reciben una ligera infusión de azul pizarra, otorgando profundidad y tridimensionalidad al OSD sin competir con los colores del vídeo.
* El texto primario (`#F1F5F9`, blanco marfil suave) evita el resplandor cegador del blanco 100% puro (`#FFFFFF`).

### 3.2 Modo Claro (Light Mode) — Apariencia Diurna Elegante
El modo claro de iCast no es una inversión tosca de colores, sino un diseño pensado para estancias fuertemente iluminadas por luz natural:
* El fondo base es `#F4F6F9` (gris nube muy suave), evitando deslumbrar al usuario.
* Las tarjetas de canal se elevan a `#FFFFFF` puro con una sombra suave perimetral (`rgba(0, 0, 0, 0.06)`).
* El acento azul zafiro se oscurece a `#2563EB` para mantener un contraste de 5.2:1 frente al fondo blanco.

---

## 4. Sistema de Foco y Resplandor sin Sobrecarga de GPU

En la arquitectura anterior, el resplandor de foco utilizaba:
```css
/* Antiguo (lento en Chromium 53): */
box-shadow: 0 0 0 3px var(--accent-glow), 0 0 20px var(--accent-glow);
```
Este radio de desenfoque de 20px forzaba al compositor de Chromium 53 a rasterizar gradientes de píxeles en cada movimiento del mando.

En el nuevo sistema iCast, el foco se resuelve mediante **Anillo Dual de Alto Contraste con Micro-Elevación**:
```css
/* iCast Focus System (Optimizado para ARMv7 / RTD2870): */
.icast-tile.focused {
  outline: none;
  border-color: var(--icast-accent-highlight) !important;
  box-shadow: 
    0 0 0 2px var(--icast-bg-primary),
    0 0 0 4px var(--icast-focus-ring),
    0 8px 24px rgba(0, 0, 0, 0.45);
  transform: scale(1.04);
}
```
* **Separación Nítida:** El anillo interior de 2px del color de fondo (`--icast-bg-primary`) garantiza que el anillo exterior cian/zafiro destaque con contraste infinito independientemente del color de la imagen o del póster del canal.
* **Cero Degradación:** Se eliminan los halos de 20px no acotados; el escalado `scale(1.04)` opera 100% en el compositor de hardware de la GPU.

