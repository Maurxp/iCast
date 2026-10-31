# Sistema de Iconografía Vectorial iCast (M3.0.1)
## Catálogo Monocromático de Alta Precisión para TV

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Fecha:** 31 de Octubre de 2026  
**Referencia HIG:** Apple Human Interface Guidelines (`icons.md`, `sf-symbols.md`)  

---

### 1. Principios de Diseño Iconográfico para 10-Foot UI

1. **Monocromatismo Estricto:** Los iconos heredan el color del texto mediante `currentColor`. No poseen colores embebidos estáticos, adaptándose instantáneamente a los modos Obsidian y Porcelain o a estados enfocados.
2. **Geometría de Trazado de Precisión:**
   - Retícula base: 24×24 px (para navegación general y cabeceras) y 32×32 px (para controles del Player OSD).
   - Grosor de trazo constante: 1.75 px a 2.0 px con terminales redondeados (`stroke-linecap="round"` y `stroke-linejoin="round"`).
   - Sin detalles microscópicos que se empasten a 3 metros de distancia.
3. **Cero Dependencias Externas:** Ni librerías FontAwesome ni fuentes de iconos (que sufren problemas de mapeo de glifos en webOS). Todos los iconos son SVGs nativos inline inyectados a través de plantillas `html` seguras.

---

### 2. Catálogo Vectorial de los 18 Iconos del Sistema

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ 1. Home (Inicio) │ 2. Live TV       │ 3. Películas     │ 4. Series        │
│ 5. Guía EPG      │ 6. Búsqueda      │ 7. Ajustes       │ 8. Modo Tema     │
│ 9. Play          │ 10. Pausa        │ 11. Canal Ant.   │ 12. Canal Sig.   │
│ 13. Pista Audio  │ 14. Subtítulos   │ 15. Favorito     │ 16. Cerrar/Atrás │
│ 17. Checkmark    │ 18. Información  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

#### Especificación Técnica de Iconos Clave (SVG 24×24 px)

* **1. Home / Inicio (`icon-home`):**
  `<path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`

* **2. Live TV / En Vivo (`icon-live`):**
  `<rect x="2" y="7" width="20" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><polyline points="17 2 12 7 7 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`

* **3. Películas / Cinema (`icon-movies`):**
  `<rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><line x1="7" y1="3" x2="7" y2="21" stroke="currentColor" stroke-width="1.8"/><line x1="17" y1="3" x2="17" y2="21" stroke="currentColor" stroke-width="1.8"/><line x1="2" y1="9" x2="22" y2="9" stroke="currentColor" stroke-width="1.8"/><line x1="2" y1="15" x2="22" y2="15" stroke="currentColor" stroke-width="1.8"/>`

* **4. Guía EPG (`icon-epg`):**
  `<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.8"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.8"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.8"/>`

* **5. Ajustes (`icon-settings`):**
  `<line x1="4" y1="21" x2="4" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="4" y1="10" x2="4" y2="3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="12" y1="21" x2="12" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="12" y1="8" x2="12" y2="3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="20" y1="21" x2="20" y2="16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="20" y1="12" x2="20" y2="3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2" stroke="currentColor" stroke-width="1.8"/><circle cx="20" cy="14" r="2" stroke="currentColor" stroke-width="1.8"/>`

* **6. Conmutador de Tema Claro/Oscuro (`icon-theme`):**
  - Sol (Porcelain activo): `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`
  - Luna (Obsidian activo): `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`

* **7. Pista de Audio (`icon-audio`):**
  `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="1.8"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`

* **8. Subtítulos (`icon-subtitles`):**
  `<rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><line x1="6" y1="14" x2="10" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="14" y1="14" x2="18" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="6" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`

---

### 3. Integración en Plantillas y Rendimiento en Chromium 53

1. **Encapsulamiento Limpio:** Cada icono se define en una función auxiliar que retorna un fragmento SVG puro con atributos `aria-hidden="true"` y clases CSS específicas.
2. **Reutilización sin Repetición de Memoria:** Al utilizarse inline, el motor Blink de Chromium 53 no genera peticiones HTTP ni locks de red I/O.
3. **Escalabilidad Vectorial Perfecta:** Se renderiza a resolución nativa tanto en 1080p como en paneles 4K (gracias al escalador nativo de webOS), sin pérdida de nitidez ni artefactos de compresión JPEG/PNG.

