# PROTOTIPO INTERACTIVO DE REFERENCIA VISUAL iCast
## Misión M3.0 — Sistema de Diseño y Rebranding
**Ubicación:** `AUDIT_REPORTS/MISSION_3_0/prototypes/`  
**Tecnología:** HTML5 Estático, CSS3 Puro (Custom Properties), SVG Vectorial Inline  
**Frameworks:** Cero (Vanilla Web nativo, 0 dependencias externas)  
**Entorno de Ejecución:** Navegador web estándar en PC (Chrome, Edge, Firefox, Safari)  

---

## 1. Propósito del Prototipo

Este prototipo constituye la **referencia visual y táctil interactiva** del blueprint de diseño aprobado para **iCast**. Ha sido desarrollado de forma completamente aislada de los directorios de producción (`src/`, `public/`, `dist/`), con el fin de permitir al equipo de diseño, revisores y stakeholders experimentar en directo:

1. **La Identidad de Marca iCast:** Logotipo "Cinematic Prism" y wordmark tipográfico.
2. **El Sistema de Tiles:** Aspecto y proporciones de los tiles de canales, tarjetas de categoría y tarjeta Hero.
3. **El Comportamiento de Foco de TV:** Anillo dual de alto contraste, elevación por hardware (`scale 1.04`) y resaltado especular.
4. **La Adaptación de Liquid Glass (Nivel 1):** Simulación óptica de cristal translúcido sin coste de blur dinámico.
5. **La Conmutación entre Dark Mode y Light Mode:** Visualización instantánea de la coherencia cromática en ambos temas.
6. **El OSD Flotante del Reproductor:** Barra de transporte cinemática sobre vídeo simulado.

---

## 2. Instrucciones de Apertura y Uso

Para abrir y probar el prototipo:
1. Abra el archivo `index.html` directamente en cualquier navegador moderno:
   `AUDIT_REPORTS/MISSION_3_0/prototypes/index.html`
2. **Navegación por Teclado (Simulación de Control Remoto de TV):**
   * **Flechas de Dirección (Arriba / Abajo / Izquierda / Derecha):** Mueven el foco geométrico entre los tiles interactivos con el mismo comportamiento del D-pad de la televisión.
   * **Tecla Enter / Barra Espaciadora:** Activa el canal o botón enfocado.
   * **Tecla 'T' o Botón de Tema:** Conmuta entre **Dark Mode (Obsidian Prism)** y **Light Mode (Daylight Cloud)**.
   * **Tecla 'O' o Botón OSD:** Despliega / oculta la cápsula flotante del OSD del reproductor de vídeo.
   * **Tecla 'V' o Pestañas:** Alterna entre la vista de Canales en Vivo y la vista de Ajustes / Configuración.

