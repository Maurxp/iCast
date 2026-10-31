# PLAN DE REDISEÑO PANTALLA POR PANTALLA (SCREEN REDESIGN PLAN)
## Misión M3.0 — iCast Design System & Premium TV UX Blueprint
**Alcance:** Plan de transformación integral para las **25 superficies visuales** auditadas en el proyecto.  

---

## 1. Metodología de Rediseño

Cada superficie se estructura bajo una ficha unificada de 10 puntos clave:
1. **Estado Actual:** Descripción de la implementación existente.
2. **Problemas Detectados:** Deficiencias ergonómicas, estéticas o de compatibilidad.
3. **Objetivo de Rediseño:** La meta visual y funcional en **iCast**.
4. **Nueva Composición y Wireframe:** Disposición espacial y distribución en el canvas 1920×1080.
5. **Componentes Reutilizables:** Componentes modulares aplicados (`iCastTile`, `iCastButton`, etc.).
6. **Tokens Aplicables:** Colores, tipografías, radios y sombras.
7. **Animaciones y Transiciones:** Tiempos y propiedades GPU aceleradas.
8. **Requisitos de Control Remoto:** Mapeo de teclas (D-pad, OK, Back, Color Keys).
9. **Riesgo de Rendimiento:** Evaluación técnica y medidas de mitigación.
10. **Prioridad de Implementación:** Fase asignada en la hoja de ruta M3.

---

## 2. Bloque 1: Lanzamiento y Navegación Base

### Superficie 01: Pantalla de Carga Inicial (Splash & Loading)
* **Estado Actual:** Fondo `#0a0a0f` plano con spinner circular azul y texto "Cargando…".
* **Problemas:** Sensación de aplicación no terminada; corte abrupto de pantalla al abrir canales.
* **Objetivo:** Introducir la identidad de marca iCast con una experiencia de bienvenida cinemática y calmada.
* **Nueva Composición:**
  ```text
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │                      ┌────────┐                        │
  │                      │   ●    │   (Isotipo iCast       │
  │                      │  ╱ ╲   │    con brillo zafiro)  │
  │                      └────────┘                        │
  │                         iCast                          │
  │                   Televisión Redefinida                │
  │                                                        │
  │                   ───●──────────────                   │
  │              (Barra de progreso delgada)               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
  ```
* **Componentes:** `iCastLogo`, `iCastProgressBar`.
* **Tokens:** `--icast-bg-primary`, `--icast-accent-highlight`, `--icast-font-display`.
* **Animaciones:** Entrada suave por desvanecimiento (`opacity 0 -> 1` en 180 ms).
* **Control Remoto:** Bloqueo pasivo mientras se cargan playlists; tecla `Back` sale de la app si hay error fatal.
* **Riesgo:** Nulo (0% CPU tras el renderizado inicial).
* **Prioridad:** **M3.1 (Alta)**.

---

### Superficie 02: Barra de Pestañas Superior y Conmutador de Cuentas (TabBar & Account Switcher)
* **Estado Actual:** Barra fija superior de 96px de alto, fondo gris oscuro plano `#12121a`, borde de 1px.
* **Problemas:** Ocupa 96px de forma rígida; texto "webOS IPTV Player" estático que no aporta valor interactivo.
* **Objetivo:** Transformar en una **Barra Funcional Flotante de Cristal (Liquid Glass Nivel 1)** con píldoras de navegación elevadas.
* **Nueva Composición:**
  ```text
  ┌────────────────────────────────────────────────────────────────────────────┐
  │ [● iCast]  ( Live )  [ Guide ]  [ Movies ]  [ Series ]  [ Settings ]  [🔍] [👤]│
  │            (Píldora   (Pestañas secundarias con texto      (Búsqueda  (Avatar│
  │             activa)    en tono secundario #94A3B8)          rápida)    perfil│
  └────────────────────────────────────────────────────────────────────────────┘
  ```
