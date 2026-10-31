# Implementación de Identidad de Marca iCast (BRAND_IMPLEMENTATION.md)
## Formalización del Isotipo B y Composición del Logotipo Oficial

**Proyecto:** iCast  
**Fase:** M3.1 — Brand Identity & Visual Foundations  
**Fecha:** 31 de Octubre de 2026  
**Referencia HIG:** Apple Human Interface Guidelines (`app-icons.md`, `branding.md`, `sf-symbols.md`)  

---

### 1. Adopción Formal del Isotipo B: Prisma Monocromático

Tras la comparativa formal de tres alternativas en la Misión M3.0.1, el usuario aprobó expresamente la **Alternativa B — Prisma Monocromático** como el isotipo definitivo de iCast.

```
                   ▲ (24, 8) Top Vertex
                  /|\
                 / | \
                /  |  \
   Facet TL    /   |   \    Facet TR (Platinum Highlight)
   [#4B4E59]  /    |    \   [#EDEDEF]
             /     |     \
 (10, 24) ◄ ───────┼─────── ► (38, 24)
             \     | (24,21)
   Facet BL   \    |    /   Facet BR (Silver Mineral)
   [#1E2026]   \   |   /    [#383B45]
                \  |  /
                 \ | /
                  \|/
                   ▼ (24, 40) Bottom Vertex
```

#### Validación Geométrica y de Renderizado (Chromium 53):
1. **ViewBox y Proporciones:** Retícula de 48×48 px con proporciones romboides de 28 px de ancho por 32 px de alto (eje vertical elongado para transmitir dinamismo y esbeltez).
2. **Cero Dependencia de Filtros Difusos:** El relieve óptico se genera exclusivamente mediante el contraste matemático de luminancia entre sus 4 facetas (`#EDEDEF` a `#1E2026`). No utiliza `filter: blur()`, `filter: drop-shadow()` ni composiciones costosas.
3. **Escalabilidad y Legibilidad por Tamaños:**
   - **16×16 px (Barra superior compacta):** La silueta romboide y el corte vertical central mantienen 100% de nitidez sobre la pantalla de televisión.
   - **24×24 px (Cabecera estándar y navegación):** Se aprecia el contraste entre la faceta superior derecha reflectiva y las sombras basales.
   - **32×32 px (Logotipo horizontal integrado):** Definición completa con aristas especulares de 1.0 px.
   - **48×48 px (Display y selección de perfil):** Apreciación detallada de los gradientes minerales lineales.
   - **80×80 px (App Icon de webOS):** Montado sobre el contenedor squircle mineral con radio de curvatura de 18 px.

---

### 2. Composición y Construcción del Logotipo

El logotipo oficial iCast se compone del isotipo Prisma B junto al identificador tipográfico:

```
┌─────────────────────────────────────────────────────────────┐
│    ÁREA DE PROTECCIÓN: Mínimo 16 px alrededor del marco     │
│                                                             │
│       [ PRISMA B ]    i C a s t                             │
│         (32 px)     ◄-14px-►  (24 px Bold, Tracking -0.4px) │
└─────────────────────────────────────────────────────────────┘
```

#### Reglas de Composición:
- **Separación Isotipo-Texto:** 14 px exactos (equivalente a `--space-3` y al ancho óptico del tallo del prisma).
- **Alineación Vertical:** El centro visual del texto "iCast" se alinea con el punto de refracción central del prisma `(y = 21)`.
- **Tratamiento Tipográfico:** La letra inicial `i` minúscula se distingue sutilmente en color titanio cálido (`#C8BFAF` en Obsidian / `#A99476` en Porcelain), mientras que `Cast` se expresa en el texto primario de alto contraste (`#EDEDEF` / `#252629`).
- **Área de Protección:** Ningún elemento de navegación o texto puede situarse a una distancia menor a la altura de la 'i' (16 px).
- **Tamaño Mínimo de Reproducción del Logotipo Completo:** 110 px de ancho por 24 px de alto.

---

### 3. Organización de Recursos Gráficos en el Repositorio

Los archivos vectoriales SVG oficiales se han estructurado en `assets/brand/`:

| Archivo | Formato | Dimensiones | Función en la Aplicación |
| :--- | :---: | :---: | :--- |
| `isotype_obsidian.svg` | SVG nativo | 48×48 px | Isotipo optimizado para modo oscuro y fondos minerales. |
| `isotype_porcelain.svg`| SVG nativo | 48×48 px | Isotipo optimizado para modo claro y fondos marfil/blancos. |
| `isotype_app.svg` | SVG nativo | 80×80 px | Isotipo montado sobre squircle mineral para icono de sistema. |
| `logo_horizontal_obsidian.svg`| SVG nativo | 160×44 px | Composición completa horizontal para cabeceras oscuras. |
| `logo_horizontal_porcelain.svg`| SVG nativo| 160×44 px | Composición completa horizontal para cabeceras claras. |

---

### 4. Análisis de Empaquetado webOS y Preservación de `appinfo.json`

Conforme a las instrucciones expresas de la misión:
- **`appinfo.json` No Modificado:** Se mantiene `"id": "com.lennylxx.iptv"`, `"title": "webOS IPTV Player"`, `"icon": "icon.png"` y `"largeIcon": "largeIcon.png"`.
- **Razón Técnica:** Modificar el título de la aplicación o sus iconos binarios en `appinfo.json` altera los metadatos leídos por Luna Bus durante la indexación del lanzador y requiere sincronización con `package.json` mediante `sync-version.mjs`. En M3.1 se integran los fundamentos visuales y assets en el código fuente; la actualización de metadatos de empaquetado del sistema operativo se ejecutará en la fase de empaquetado y release.

