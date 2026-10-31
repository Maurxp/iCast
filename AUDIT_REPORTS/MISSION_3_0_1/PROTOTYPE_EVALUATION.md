# Guía de Evaluación del Prototipo iCast (M3.0.1)
## Arquitectura del Prototipo Autónomo, Pantallas y Atajos de Teclado

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Ubicación:** `AUDIT_REPORTS/MISSION_3_0_1/prototypes/`  
**Fecha:** 31 de Octubre de 2026  

---

### 1. Arquitectura de Archivos del Prototipo

El prototipo es 100% independiente de frameworks, operando sobre HTML5 semántico, CSS3 modular y JavaScript Vanilla de baja complejidad:

```
AUDIT_REPORTS/MISSION_3_0_1/prototypes/
├── index.html                   # Página interactiva principal
├── README.md                    # Guía de ejecución rápida
├── styles/
│   ├── tokens.css               # Variables CSS maestras (Obsidian & Porcelain)
│   ├── glass.css                # Vidrio Nivel 1, 2 y 3 (Chromium 53 nativo)
│   └── layout.css               # Grillas, tipografía, foco y componentes
├── assets/
│   ├── logo_concept_a_minimalist.svg        # Alternativa A
│   ├── logo_concept_b_monochrome.svg        # Alternativa B
│   └── logo_concept_c_subtle_refraction.svg # Alternativa C
└── screenshots/                 # Capturas en resolución nativa 1080p
```

---

### 2. Superficies y Pantallas Representadas

El prototipo permite evaluar de forma inmediata y tangible todas las superficies demandadas:

1. **Barra Superior Flotante (`TabBar`):** Implementada con **Material Translúcido Nivel 2** (92% de opacidad, 1px hairline border). Incluye el selector dinámico de logotipos, pestañas de navegación y acciones rápidas.
2. **Hero Card Principal:** Ubicado estrictamente en la **Capa de Contenido** con fondo opaco mineral sólido (`#191A1F`), sin vidrio falso. Muestra badge de directo sutil, título destacado a 42 px y botones de acción.
3. **Carril Horizontal de Categorías:** Categorías rápidas con iconos monocromáticos y estados de foco con micro-elevación (`scale(1.03)`).
4. **Grilla de Canales en Vivo:** Celdas de 92 px de altura con logotipos squircle, números de canal, programas EPG con barras de progreso y badges monocromáticos (1080p, HLS).
5. **Estado de Foco Tridimensional:** Doble anillo neutro (anillo interior del color de fondo + anillo exterior platino/grafito) y realce de luminancia de superficie sin rastro de azul neón.
6. **Overlay Flotante del Reproductor (`Player OSD HUD`):** Implementado con **Material Destacado Nivel 3** flotando sobre el contenido. Incluye línea de tiempo, metadatos y botones de control multimedia (Pausa, Audio, Subtítulos).
7. **Modal de Ajustes del Sistema:** Diálogo centrado con efecto vidrio Nivel 3, scrim oscuro de fondo, selector de apariencia (Obsidian / Porcelain) y ajustes de reproducción.

---

### 3. Mapa de Controles de Teclado y Mando a Distancia

El prototipo puede manejarse de forma idéntica a un control remoto de TV mediante el teclado del ordenador:

| Tecla de Teclado | Función en el Control Remoto de TV | Acción en el Prototipo |
| :--- | :--- | :--- |
| **Flecha Arriba (▲)** | D-pad Arriba | Mueve el foco hacia la fila o sección superior con auto-scroll suave. |
| **Flecha Abajo (▼)** | D-pad Abajo | Mueve el foco hacia la fila o sección inferior con auto-scroll suave. |
| **Flecha Izquierda (◄)**| D-pad Izquierda | Desplaza el foco al elemento anterior en la misma fila. |
| **Flecha Derecha (►)** | D-pad Derecha | Desplaza el foco al siguiente elemento en la misma fila. |
| **Enter (↵)** | Botón OK / Seleccionar | Activa el elemento enfocado (reproduce canal, abre modal, pulsa botón). |
| **Escape / Backspace** | Tecla Atrás (Back) | Cierra el modal de Ajustes o el Player HUD si están abiertos. |
| **T / t** | *Atajo de Sistema* | **Alterna instantáneamente entre OBSIDIAN y PORCELAIN.** |
| **H / h o Espacio** | *Atajo de Reproductor* | **Muestra u oculta el Player OSD HUD flotante.** |
| **S / s** | *Atajo de Ajustes* | **Abre o cierra el Modal de Ajustes del Sistema.** |
| **L / l** | *Atajo de Marca* | **Conmuta en tiempo real entre los 3 conceptos de Isotipo (A, B y C).** |

---

### 4. Guía de Ejecución Local

Para visualizar e interactuar con el prototipo:
1. Navegue en el explorador de archivos hasta `AUDIT_REPORTS/MISSION_3_0_1/prototypes/index.html` y ábralo con cualquier navegador moderno (Chrome, Edge, Firefox, Safari).
2. O bien, inicie un servidor local estático en el puerto 3000 si lo desea:
   ```bash
   npx serve AUDIT_REPORTS/MISSION_3_0_1/prototypes/
   ```
3. Utilice las teclas `T`, `L`, `H`, `S` y las flechas del teclado para validar la fluidez del foco y la atmósfera visual en ambos temas.

