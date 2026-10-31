# MISIÓN M3.0 — iCast: REBRANDING INTEGRAL, SISTEMA DE DISEÑO Y BLUEPRINT UX PARA TV
## Proyecto: iCast (anteriormente webOS IPTV Player)
**Versión de Proyecto:** v1.17.0  
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Firmware 05.40.97, SoC Realtek RTD2870, Chromium 53.0.2785.34)  
**Fecha de Emisión:** 2026-10-31  
**Estado:** **COMPLETADA CON ÉXITO — BLUEPRINT APROBADO PARA FASE M3.1**

---

## 1. Declaración de Misión y Filosofía de Producto

La **Misión M3.0** marca la refundación de la identidad visual, el sistema de diseño y la experiencia de usuario (UX) de nuestro reproductor IPTV, transformando el producto técnico anteriormente denominado **webOS IPTV Player** en su nueva identidad comercial definitiva:

# **iCast**

### Principios Fundamentales:
1. **Identidad Propia y Distintiva:** iCast no es una plantilla genérica de IPTV con listas saturadas y colores estridentes, ni tampoco una copia literal de Apple TV. Combina la claridad editorial y tipográfica de Apple HIG con un lenguaje visual propio inspirado en **Liquid Glass** adaptado con precisión a la experiencia de salón (10-foot UI).
2. **El Rendimiento Gobierna el Diseño:** El hardware objetivo es un televisor real LG con procesador ARMv7 de 32 bits, 1 GB de RAM total y motor Chromium 53 (año 2016). Toda decisión estética debe ser ligera, fluida y ejecutar a 60 FPS sin sobrecargar la CPU (< 1% en menús) ni la memoria (< 110 MB RSS combinado).
3. **Ergonomía de Control Remoto (D-Pad First):** La interfaz está concebida exclusivamente para interacción a 3 metros de distancia mediante control remoto estándar (Arriba, Abajo, Izquierda, Derecha, OK, Back y botones de colores), garantizando un foco visual permanente, claro e inconfundible.
4. **Cero Impacto en Código Productivo:** M3.0 es una misión estrictamente analítica, metodológica, proyectual y de diseño. El código de producción (`src/`, `css/`, `appinfo.json`, `package.json`, scripts de compilación) permanece 100% inalterado.

---

## 2. Equipo Multidisciplinario de Diseño y Auditoría

Para abordar integralmente este desafío, la misión fue desarrollada asumiendo las siguientes competencias técnicas:
* **Creative Director:** Definición de la estrategia de marca, naming, narrativa, personalidad y direcciones conceptuales del logotipo e icono.
* **Senior Product Designer (10-foot TV UI):** Ergonomía espacial para pantallas de 65 pulgadas a resolución 1920×1080, diseño de tiles y jerarquía visual.
* **UI/UX Architect:** Estructuración del sistema de tokens, modularidad de componentes y compatibilidad con el reconciliador de DOM Vanilla (`morph()`).
* **Especialista en Apple Human Interface Guidelines:** Aplicación de los 8 principios HIG (junio 2026) y auditoría crítica a través de 5 lentes de calidad.
* **Especialista en Materiales y Liquid Glass:** Adaptación del material translúcido mediante técnicas visuales estáticas y ópticas sin recurrir a filtros de blur pesado en el runtime.
* **Ingeniero Frontend Especializado en Chromium Legacy (v53):** Verificación de compatibilidad CSS, eliminación de dependencias incompatibles (CSS Grid, flex gap, backdrop-filter) y diseño de fallbacks.
* **Ingeniero de Rendimiento para Sistemas Embebidos:** Establecimiento de presupuestos estrictos de CPU, GPU, memoria y tiempos de respuesta.
* **Especialista en Accesibilidad y Navegación por Control Remoto:** Contraste WCAG 2.1 AA/AAA, diseño del halo/foco visual y soporte de movimiento reducido.
* **Auditor Técnico de Software:** Trazabilidad, preservación de repositorios y verificación criptográfica de artefactos.

---

## 3. Integración Metodológica: Apple Design Skill

Se integró exitosamente en el proyecto la skill de referencia metodológica de diseño:
* **Ubicación:** `.agents/skills/apple-design/`
* **Origen:** `https://github.com/dickwu/apple-design-skill.git` (Commit: `ff4ebddf0488598723a82bfdce1afb04de0b1c44`)
* **Tratamiento Git:** Aislada mediante exclusión local en `.git/info/exclude` para evitar crear submódulos accidentales o gitlinks en el repositorio principal, conservando su historial Git interno.
* **Documentación Base:** 124 guías HIG de Apple y guías curadas analizadas a fondo para fundamentar cada recomendación.

---

## 4. Índice Estructurado de Entregables (M3.0)

La totalidad de los análisis, auditorías, especificaciones y prototipos se encuentran estructurados en este directorio:

