# iCast Design Tokens Specification — M3.1 Foundations

## 1. Executive Summary & Philosophy

This document defines the formal Design Tokens specification for **iCast** (webOS TV Player), implemented during Mission M3.1. Design tokens represent the single source of truth for visual decisions across the application, replacing hardcoded hex values, arbitrary pixel spacings, and inconsistent radii.

The tokens are engineered specifically for:
- **10-Foot UI Experience**: Calibrated for viewing distances of 2.5 to 3.5 meters on a 65-inch 4K screen (LG 65UM7400PDA).
- **Sub-calibrated Hardware (Chromium 53 / Rockhopper SoC)**: Pure CSS Custom Properties (`--var`) with zero JavaScript runtime overhead, zero dynamic color calculations, and zero CSS filter costs on low-tier ARMv7 graphics pipelines.
- **Bi-Thematic Architecture**: Native support for **Obsidian** (Cinematic Dark, Default) and **Porcelain** (Gallery Light).

---

## 2. Color System & Semantic Roles

Colors in iCast are partitioned into semantic roles rather than raw palettes. Every role maps to a specific contrast threshold to ensure legibility under ambient lighting variations (from pitch-black home cinema to brightly lit living rooms).

### 2.1 Dark Palette: Obsidian (Default)

| Token Name | Hex Value | RGBA Fallback | Role / Intended Usage | WCAG vs Base |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-base` | `#101114` | `rgb(16, 17, 20)` | Screen background, deepest level | Base (1.0:1) |
| `--bg-surface-primary` | `#191A1F` | `rgb(25, 26, 31)` | Main cards, panels, tab bar container | 1.15:1 |
| `--bg-surface-secondary` | `#24262B` | `rgb(36, 38, 43)` | Unfocused tiles, secondary controls | 1.32:1 |
| `--bg-surface-elevated` | `#2D3037` | `rgb(45, 48, 55)` | Dialogs, context menus, flyouts | 1.51:1 |
| `--text-primary` | `#EDEDEF` | `rgb(237, 237, 239)` | Headings, channel titles, active items | **15.2:1** (AAA) |
| `--text-secondary` | `#A5A6AC` | `rgb(165, 166, 172)` | Program synopsis, metadata, timestamps | **7.8:1** (AAA) |
| `--text-muted` | `#70727A` | `rgb(112, 114, 122)` | Disabled states, subtle hints, captions | **3.8:1** (AA Large) |
| `--accent-neutral` | `#C8BFAF` | `rgb(200, 191, 175)` | Warm Titanium/Champagne interactive accent | **10.2:1** (AAA) |
| `--accent-neutral-subtle` | `rgba(200, 191, 175, 0.15)` | — | Accent hover tint, active background fill | — |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | `#1D1F24` | Card boundary, divider rules | — |
| `--border-active` | `rgba(200, 191, 175, 0.40)` | `#5A5752` | Selected boundaries, active tab indicator | — |
| `--focus-ring-color` | `#EDEDEF` | `rgb(237, 237, 239)` | Outer focus ring | Contrast > 14:1 |
| `--focus-halo-inner` | `#101114` | `rgb(16, 17, 20)` | Inner dark separation halo (gap) | Separator |

### 2.2 Light Palette: Porcelain

| Token Name | Hex Value | RGBA Fallback | Role / Intended Usage | WCAG vs Base |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-base` | `#F3F2EF` | `rgb(243, 242, 239)` | Screen background, warm ivory base | Base (1.0:1) |
| `--bg-surface-primary` | `#FFFFFF` | `rgb(255, 255, 255)` | Pure white cards, panels, tab bar | 1.13:1 |
| `--bg-surface-secondary` | `#E8E7E3` | `rgb(232, 231, 227)` | Unfocused tiles, secondary controls | 1.10:1 |
| `--bg-surface-elevated` | `#DDDCD7` | `rgb(221, 220, 215)` | Dialogs, context menus, floating flyouts | 1.25:1 |
| `--text-primary` | `#252629` | `rgb(37, 38, 41)` | Deep charcoal text, maximum sharpness | **14.1:1** (AAA) |
| `--text-secondary` | `#77787D` | `rgb(119, 120, 125)` | Slate secondary text, metadata | **4.6:1** (AA) |
| `--text-muted` | `#9D9EA3` | `rgb(157, 158, 163)` | Subtle hints, inactive icons | **2.6:1** (Display) |
| `--accent-neutral` | `#A99476` | `rgb(169, 148, 118)` | Champagne bronze accent, active states | **3.5:1** (AA Graphic) |
| `--accent-neutral-subtle` | `rgba(169, 148, 118, 0.15)` | — | Accent hover tint, active background fill | — |
| `--border-subtle` | `rgba(0, 0, 0, 0.07)` | `#E5E4E0` | Card boundary, divider rules | — |
| `--border-active` | `rgba(169, 148, 118, 0.50)` | `#B8A58D` | Selected boundaries, active tab indicator | — |
| `--focus-ring-color` | `#252629` | `rgb(37, 38, 41)` | Outer focus ring (high-contrast dark) | Contrast > 13:1 |
| `--focus-halo-inner` | `#FFFFFF` | `rgb(255, 255, 255)` | Inner light separation halo (gap) | Separator |