* **Componentes:** `iCastTabBar`, `iCastTabPill`, `iCastAvatarButton`, `iCastSearchTrigger`.
* **Tokens:** `--icast-bg-elevated` (translucidez 80%), `--icast-border-glass`, `--icast-font-title-2`.
* **Animaciones:** Desplazamiento del halo de píldora en 140 ms al navegar con flechas Izquierda/Derecha.
* **Control Remoto:** Flecha `Abajo` transfiere el foco inmediatamente al primer elemento de la vista activa; tecla `OK` selecciona la sección.
* **Riesgo:** Bajo. No se anima la altura; la barra permanece en su cota de 96px para no provocar reflows.
* **Prioridad:** **M3.2 (Crítica)**.

---

## 3. Bloque 2: Televisión en Vivo (Live TV Experience)

### Superficie 03: Navegador Principal de Canales (Channel Browser)
* **Estado Actual:** Explorador de dos columnas con lista vertical monótona de texto plano y números.
* **Problemas:** Aspecto técnico, baja legibilidad del programa actual, fatiga visual.
* **Objetivo:** Convertir cada canal en un **Tile Táctil de Televisión (`iCastChannelTile`)** enriquecido con logo, titular de programa y barra de tiempo.
* **Nueva Composición:**
  ```text
  ┌───────────────┬────────────────────────────────────────────────────────────┐
  │ CATEGORÍAS    │  CANALES EN VIVO                                           │
  │ ───────────── │  ┌───────────────────────────────────────────────────────┐ │
  │ ⭐ Favoritos  │  │ [Logo]  101 · LA 1 HD                          [LIVE] │ │
  │ 📺 General    │  │         Telediario 2ª Edición (45 / 60 min)           │ │
  │ ⚽ Deportes   │  └───────────────────────────────────────────────────────┘ │
  │ 🎬 Cine       │  ┌───────────────────────────────────────────────────────┐ │
  │ 📰 Noticias   │  │ [Logo]  102 · LA 2                           [CATCHUP]│ │
  │ 👶 Infantil   │  │         Documentales de Naturaleza                    │ │
  │               │  └───────────────────────────────────────────────────────┘ │
  └───────────────┴────────────────────────────────────────────────────────────┘
  ```
* **Componentes:** `iCastTileChannel`, `iCastCategoryRail`, `iCastLiveBadge`, `iCastHealthIndicator`.
* **Tokens:** `--icast-bg-surface`, `--icast-bg-elevated`, `--icast-focus-ring`, `--icast-font-body`.
* **Animaciones:** Foco con micro-escala `scale(1.04)` en 140 ms por GPU; cambio a color zafiro.
* **Control Remoto:** Flechas `Arriba`/`Abajo` navegan la lista virtual; `Derecha` entra al panel de mini-preview; `OK` abre vídeo a pantalla completa; botón `Azul` conmuta favorito instantáneamente.
* **Riesgo:** Medio. Requiere mantener el virtualizador estricto (máximo 25 tiles DOM a la vez).
* **Prioridad:** **M3.3 (Crítica)**.

---

### Superficie 04: Panel Lateral de Mini-Preview (Live Preview Pane)
* **Estado Actual:** Ventana derecha rectangular con recortes abruptos y metadatos pobres.
* **Objetivo:** Panel de bisel pulido con viñeta de cristal, reproductor mini fluido y ficha de sinopsis completa del programa actual.
* **Componentes:** `iCastMiniPlayer`, `iCastProgramSynopsis`, `iCastEpgTimeline`.
* **Tokens:** `--icast-radius-card`, `--icast-border-glass`, `--icast-text-secondary`.
* **Animaciones:** Desvanecimiento suave al cargar stream (`opacity 0 -> 1` en 160 ms).
* **Control Remoto:** Flecha `Izquierda` devuelve el foco a la lista de canales; `OK` maximiza a pantalla completa.
* **Riesgo:** Bajo. Mantiene el pipeline de decodificación nativo ya validado en M2.3.
* **Prioridad:** **M3.3 (Alta)**.

---

