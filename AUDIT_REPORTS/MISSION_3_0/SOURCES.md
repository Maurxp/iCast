# FUENTES CONSULTADAS Y BIBLIOGRAFÍA TÉCNICA (SOURCES)
## Misión M3.0 — iCast Design System & Premium TV UX Blueprint
**Fecha:** 2026-10-31  

---

## 1. Documentación Oficial de Apple Human Interface Guidelines (HIG)

Todas las referencias provienen del repositorio integrado `.agents/skills/apple-design/` (Commit `ff4ebddf0488598723a82bfdce1afb04de0b1c44`, sincronizado con `developer.apple.com` a octubre de 2026):

1. **Apple Design Principles (June 2026)**
   * **Archivo:** `.agents/skills/apple-design/references/hig/design-principles.md`
   * **URL:** `https://developer.apple.com/design/human-interface-guidelines/design-principles`
   * **Cita Aplicada:** *"Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight. A well-designed experience removes the unnecessary, with every element earning its place."*

2. **Liquid Glass Curated Guide & Materials**
   * **Archivos:** `.agents/skills/apple-design/references/hig/liquid-glass.md` y `materials.md`
   * **URL:** `https://developer.apple.com/design/human-interface-guidelines/materials`
   * **Citas Aplicadas:**
     * *"Don't use Liquid Glass in the content layer. Putting it there creates unnecessary complexity... limit it to the most important functional elements; glass on many custom controls distracts from the content."*
     * *"Differentiate controls from content... extend full-screen background content beneath sidebars, toolbars, and tab bars."*

3. **Color & Dark Mode**
   * **Archivos:** `.agents/skills/apple-design/references/hig/color.md` y `dark-mode.md`
   * **URL:** `https://developer.apple.com/design/human-interface-guidelines/color`
   * **Cita Aplicada:** *"Apply color sparingly... Reserve it for elements that truly benefit from emphasis, such as status indicators or primary actions. To emphasize a primary action, color the background rather than the symbol or label."*

4. **Focus and Selection**
   * **Archivo:** `.agents/skills/apple-design/references/hig/focus-and-selection.md`
   * **URL:** `https://developer.apple.com/design/human-interface-guidelines/focus-and-selection`
   * **Cita Aplicada:** *"Focus helps people visually confirm the object that their interaction targets... in tvOS, people use directional gestures on a remote to reach every onscreen element."*

5. **Playing Video**
   * **Archivo:** `.agents/skills/apple-design/references/hig/playing-video.md`
   * **URL:** `https://developer.apple.com/design/human-interface-guidelines/playing-video`
   * **Citas Aplicadas:**
     * *"Always display video content at its original aspect ratio."*
     * *"Provide additional information when it adds value... restrict this content so that it doesn’t obscure media playback."*
     * *"Ensure a smooth transition to your app... fade to black before starting to play."*

6. **Branding & App Icons**
   * **Archivos:** `.agents/skills/apple-design/references/hig/branding.md` y `app-icons.md`
   * **URL:** `https://developer.apple.com/design/human-interface-guidelines/branding`
   * **Cita Aplicada:** *"Ensure branding always defers to content... Resist the temptation to display your logo throughout your app."*

7. **Accessibility & Motion**
   * **Archivos:** `.agents/skills/apple-design/references/hig/accessibility.md` y `motion.md`
   * **URL:** `https://developer.apple.com/design/human-interface-guidelines/accessibility`
   * **Cita Aplicada:** *"Motion is optional and never the only carrier of meaning... Contrast: text up to 17 pt needs 4.5:1; text at 18 pt or larger, or bold text, needs 3:1."*

---

## 2. Documentación Oficial de LG webOS TV

8. **LG webOS TV Design Guide — 10-Foot User Interface**
   * **URL:** `https://webostv.developer.lge.com/design/webos-tv-design-guide`
   * **Alcance:** Principios de diseño para televisión a 3 metros de distancia en resoluciones 1920×1080, espaciado de foco y áreas interactivas.

9. **LG webOS TV Developer — App Manifest & Launcher Assets**
   * **URL:** `https://webostv.developer.lge.com/develop/specifications/appinfo-json`
   * **Alcance:** Requisitos de dimensiones y formatos de icono: `icon.png` (80×80 px), `largeIcon.png` (130×130 px), `splashBackground.png` (1920×1080 px).

10. **LG webOS TV Developer — Magic Remote & Pointer Event Model**
    * **URL:** `https://webostv.developer.lge.com/develop/guides/magic-remote`
    * **Alcance:** Especificación del modelo trusted click en webOS, interacción entre puntero giroscópico y teclas físicas D-pad.

---

## 3. Estándares Internacionales de Accesibilidad (W3C)

11. **W3C Web Content Accessibility Guidelines (WCAG) 2.1**
    * **URL:** `https://www.w3.org/TR/WCAG21/`
    * **Algoritmos Utilizados:** Cálculo de luminancia relativa y fórmula de contraste para conformidad con Niveles AA y AAA en componentes de interfaz y textos principales.

---

## 4. Evidencias Empíricas del Proyecto (Hardware LG 65UM7400PDA)

12. **Informes de Rendimiento y Memoria de Misiones M2, M2.3 y M2.3.1:**
    * `AUDIT_REPORTS/MISSION_2_3/RESOURCE_USAGE.md` (Lecturas VmRSS y VmSize de WebAppMgr y Node.js).
    * `AUDIT_REPORTS/MISSION_2_3/RUNTIME_VALIDATION.md` (Validación de decodificación hardware H.264/AAC en HLS, DASH y MP4).
    * `AUDIT_REPORTS/MISSION_2_4/PLATFORM_LIMITATIONS.md` (Comprobación de ausencia nativa de `backdrop-filter` en Chromium 53).

