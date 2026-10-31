# iCast M3.0.1 Standalone Prototype
## Living Room Experience — Prototipo Interactivo de Evaluación

Este prototipo demuestra la nueva dirección visual refinada de **iCast (M3.0.1)**, concebida para la experiencia de televisión en salón (10-foot UI) sobre LG webOS TV (Chromium 53).

---

### Instrucciones de Ejecución

1. Abra `index.html` directamente en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Firefox, Safari).
2. O sirva la carpeta mediante un servidor local estático:
   ```bash
   npx serve .
   ```
3. El canvas está calibrado a resolución 1080p (1920×1080) con relaciones proporcionales para visualización a 3 metros de distancia.

---

### Controles de Teclado (Simulación de Control Remoto de TV)

* **Flechas de Dirección (▲ ▼ ◄ ►):** Navegación D-pad direccional con micro-elevación acelerada por GPU y auto-scroll suave.
* **Enter (↵):** Botón OK / Seleccionar (reproduce canales, conmuta opciones y pulsa botones).
* **Escape / Backspace:** Tecla Atrás (cierra el modal de Ajustes o el Player HUD si están abiertos).
* **Tecla `T`:** **Conmutar Apariencia** entre el modo oscuro **OBSIDIAN** (`#101114`) y el modo claro **PORCELAIN** (`#F3F2EF`).
* **Tecla `L`:** **Alternar Conceptos de Isotipo** en tiempo real:
  - Alternativa A: *Prisma Minimalista* (3 facetas con acento champagne).
  - Alternativa B: *Prisma Monocromático* (4 facetas platino/grafito de alta nitidez).
  - Alternativa C: *Prisma con Refracción Sutil* (prisma mineral con dos haces translúcidos).
* **Tecla `H` o Barra Espaciadora:** Mostrar u ocultar el **Player OSD HUD** (Overlay flotante de reproducción).
* **Tecla `S`:** Abrir o cerrar el **Modal de Ajustes del Sistema**.

---

### Verificación de Principios Apple HIG

- **Disciplina de Capas:** El Hero Card y las tarjetas de canal son superficies minerales opacas sólidas (Capa de Contenido). El efecto vidrio translúcido se reserva exclusivamente para la barra superior, el Player OSD y el modal de Ajustes (Capa Funcional).
- **Foco Neutro Tridimensional:** Anillo de separación interior del color de fondo + anillo exterior platino/grafito + escala `1.03x` + realce superficial. Cero dependencia de azul saturado.
- **Subordinación al Contenido:** El color se reserva para notificaciones de estado (badge EN VIVO sutil), cediendo el protagonismo visual a la imagen y a la tipografía `LG Smart UI`.