### Superficie 05: Selector Flotante de Categorías (Live Category Picker)
* **Estado Actual:** Recuadro modal gris plano con lista de texto.
* **Objetivo:** Panel flotante de vidrio visual con tarjetas cuadradas para cada género e icono representativo.
* **Componentes:** `iCastCategoryCard`, `iCastModalScrim`.
* **Tokens:** `--icast-radius-modal`, `--icast-shadow-modal`, `--icast-accent`.
* **Animaciones:** Escala-desvanecimiento central (`scale 0.96 -> 1.0` en 160 ms).
* **Control Remoto:** Abierto con botón `Rojo` del mando; flechas seleccionan categoría; `OK` filtra y cierra; `Back` cancela.
* **Riesgo:** Bajo.
* **Prioridad:** **M3.3 (Media)**.

---

### Superficie 06: Editor de Orden de Canales (Channel List Editor)
* **Estado Actual:** Lista básica con botones toscos de flechas.
* **Objetivo:** Modal de organización táctil con arrastre visual simulado por D-pad (pulsar OK para levantar, flechas para mover, OK para soltar).
* **Componentes:** `iCastReorderTile`, `iCastActionBadge`.
* **Tokens:** `--icast-accent-highlight`, `--icast-font-callout`.
* **Prioridad:** **M3.3 (Baja)**.

---

## 4. Bloque 3: Reproductor y HUD Multimedia (Player OSD)

### Superficie 07: Plano de Vídeo a Pantalla Completa
* **Estado Actual:** Elemento `<video>` acelerado por hardware sin transiciones de entrada.
* **Objetivo:** Transición cinemática a negro (*fade to black* según `playing-video.md`) que garantiza continuidad visual al sintonizar.
* **Tokens:** `--icast-bg-primary: #080A0F`.
* **Prioridad:** **M3.4 (Alta)**.

---

### Superficie 08: Barra de Transporte y OSD del Reproductor (Player OSD)
* **Estado Actual:** Caja rectangular inferior negra y opaca en webOS 4 (`rgba(10, 10, 15)`).
* **Objetivo:** **Cápsula Flotante de Cristal Líquido (Nivel 1)** con bisel superior de luz, medidor de tiempo fluido, logos y badges de audio multicanal.
* **Nueva Composición:**
  ```text
  ┌────────────────────────────────────────────────────────────────────────────┐
  │ [Logo] 101 · LA 1 HD                                     [1080p] [AAC] [CC]│
  │        Telediario 2ª Edición                             (21:00 - 22:15)   │
  │        ══════════════════════════════●───────────────────────────────     │
  │        35:20                                                   -39:40      │
  │ [⏪ -10s]  [⏸ Pausa]  [⏩ +10s]  [🔊 Pista Audio]  [💬 Subtítulos]  [⭐ Fav]   │
  └────────────────────────────────────────────────────────────────────────────┘
  ```
* **Componentes:** `iCastPlayerOsd`, `iCastProgressBar`, `iCastTransportButton`, `iCastFormatBadge`.
* **Tokens:** `--icast-glass-media-hud`, `--icast-accent-highlight`, `--icast-radius-modal`.
* **Animaciones:** Deslizamiento vertical desde la base (`translate3d(0, 100%, 0) -> (0,0,0)` en 180 ms).
* **Control Remoto:** `OK` o `Info` abre/cierra OSD; `Play/Pause` actúa directamente; `Izquierda/Derecha` desplaza el cabezal de tiempo; `Back` oculta el OSD al instante.
* **Riesgo:** Bajo. No usa blur dinámico, garantizando 60 FPS sobre el vídeo en emisión.
* **Prioridad:** **M3.4 (Crítica)**.

---

### Superficie 09: Barra Lateral de Canales en Reproductor (Quick Player Sidebar)
* **Estado Actual:** Bloque opaco negro que oculta el 30% del televisor a la izquierda.
* **Objetivo:** Columna de cristal translúcida con tiles ultraligeros de canal para sintonización rápida sin perder de vista la escena.
* **Componentes:** `iCastQuickSidebar`, `iCastCompactChannelTile`.
* **Tokens:** `--icast-bg-elevated` (75% opacidad), `--icast-border-glass`.
* **Animaciones:** Deslizamiento lateral (`translate3d(-100%, 0, 0) -> (0,0,0)` en 180 ms).
* **Control Remoto:** Activada con flecha `Izquierda`; `Arriba/Abajo` eligen canal; `OK` sintoniza; `Back` o `Derecha` cierran la barra.
* **Prioridad:** **M3.4 (Alta)**.

