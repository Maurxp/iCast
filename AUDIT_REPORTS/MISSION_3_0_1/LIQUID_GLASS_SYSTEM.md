# Sistema Liquid Glass Refinado (M3.0.1)
## Equilibrio Material, Disciplina de Capas y Viabilidad en webOS 4

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Fecha:** 31 de Octubre de 2026  
**Hardware Objetivo:** LG 65UM7400PDA (Chromium 53.0.2785.34, SoC Realtek RTD2870, 1 GB RAM)  
**Referencia HIG:** Apple Human Interface Guidelines (`materials.md`, `liquid-glass.md`, `layout.md`)  

---

### 1. Corrección Crítica del Error de Capas de M3.0

En la propuesta M3.0, se aplicó la clase `icast-glass` tanto al Hero Card como a las celdas de la grilla de canales.  
La auditoría mediante la skill *Apple Design* identifica esto formalmente como un **defecto de diseño**:

> [!CAUTION]
> **Defecto de Disciplina de Capas (HIG Checklist Item 1):**  
> *«Layer discipline. Glass appears only on floating controls and navigation. Glass on app backgrounds, cards, list rows, or content containers is a defect.»* (`liquid-glass.md › Review checklist`).  
> Colocar vidrio en tarjetas de contenido degrada la legibilidad de títulos y obliga al compositor de Chromium 53 a recalcular planos alfa innecesarios en la grilla virtualizada.

En M3.0.1, se restaura la disciplina estricta de **dos capas**:
1. **Capa de Contenido (*Content Layer*):** Tarjetas de canal, filas EPG, posters de películas y fondos de vista son **superficies sólidas y opacas** (`--bg-surface-primary`). Cero vidrio.
2. **Capa Funcional (*Functional Layer*):** Barra superior de navegación (`TabBar`), controles flotantes de reproducción (`Player OSD HUD`) y modales del sistema (`ConfirmationPrompt`, Ajustes). Es **el único lugar** donde se aplica el material translúcido.

---

### 2. Arquitectura de Materiales en 3 Niveles de Intensidad

Para balancear la estética moderna con la limitada GPU del SoC Realtek RTD2870, se definen tres niveles de material:

```
┌────────────────────────────────────────────────────────────────────────┐
│ NIVEL 1: MATERIAL BASE (Superficie Opaca Sólida)                       │
│ • Uso: Tarjetas de canales, grillas, paneles de catálogo, fondos.     │
│ • Propiedades: background-color sólido, border: 1px subtle.            │
│ • Costo: Cero impacto de composición; máximo contraste de texto.       │
├────────────────────────────────────────────────────────────────────────┤
│ NIVEL 2: MATERIAL TRANSLÚCIDO (Barra de Navegación Flotante)           │
│ • Uso: TabBar superior / lateral.                                      │
│ • Propiedades: Opacidad 88–92%, border-bottom hairline de 1 px,        │
│   gradiente diagonal estático muy tenue a 135° (sin blur dinámico).    │
│ • Comportamiento: Deja intuir el paso del contenido sin entorpecer.    │
├────────────────────────────────────────────────────────────────────────┤
│ NIVEL 3: MATERIAL DESTACADO (HUD de Reproductor y Modales del Sistema) │
│ • Uso: Player OSD sobre vídeo activo, ventanas de Ajustes y PIN.       │
│ • Propiedades: Opacidad 82–85%, bisel especular superior de 1 px       │
│   (rgba(255,255,255,0.20)), sombra multicapa difusa y scrim oscuro.   │
│ • Comportamiento: Garantiza lectura de subtítulos y controles.         │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Especificación Técnica de CSS para Chromium 53

Chromium 53 **no soporta `backdrop-filter`**. En lugar de forzar parches que congelan el hilo de la GPU, el sistema utiliza **Vidrio Visual Óptico** generado mediante propiedades nativas soportadas desde Chrome 1:

#### Nivel 2: Material Translúcido (Navegación Flotante)
```css
.icast-nav-bar {
  /* Fondo calibrado al 90% de opacidad para permitir contraste AAA */
  background-color: rgba(25, 26, 31, 0.92);
  /* Gradiente estático de refracción muy sutil */
  background-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(0, 0, 0, 0.08) 100%
  );
  border-bottom: 1px solid var(--border-hairline);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

html[data-theme="light"] .icast-nav-bar {
  background-color: rgba(243, 242, 239, 0.94);
  background-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.60) 0%,
    rgba(0, 0, 0, 0.03) 100%
  );
  border-bottom: 1px solid var(--border-hairline);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
```

#### Nivel 3: Material Destacado (Player OSD HUD & Modales)
```css
.icast-glass-prominent {
  background-color: rgba(20, 22, 28, 0.85);
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.07) 0%,
    rgba(255, 255, 255, 0.02) 40%,
    rgba(0, 0, 0, 0.25) 100%
  );
  border: 1px solid var(--border-hairline);
  border-top: 1px solid var(--border-specular);
  border-radius: 16px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 16px 48px rgba(0, 0, 0, 0.70);
}

html[data-theme="light"] .icast-glass-prominent {
  background-color: rgba(255, 255, 255, 0.92);
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.80) 0%,
    rgba(232, 231, 227, 0.40) 100%
  );
  border: 1px solid var(--border-hairline);
  border-top: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.90),
    0 12px 36px rgba(0, 0, 0, 0.14);
}
```

#### Mejora Progresiva Segura
Solo si el motor de renderizado soporta `backdrop-filter` (como en el navegador de desarrollo o en webOS 22+ con Chromium moderno), se activa el filtro dinámico sin afectar a webOS 4:

```css
@supports (backdrop-filter: blur(1px)) {
  .icast-glass-prominent {
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
    backdrop-filter: blur(20px) saturate(1.2);
  }
}
```

---

### 4. Garantía de Legibilidad y Descanso Visual

1. **Nunca Texto sobre Transparencia Pura:** Cualquier elemento de texto reside sobre un fondo con al menos un 85% de opacidad equivalente.
2. **Sin Colisión con Subtítulos:** El OSD del reproductor cuenta con un espaciado inferior de 32 px que respeta el área de renderizado de subtítulos (`::cue`), evitando que la interfaz tape los textos de diálogos.
3. **Desvanecimiento Suave del HUD:** Cuando no hay interacción durante 5 segundos, el OSD desaparece con una transición de opacidad de 180 ms (`transition: opacity 180ms ease, transform 180ms ease`), dejando la pantalla despejada para el visionado de vídeo nativo.