| Entregable | Resumen de Contenido |
| :--- | :--- |
| [`APPLE_DESIGN_SKILL_AUDIT.md`](./APPLE_DESIGN_SKILL_AUDIT.md) | Registro de commit, inventario de las 124 guías HIG, principios de Apple y adaptación a webOS TV. |
| [`APP_CURRENT_STATE_AUDIT.md`](./APP_CURRENT_STATE_AUDIT.md) | Auditoría visual, técnica y de arquitectura DOM de la aplicación existente (`webOS IPTV Player`). |
| [`SCREEN_INVENTORY.md`](./SCREEN_INVENTORY.md) | Inventario forense de las 22 pantallas, vistas, overlays y modales descubiertos en el código. |
| [`COMPONENT_INVENTORY.md`](./COMPONENT_INVENTORY.md) | Catálogo exhaustivo de componentes reutilizables, tiles, botones, listas y contenedores. |
| [`NAVIGATION_AND_FOCUS_AUDIT.md`](./NAVIGATION_AND_FOCUS_AUDIT.md) | Auditoría de `KeyHandler`, `FocusScope`, `FocusRing`, navegación D-pad y pila de propietarios (`Tier`). |
| [`PERFORMANCE_BASELINE.md`](./PERFORMANCE_BASELINE.md) | Línea base consolidada de hardware: memoria (108 MB RSS), CPU (< 5%), DOM y bundles. |
| [`BRAND_STRATEGY.md`](./BRAND_STRATEGY.md) | Posicionamiento, valores, tono de voz y diferenciación premium de la marca iCast. |
| [`BRAND_IDENTITY_CONCEPTS.md`](./BRAND_IDENTITY_CONCEPTS.md) | Exploración conceptual y tres direcciones de identidad de marca (Prisma, Órbita, Atelier). |
| [`LOGO_AND_APP_ICON_DIRECTION.md`](./LOGO_AND_APP_ICON_DIRECTION.md) | 3 conceptos de logotipo, versiones monocromáticas, y diseño del icono de aplicación para webOS. |
| [`COLOR_SYSTEM.md`](./COLOR_SYSTEM.md) | Sistema cromático completo: Dark Mode y Light Mode, tokens semánticos y ratios de contraste WCAG. |
| [`TYPOGRAPHY_SYSTEM.md`](./TYPOGRAPHY_SYSTEM.md) | Escala tipográfica 10-foot TV, familias del sistema (`LG Smart UI`), pesos y soporte del español. |
| [`ICONOGRAPHY_SYSTEM.md`](./ICONOGRAPHY_SYSTEM.md) | Sistema geométrico de iconos vectoriales SVG (24x24 / 32x32) y estados de interacción. |
| [`LIQUID_GLASS_ADAPTATION.md`](./LIQUID_GLASS_ADAPTATION.md) | Adaptación del material Liquid Glass a Chromium 53: arquitectura de 3 niveles y simulación óptica sin blur dinámico. |
| [`TILE_AND_COMPONENT_SYSTEM.md`](./TILE_AND_COMPONENT_SYSTEM.md) | Diseño detallado de tiles (canal, categoría, VOD, favoritos), radios de borde, elevación y foco. |
| [`MOTION_DESIGN_SYSTEM.md`](./MOTION_DESIGN_SYSTEM.md) | Catálogo de animaciones, duraciones (100–200 ms), aceleración por GPU y modo de movimiento reducido. |
| [`TV_REMOTE_UX.md`](./TV_REMOTE_UX.md) | Ergonomía del D-pad, distancia visual (3 m), halo de foco, botones de colores y Magic Remote. |
| [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) | Arquitectura de tokens para TypeScript y CSS Custom Properties (color, tipo, espacio, radios, sombras). |
| [`PERFORMANCE_BUDGET.md`](./PERFORMANCE_BUDGET.md) | Presupuesto estricto de rendimiento visual: efectos permitidos, condicionados y estrictamente prohibidos. |
| [`SCREEN_REDESIGN_PLAN.md`](./SCREEN_REDESIGN_PLAN.md) | Plan de rediseño detallado para las 22 pantallas auditadas, con composición, tokens y navegación. |
| [`DESIGN_CRITIQUE.md`](./DESIGN_CRITIQUE.md) | Evaluación crítica según las 5 lentes de Apple Design Skill, revisión anti-genérica y prueba de simplicidad. |
| [`M3_IMPLEMENTATION_ROADMAP.md`](./M3_IMPLEMENTATION_ROADMAP.md) | Hoja de ruta por fases (M3.1 a M3.7) con dependencias, prioridades y criterios de aceptación. |
| [`M3_0_EXECUTIVE_SUMMARY.md`](./M3_0_EXECUTIVE_SUMMARY.md) | Resumen ejecutivo consolidado del blueprint de diseño. |
| [`SOURCES.md`](./SOURCES.md) | Bibliografía técnica, citas directas de Apple HIG y registros de evidencia empírica. |
| [`mission3_0.json`](./mission3_0.json) | Resumen estructurado en JSON machine-readable. |
| [`CHECKSUMS.sha256`](./CHECKSUMS.sha256) | Hashes SHA-256 de todos los artefactos de la misión. |
| [`prototypes/`](./prototypes/) | Prototipo estático interactivo en HTML5/CSS/SVG independiente de producción. |
| `mission_3_0-final.zip` | Archivo ZIP consolidado con todos los entregables y prototipos. |

---

## 5. Dictamen y Transición

La **MISIÓN M3.0** proporciona la arquitectura visual, el rigor metodológico y la planificación técnica indispensables para acometer la renovación del producto.

**Dictamen:** **APROBADO PARA INICIAR LA MISIÓN M3.1 (Brand Identity & Visual Foundations).**