---

### Superficie 10: Menú de Ajustes del Reproductor (Player Menu)
* **Estado Actual:** Lista desplegable genérica de ajustes.
* **Objetivo:** Panel modal de opciones agrupadas: Pistas de Audio (ES, EN, VO), Subtítulos (Desactivado, Pista 1, Búsqueda), Relación de Aspecto.
* **Componentes:** `iCastSettingsGrid`, `iCastOptionSelector`.
* **Tokens:** `--icast-radius-card`, `--icast-font-body`.
* **Prioridad:** **M3.4 (Alta)**.

---

### Superficie 11: Búsqueda y Descarga de Subtítulos (Subtitle Search Overlay)
* **Estado Actual:** Modal de lista vertical plana.
* **Objetivo:** Diálogo flotante con selector de idioma en píldoras y lista de resultados con indicación de tasa de acierto y formato.
* **Prioridad:** **M3.4 (Media)**.

---

### Superficie 12: Calibración de Desfase de Subtítulos (Subtitle Offset Overlay)
* **Estado Actual:** Tarjeta de texto simple con milisegundos.
* **Objetivo:** Indicador visual analógico con regla graduada horizontal que permite ajustar desfase con las flechas `Izquierda`/`Derecha` en pasos de 50 ms.
* **Prioridad:** **M3.4 (Baja)**.

---

### Superficie 13: Sintonizador Numérico Rápido (Number Entry Quick-Tuning Box)
* **Estado Actual:** Rectángulo tosco en esquina superior derecha.
* **Objetivo:** Píldora de cristal flotante minimalista (`iCastNumberPill`) con tipografía luminosa que desaparece con fade out suave.
* **Tokens:** `--icast-radius-pill`, `--icast-accent-highlight`, `--icast-font-title-1`.
* **Prioridad:** **M3.4 (Media)**.

---

## 5. Bloque 4: Guía de Programación y Catchup (EPG)

### Superficie 14: Cuadrícula de Programación Electrónica (EPG TV Guide Grid)
* **Estado Actual:** Matriz densa de texto en azul y negro que trunca programas cortos.
* **Objetivo:** Parrilla temporal fluida con cabecera de horas fija, columna de canales con logo prominente y bloques de programa de esquinas redondeadas con indicador luminoso de progreso.
* **Componentes:** `iCastEpgGrid`, `iCastEpgChannelColumn`, `iCastEpgProgramBlock`, `iCastTimeHeader`.
* **Tokens:** `--icast-bg-surface`, `--icast-accent-dim`, `--icast-font-callout`.
* **Animaciones:** Scroll suave por hardware; foco con halo dual en el bloque seleccionado.
* **Control Remoto:** Navegación en 4 direcciones; `OK` en programa actual abre canal; `OK` en programa pasado con catchup abre reproducción grabada; `OK` en programa futuro agenda recordatorio ⏰.
* **Riesgo:** Alto. La virtualización de bloques de tiempo debe ser quirúrgica para no sobrecargar el árbol DOM.
* **Prioridad:** **M3.3 (Crítica)**.

---

### Superficie 15: Diálogo de Reanudación de Catchup (Catchup Resume Prompt)
* **Estado Actual:** Cuadro gris simple de alerta.
* **Objetivo:** Ficha flotante con sinopsis del programa, punto de tiempo guardado (`Ej: "Reanudar desde el minuto 42:15"`) y dos botones táctiles.
* **Prioridad:** **M3.3 (Baja)**.

---

## 6. Bloque 5: Catálogos Bajo Demanda (VOD Movies & Series)

### Superficie 16: Catálogo de Películas (Movies Catalog View)
* **Estado Actual:** Carruseles oscuros planos.
* **Objetivo:** Escaparate cinemático con Hero Card superior panorámica y rieles horizontales de pósteres con reflejo de cristal y elevación en foco.
* **Componentes:** `iCastCatalogHero`, `iCastPosterRail`, `iCastPosterTile`.
* **Tokens:** `--icast-radius-card`, `--icast-shadow-focus`, `--icast-font-title-2`.
* **Prioridad:** **M3.5 (Alta)**.

