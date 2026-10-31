# iCast Mission M3.2 Readiness & Handoff Assessment

## 1. Context & Objectives of Mission M3.2

With the visual identity and foundational design tokens established in Mission M3.1, the next phase of the iCast evolution (**Mission M3.2 — Core Navigation & TabBar**) will overhaul the primary navigation framework:
- Redesigning the persistent docked **TabBar** (`src/components/tab-bar.ts`) across all views.
- Upgrading the **Account Switcher** (`src/components/account-switcher.ts`) into a refined floating drawer using Level 3 Prominent Material.
- Implementing the official horizontal iCast brand lockup (`logo_horizontal_obsidian.svg` / `logo_horizontal_porcelain.svg`) directly inside the navigation rail.
- Ensuring seamless D-pad focus transition between the TabBar and content views without breaking spatial navigation scopes.

---

## 2. Foundations Verified in M3.1 (Prerequisites Checklist)

| Prerequisite Subsystem | Status | Implementing Artifact / Asset |
| :--- | :--- | :--- |
| **Brand Vectors & Lockup** | **READY (100%)** | `assets/brand/logo_horizontal_*.svg`, `isotype_*.svg` |
| **Design Tokens Scale** | **READY (100%)** | `css/tokens.css` (8pt spacing, typography scale, radii) |
| **Navigation Rail Material** | **READY (100%)** | `css/materials.css` (`.icast-material-translucent`) |
| **Navigation Item Component** | **READY (100%)** | `css/components.css` (`.icast-nav-item`, `.icast-focusable`) |
| **Theme Switching Engine** | **READY (100%)** | `css/themes.css`, `src/config/themes.ts` (Obsidian + Porcelain) |
| **Chromium 53 Compatibility** | **READY (100%)** | Stylelint zero-warning gate, feature matrix audited |
| **Test Suite Health** | **READY (100%)** | All unit tests pass, zero regressions detected |

---

## 3. Architecture Blueprint for M3.2 Implementation

When Mission M3.2 executes:
1. **TabBar Container**: Will adopt `.icast-material-translucent` with border radius `--radius-lg` and subtle border `--border-subtle`.
2. **Tab Buttons**: Will be structured using `.icast-nav-item.icast-focusable`, rendering vector SVG icons alongside `--font-title` labels.
3. **Selected Tab State**: Will feature active champagne indicator bar (`--border-active` / `--accent-neutral`), with high-contrast text `--text-primary`.
4. **Account Switcher Drawer**: Will leverage `.icast-material-prominent` with `--shadow-elevation-3`, smoothly sliding in from the right edge with `--motion-ease-default`.
5. **Focus Invariant**: Tab navigation will continue utilizing `FocusRing.defer()` on pointer click and strict scope registration on `Focus` owner stack.

---

## 4. Sign-off & Recommendation

All design foundations and CSS architecture requirements for M3.2 are complete, verified, and ready for immediate deployment in the next mission.