---

## 3. Spacing System (8-Point Modular Grid)

The 10-foot TV canvas relies on an 8-point base grid. Spacing is declared in `css/tokens.css` with single-direction and dual-direction components:

```css
--space-1: 4px;   /* Micro spacing, badge internal padding */
--space-2: 8px;   /* Compact gap, icon-to-text separation */
--space-3: 12px;  /* Standard button internal vertical padding */
--space-4: 16px;  /* Default grid gap, list item horizontal padding */
--space-5: 20px;  /* Section card inner padding */
--space-6: 24px;  /* Group spacing, layout gutters */
--space-8: 32px;  /* Rail separation, channel browser margins */
--space-10: 40px; /* Modal dialog inner padding, large gutters */
--space-12: 48px; /* View boundary padding, screen safe margin */
```

*Note: Safe area margins from physical TV bezels are guarded by `--space-12` (48px), leaving a safe zone of `1824×984` inside the `1920×1080` screen viewport.*

---

## 4. Squircle Radii System

To align with modern industrial television aesthetics without incurring heavy polygon rendering, iCast defines a calibrated squircle curve hierarchy:

| Token | Size | Application |
| :--- | :--- | :--- |
| `--radius-sm` | `6px` | Badges (`.icast-badge`), tags, tooltip pills |
| `--radius-md` | `10px` | Standard buttons (`.icast-btn-primary`, `.icast-btn-secondary`) |
| `--radius-lg` | `16px` | Channel tiles, catalog cards (`.icast-card`), preview panes |
| `--radius-xl` | `24px` | Modal dialogs, floating panels, account switcher drawer |
| `--radius-pill` | `9999px` | Search bar, status pills, circular icon buttons |

---

## 5. Typography Scale (LG Smart UI 10-Foot Optimized)

Television screens require generous x-height and clear character spacing to avoid glyph blurring at 1080p and 4K upscaling. All tokens utilize the system font stack `font-family: "LG Smart UI", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;`.

| Token | Size | Line Height | Weight | Letter Spacing | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--font-display` | `40px` | `1.15` (46px) | `700` | `-0.02em` | Hero titles, time display |
| `--font-headline`| `28px` | `1.25` (35px) | `600` | `-0.01em` | Section headers, modal titles |
| `--font-title`   | `22px` | `1.30` (28.6px) | `600` | `0` | Card titles, channel names |
| `--font-body`    | `18px` | `1.40` (25.2px) | `400` | `0` | Synopsis, settings labels, descriptions |
| `--font-caption` | `14px` | `1.35` (18.9px) | `500` | `0.02em` | Metadata, badges, timestamps |

---

## 6. Elevation & Depth Tokens

On emissive displays (OLED, Edge LED, Direct LED), artificial drop shadows can cause light halos or visual mud. iCast employs calibrated multi-stop ambient shadows:

```css
--shadow-elevation-1: 0 4px 12px rgba(0, 0, 0, 0.25);  /* Subtle lift for cards */
--shadow-elevation-2: 0 8px 24px rgba(0, 0, 0, 0.40);  /* Floating flyouts, menus */
--shadow-elevation-3: 0 16px 48px rgba(0, 0, 0, 0.65); /* Modal dialogs, overlays */
--shadow-focus:       0 12px 32px rgba(0, 0, 0, 0.50); /* Focused element pop */
```

---

## 7. Motion & Animation Tokens

All transitions are locked to GPU-composited properties (`transform`, `opacity`, `box-shadow`) to maintain 60 fps on the Realtek RTD2870 SoC.

```css
--motion-duration-fast:   150ms; /* Focus transition, button press */
--motion-duration-normal: 250ms; /* Panel slide, modal reveal */
--motion-duration-slow:   350ms; /* Screen fade transition */
--motion-ease-default:    cubic-bezier(0.25, 1, 0.5, 1); /* Decelerated organic */
--motion-ease-snappy:     cubic-bezier(0.16, 1, 0.3, 1); /* Instant feedback */
```

---

## 8. Backward Compatibility Mapping

To maintain seamless interoperability with legacy views (Channel List, EPG, Player, Settings) until subsequent missions refactor them, `css/themes.css` maps every legacy variable directly to the new token system:

```css
--bg-primary: var(--bg-base);
--bg-secondary: var(--bg-surface-primary);
--bg-tertiary: var(--bg-surface-secondary);
--bg-card: var(--bg-surface-primary);
--accent: var(--accent-neutral);
--accent-dim: var(--accent-neutral-subtle);
--border: var(--border-subtle);
--focus-ring: var(--focus-ring-color);
```