---

### Superficie 17: Catálogo de Series y Episodios (Series Catalog View)
* **Estado Actual:** Estructura compartida con Movies.
* **Objetivo:** Navegador jerárquico optimizado: Selección de Serie -> Selector de Temporadas en píldoras -> Lista horizontal de episodios con miniatura 16:9 y barra de progreso de visualización.
* **Prioridad:** **M3.5 (Alta)**.

---

## 7. Bloque 6: Búsqueda, Configuración y Control Parental

### Superficie 18: Búsqueda Unificada (Search View)
* **Estado Actual:** Pantalla dividida con teclado virtual tosco y lista de texto.
* **Objetivo:** Experiencia de búsqueda fluida con selector de filtros por píldoras ("Todo", "Canales", "Cine", "Series") y presentación de resultados en cuadrícula de tiles visuales.
* **Prioridad:** **M3.5 (Media)**.

---

### Superficie 19: Desplegable de Historial de Búsquedas (Search History Dropdown)
* **Estado Actual:** Desplegable oscuro plano.
* **Objetivo:** Panel de cristal flotante bajo el campo de texto con chips de búsquedas recientes y botón de borrado rápido.
* **Prioridad:** **M3.5 (Baja)**.

---

### Superficie 20: Vista de Configuración General (Settings View)
* **Estado Actual:** 8 categorías apiñadas con explicaciones extensas y swatches toscos.
* **Objetivo:** Centro de preferencias estructurado con iconos vectoriales en la columna izquierda y controles táctiles modernos a la derecha (selectores en píldora, toggles fluidos y tarjetas de información limpias).
* **Componentes:** `iCastSettingsNav`, `iCastSettingRow`, `iCastToggle`, `iCastSegmentedPicker`.
* **Prioridad:** **M3.5 (Alta)**.

---

### Superficie 21: Gestión de Control Parental (Parental Controls View)
* **Estado Actual:** Lista simple con casillas de verificación.
* **Objetivo:** Panel de seguridad con interruptor maestro, visualización clara del estado de protección y selección de categorías bloqueadas mediante badges con icono de candado.
* **Prioridad:** **M3.5 (Baja)**.

---

### Superficie 22: Prompt de PIN Parental (Parental PIN Prompt)
* **Estado Actual:** Cuadro centrado oscuro con puntos de contraseña.
* **Objetivo:** Modal de alta seguridad con 4 casillas de PIN iluminadas que reaccionan inmediatamente al teclado numérico del mando, con vibración visual sutil si el PIN es incorrecto.
* **Prioridad:** **M3.5 (Media)**.

---

### Superficie 23: Gestor de Recordatorios y Notificaciones EPG (Reminder Manager & Prompt)
* **Estado Actual:** Alertas emergentes rectangulares sin animación.
* **Objetivo:** Notificación flotante de estilo tarjeta de cristal en la esquina superior (`iCastToastNotification`) que no interrumpe el vídeo, con dos botones de acción rápida.
* **Prioridad:** **M3.5 (Baja)**.

---

### Superficie 24: Modales Globales de Confirmación y Toasts (Confirmation & Toast)
* **Estado Actual:** Cuadros grises centrados.
* **Objetivo:** Tarjetas flotantes de vidrio óptico con jerarquía visual: botón de Cancelación enfocado por defecto (principio de seguridad HIG `alerts.md`), botón de acción en color semántico y mensaje claro sin jerga técnica.
* **Prioridad:** **M3.2 (Alta)**.

---

### Superficie 25: Portal LAN de Subida y Emparejamiento (LAN Setup Page)
* **Estado Actual:** Página web móvil/PC independiente con diseño antiguo "webOS IPTV Player".
* **Objetivo:** Rediseño responsivo de `setup-page.html` con la nueva identidad de marca **iCast**, paleta Obsidian/Zafiro, tipografía moderna y código de emparejamiento PIN de 4 dígitos en gran formato.
* **Prioridad:** **M3.5 (Media)**.

