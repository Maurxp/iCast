# Auditoría Previa y Diagnóstico Arquitectónico (INITIAL_AUDIT.md)
## Misión M3.1 — Brand Identity & Visual Foundations

**Proyecto:** iCast  
**Repositorio:** `C:\Users\amaur\Desktop\webos-iptv-player`  
**Rama Base:** `fix/mission-2-2-stabilization` (Commit `52b5dfa`)  
**Fecha:** 31 de Octubre de 2026  
**Entorno de Ejecución:** LG 65UM7400PDA (Chromium 53.0.2785.34, SoC Realtek RTD2870, 1 GB RAM)  

---

### 1. Estado Inicial del Repositorio y Cambios Preexistentes

Antes de realizar cualquier modificación, se ejecutó una inspección exhaustiva de Git (`git status -s` y `git branch`).
- **Rama activa:** `fix/mission-2-2-stabilization`
- **Archivos modificados preexistentes:** Se identificaron archivos con cambios de misiones de estabilización anteriores (M1c, M2, M2.1, M2.2, M2.3) relacionados con el servicio Luna, compatibilidad de Node 0.12.2, higiene de diagnósticos y parsing.
- **Compromiso de Aislamiento:** No se realizó ningún `git reset`, `git clean` ni modificación destructiva sobre los cambios existentes.
- **Estado de Pruebas Iniciales:**
  - `npm run typecheck`: **0 errores** (aprobado).
  - `npm run lint`: **0 errores** (aprobado en CSS stylelint y ESLint).
  - `npm test`: **155 suites pasadas, 3,559 pruebas aprobadas, 5 omitidas** (100% verde).

---

### 2. Arquitectura de Estilos y Mecanismo de Inicialización

#### Invocación en `index.html`
El archivo raíz `index.html` gestiona la carga de estilos de la siguiente forma:
1. **Script Anti-FOUC en `<head>`:**
   ```html
   <script>
     try { var t = JSON.parse(localStorage.getItem('iptv_theme')); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
     try { var s = JSON.parse(localStorage.getItem('iptv_text_size')); if (s) document.documentElement.dataset.textSize = s; } catch (e) {}
     try { var a = JSON.parse(localStorage.getItem('iptv_animation_mode')); if (a) document.documentElement.dataset.animation = a; } catch (e) {}
   </script>
   ```
2. **Hojas de Estilo en Cascada:**
   - Base y reseteos: `css/legacy-webos-base.css` y `css/main.css`.
   - Temas: `css/themes.css`.
   - Vistas específicas: `channel-list.css`, `player.css`, `epg.css`, `settings.css`, `tab-bar.css`, etc.
   - Parches webOS: `css/legacy-webos-overrides.css`.

#### Mecanismo de Tematización (`src/services/theme-service.ts`)
- La aplicación de un tema consiste exclusivamente en una **escritura de atributo en `<html>`**:
  `document.documentElement.dataset.theme = id;`
- Las variables CSS se declaran bajo selectores de atributo puro: `[data-theme="<id>"]`.
- No existe cálculo dinámico de color en JavaScript, lo que garantiza compatibilidad y rendimiento óptimo en el motor V8 de Chromium 53.
- El registro de temas reside en `src/config/themes.ts` bajo la constante `THEMES: ThemeMeta[]`.
- La persistencia reside en `StorageService.getTheme()` (`localStorage.getItem('iptv_theme')`).

---

### 3. Mecanismo de Navegación, Foco y SpatialNav

La navegación por control remoto en el salón sigue una arquitectura rigurosa:
- **Pila de Propietarios de Foco (`FocusScope`):** Cada vista o modal registra un ámbito con su respectivo `Tier` (Panel=5, Overlay=10, Bar=20, Prompt=30, Critical=40).
- **Regla Fundamental:** *«Only the surface that owns the keys shows a focus ring»* (`AGENTS.md`). Solo la superficie activa pinta su anillo de foco mediante `FocusRing.paint()`.
- **Navegación Geométrica 2D:** `SpatialNav` calcula distancias euclidianas entre elementos `[data-focusable]` dentro del contenedor activo `[data-nav-container]`.
- **Soporte de Puntero / Magic Remote:** Los elementos que se auto-activan portan `data-self-activate` para que el click del puntero no duplique el evento `select`.

