# Ergonomía del Control Remoto y Navegación en Salón (M3.0.1)
## Arquitectura D-pad First, Doble Anillo Neutro y Control de Foco

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Fecha:** 31 de Octubre de 2026  
**Hardware de Entrada:** Control Remoto Estándar por Infrarrojos (IR) y LG Magic Remote (Puntero Óptico RF)  
**Referencia HIG:** Apple Human Interface Guidelines (`focus-and-selection.md`, `keyboards.md`)  

---

### 1. La Regla de Oro de la Navegación en webOS

> *"Only the surface that owns the keys shows a focus ring."* (`AGENTS.md`)

En un televisor no existe el concepto de cursor flotante persistente ni enfoque pasivo. Cada pulsación en el D-pad debe mover de manera inmediata y predecible el foco hacia el elemento adyacente más cercano, pintando el anillo de foco **únicamente** en la superficie que posee el control de los eventos de teclado (`FocusScope` activo).

---

### 2. El Nuevo Estado de Foco iCast: Adiós al Resplandor Azul

En M3.0, el foco consistía en un aro azul neón brillante (`#60A5FA`).  
En M3.0.1, el foco se rediseña como un sistema **tridimensional neutro de tres capas**:

```
┌────────────────────────────────────────────────────────────────────────┐
│               ARQUITECTURA DEL ESTADO DE FOCO EN iCAST                 │
│                                                                        │
│   1. Anillo Exterior de Alto Contraste (2 px):                         │
│      Obsidian: Blanco Platino (#EDEDEF) | Porcelain: Grafito (#252629) │
│                                                                        │
│   2. Anillo Interior de Separación Óptica (2 px):                      │
│      Color exacto del fondo circundante (#101114 / #F3F2EF).          │
│      Crea un canal que aísla el foco de los colores de la imagen.     │
│                                                                        │
│   3. Micro-Elevación y Realce de Superficie:                           │
│      transform: scale(1.03);                                           │
│      background: var(--focus-surface-highlight);                       │
│      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.60);                     │
└────────────────────────────────────────────────────────────────────────┘
```

#### Código CSS del Foco Neutro (Chromium 53 Compatible)
```css
/* Modo Oscuro (Obsidian) */
html[data-theme="dark"] [data-focusable].focused,
html[data-theme="dark"] [data-focusable]:focus {
  outline: none;
  background-color: var(--focus-surface-highlight);
  border-color: var(--focus-ring-color) !important;
  box-shadow:
    0 0 0 2px var(--bg-base),
    0 0 0 4px var(--focus-ring-color),
    var(--shadow-focus);
  transform: scale(1.03);
  z-index: 10;
  transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1),
              background-color 140ms ease,
              box-shadow 140ms ease;
}

/* Modo Claro (Porcelain) */
html[data-theme="light"] [data-focusable].focused,
html[data-theme="light"] [data-focusable]:focus {
  outline: none;
  background-color: var(--focus-surface-highlight);
  border-color: var(--focus-ring-color) !important;
  box-shadow:
    0 0 0 2px #FFFFFF,
    0 0 0 4px var(--focus-ring-color),
    var(--shadow-focus);
  transform: scale(1.03);
  z-index: 10;
  transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1),
              background-color 140ms ease,
              box-shadow 140ms ease;
}
```

*Ventajas Clave:*
- **Visibilidad Universal:** Al contar con un anillo interior del color del lienzo y un anillo exterior de máxima luminancia, el foco es 100% visible sin importar si la miniatura del canal es negra, roja o blanca.
- **Sin Fatiga Ocular:** Sustituye el estímulo cromático agresivo por una percepción de relieve y precisión táctil.

---

### 3. Zonas de Confort y Mapa del Control Remoto

```
                 ┌───────────────┐
                 │     POWER     │
                 │   [1] [2] [3] │
                 │   [4] [5] [6] │
                 │   [7] [8] [9] │
                 │      [0]      │
                 ├───────────────┤
                 │  ▲ D-PAD UP   │  Navegación Vertical por Filas
   D-PAD LEFT ◄  │  ● OK / ENTER │  ► D-PAD RIGHT (Cambio de Columna)
                 │  ▼ D-PAD DOWN │
                 ├───────────────┤
                 │ [BACK] [GUIDE]│  Back: Cierre de Modales / Retorno
                 ├───────────────┤
                 │ (R) (G) (Y) (B)│  Teclas de Color Rápidas
                 └───────────────┘
```

#### Mapeo de Teclas de Color Rápidas (Color Keys)
El control remoto genérico de LG cuenta con 4 botones coloreados que iCast aprovecha como atajos directos sin pasar por menús:
- **Rojo (Red Key / Code 403):** Conmutar favorito del canal enfocado (agrega/quita la estrella).
- **Verde (Green Key / Code 404):** Abrir Guía EPG completa desde cualquier pantalla.
- **Amarillo (Yellow Key / Code 405):** Abrir selector modal rápido de Pistas de Audio.
- **Azul (Blue Key / Code 406):** Alternar Subtítulos (Off / Español / Inglés).

#### Jerarquía de la Tecla Atrás (Back Key / Escape)
La tecla `Back` opera mediante una pila de prioridad estricta:
1. Si hay un **Modal o Diálogo activo** (Ajustes, PIN, Confirmación), lo cierra y devuelve el foco al elemento invocador.
2. Si el **Player OSD HUD** está visible durante la reproducción, lo oculta de inmediato.
3. Si se está en una vista secundaria (Detalle de Película, Búsqueda), regresa a la grilla principal de canales.
4. Si se está en la raíz de la grilla de canales, despliega el diálogo de confirmación para salir de la aplicación.

---

### 4. Integración Híbrida con LG Magic Remote

El televisor LG 65UM7400PDA soporta puntero óptico RF (*Magic Remote*).  
Para evitar colisiones entre el movimiento del puntero y la navegación por D-pad:
1. **Modo Puntero Activo:** Al mover el Magic Remote, aparece el cursor y los elementos bajo el cursor reciben clase `data-ring-hover`.
2. **Modo D-pad Activo:** En el instante en que el usuario pulsa cualquier flecha de dirección, el puntero se oculta de inmediato y el foco geométrico toma el control exclusivo del `FocusScope`.
3. **Prevención de Doble Disparo:** Conforme a `AGENTS.md`, los componentes que se auto-activan portan el atributo `data-self-activate`, evitando que el evento `click` del puntero dispare una doble llamada al comando `select`.