---

### 4. Análisis de Conflictos Potenciales y Estrategia de Convivencia

El reto principal de la Misión M3.1 es introducir los **nuevos Design Tokens de iCast** (`--bg-base`, `--bg-surface-primary`, `--accent-neutral`, etc.) sin romper los componentes existentes que todavía consumen las variables históricas (`--bg-primary`, `--bg-secondary`, `--accent`, `--border`).

#### Estrategia de Convivencia Dual:
1. **Creación de `css/tokens.css`:** Se crea una hoja de estilos de tokens maestros que declara la infraestructura de diseño: escalas tipográficas, espaciado, radios de curvatura, elevaciones y tokens semánticos globales.
2. **Definición de Obsidian y Porcelain en `css/themes.css`:**
   Los nuevos bloques `[data-theme="obsidian"]` y `[data-theme="porcelain"]` definen **tanto los nuevos tokens de iCast como el mapeo retrocompatible de las variables heredadas**:
   ```css
   [data-theme="obsidian"] {
     /* Tokens Oficiales iCast (M3.1) */
     --bg-base: #101114;
     --bg-surface-primary: #191A1F;
     --bg-surface-secondary: #24262B;
     --bg-surface-elevated: #2D3037;
     --text-primary: #EDEDEF;
     --text-secondary: #A5A6AC;
     --text-muted: #70727A;
     --accent-neutral: #C8BFAF;
     --focus-ring-color: #EDEDEF;
     --focus-halo-inner: #101114;

     /* Mapeo Retrocompatible para Componentes Existentes */
     --bg-primary: var(--bg-base);
     --bg-secondary: var(--bg-surface-primary);
     --bg-tertiary: var(--bg-surface-secondary);
     --bg-card: var(--bg-surface-primary);
     --accent: var(--accent-neutral);
     --border: var(--border-subtle);
   }
   ```
3. **Preservación de Temas Históricos:** Los 15 temas existentes (`midnight`, `ember`, `emerald`, etc.) se mantienen en `css/themes.css` para que ningún usuario existente pierda su preferencia, situando a `obsidian` y `porcelain` en la cúspide de `THEMES` y estableciendo `obsidian` como el valor predeterminado del sistema (`DEFAULT_THEME`).

---

### 5. Inventario de Archivos a Modificar y Justificación

| Archivo | Ubicación | Motivo Técnico de la Modificación |
| :--- | :--- | :--- |
| `css/tokens.css` | Nuevo en producción | Declaración de tokens maestros (espaciado, radios, tipografía, elevación y contratos de foco). |
| `css/materials.css` | Nuevo en producción | Implementación del sistema de 3 niveles de Liquid Glass (Base, Translúcido, Destacado). |
| `css/components.css` | Nuevo en producción | Implementación de las clases base de componentes (botones, tarjetas, badges, modales). |
| `css/themes.css` | Producción existente | Adición de los bloques de estilo oficiales `[data-theme="obsidian"]` y `[data-theme="porcelain"]`. |
| `index.html` | Producción existente | Enlace de las nuevas hojas (`tokens.css`, `materials.css`, `components.css`) antes de las vistas. |
| `src/config/themes.ts` | Producción existente | Registro de `obsidian` (default) y `porcelain` en la constante `THEMES`. |
| `src/services/storage-service.test.ts` | Pruebas unitarias | Actualización de la expectativa de tema por defecto a `obsidian`. |
| `src/config/themes.test.ts` | Pruebas unitarias | Verificación de registro de los nuevos temas. |
| `assets/brand/` | Nuevos assets | Depósito de los recursos vectoriales SVG oficiales de Prisma B y logotipo iCast. |

