# iCast Component Foundations Specification — M3.1

## 1. Architectural Overview

Mission M3.1 establishes the foundational CSS component library for **iCast** in `css/components.css`. These components serve as the atomic and molecular building blocks for upcoming screen refactors (M3.2 Tab Bar & Navigation, M3.3 Live & EPG, M3.4 Xtream Catalogs, M3.5 Player OSD).

All components adhere to:
- Pure CSS implementation (no JS framework dependencies).
- BEM-inspired naming with `.icast-` namespace to avoid collision with legacy classes.
- Direct consumption of M3.1 Design Tokens (`css/tokens.css`, `css/materials.css`, `css/themes.css`).
- Full compatibility with webOS 4.x / Chromium 53.

---

## 2. Catalog of 10 Foundational Components

### 2.1 Focusable Base (`.icast-focusable`)
- **Role**: Universal interactive contract for all remote-navigable elements.
- **Visuals**: Dual-ring focus outline (`--focus-halo-inner` + `--focus-ring-color`), 1.03x scale pop, 0.98x active compression.
- **Code Template**:
  ```html
  <div class="icast-focusable" tabindex="0" data-focusable="true">Interactive item</div>
  ```

---

### 2.2 Primary Button (`.icast-btn-primary`)
- **Role**: High-emphasis actions (e.g., "Play Now", "Save Settings", "Confirm").
- **Dimensions**: Min-height 48px, horizontal padding `--space-6` (24px), font size `--font-title` (22px), weight 600, border-radius `--radius-md` (10px).
- **Styling**: Background `--accent-neutral` (#C8BFAF in Obsidian), text `#101114` (dark high contrast).
- **Code Template**:
  ```html
  <button class="icast-btn-primary icast-focusable" data-key="btn-play">
    <span class="icast-btn-label">Watch Live</span>
  </button>
  ```

---

### 2.3 Secondary Button (`.icast-btn-secondary`)
- **Role**: Medium-emphasis supporting actions (e.g., "Cancel", "Filter", "More Options").
- **Dimensions**: Min-height 48px, horizontal padding `--space-5` (20px), font size `--font-body` (18px), border-radius `--radius-md` (10px).
- **Styling**: Background `--bg-surface-secondary`, border `1px solid var(--border-subtle)`, text `--text-primary`.
- **Code Template**:
  ```html
  <button class="icast-btn-secondary icast-focusable" data-key="btn-cancel">
    <span class="icast-btn-label">Cancel</span>
  </button>
  ```

---

### 2.4 Icon Button (`.icast-btn-icon`)
- **Role**: Compact media and navigation controls (e.g., Favorite toggle, Audio selector, Close).
- **Dimensions**: Square 48×48px, circular border-radius `--radius-pill` (9999px).
- **Styling**: Centered flexbox, background `--bg-surface-secondary`, text `--text-primary`.
- **Code Template**:
  ```html
  <button class="icast-btn-icon icast-focusable" aria-label="Favorite" data-key="btn-fav">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  </button>
  ```

---

### 2.5 Content Card (`.icast-card`)
- **Role**: Catalog container for movies, series, or VOD items.
- **Dimensions**: Standard 16:9 or 2:3 poster aspect ratio, border-radius `--radius-lg` (16px).
- **Styling**: Level 2 Translucent Material, hidden overflow, hardware-accelerated transform on focus.
- **Code Template**:
  ```html
  <div class="icast-card icast-material-translucent icast-focusable" tabindex="0" data-key="card-101">
    <div class="icast-card-poster">
      <img src="poster.jpg" alt="Title" />
      <span class="icast-badge icast-badge-codec">4K HDR</span>
    </div>
    <div class="icast-card-content">
      <div class="icast-card-title">Interstellar</div>
      <div class="icast-card-subtitle">Sci-Fi • 2014 • 2h 49m</div>
    </div>
  </div>
  ```

---

### 2.6 Channel Tile (`.icast-channel-tile`)
- **Role**: Channel browser grid item for Live TV.
- **Dimensions**: Height 72px, border-radius `--radius-md` (10px), horizontal padding `--space-4` (16px).
- **Styling**: Two-column layout with channel logo/number on left and channel name + now-playing synopsis on right.
- **Code Template**:
  ```html
  <div class="icast-channel-tile icast-focusable" tabindex="0" data-key="ch-1">
    <div class="icast-channel-tile-logo">
      <span class="icast-channel-tile-number">01</span>
    </div>
    <div class="icast-channel-tile-info">
      <div class="icast-channel-tile-name">BBC One HD</div>
      <div class="icast-channel-tile-prog">Planet Earth III</div>
    </div>
    <span class="icast-badge icast-badge-live">LIVE</span>
  </div>
  ```

---

### 2.7 Live Status Badge (`.icast-badge-live`)
- **Role**: Real-time broadcast indicator.
- **Dimensions**: Height 20px, padding `2px 8px`, border-radius `--radius-sm` (6px), font size `--font-caption` (14px).
- **Styling**: Background `#E53935` (broadcast red), text `#FFFFFF`, bold font weight 700.
- **Code Template**:
  ```html
  <span class="icast-badge icast-badge-live">LIVE</span>
  ```

---

### 2.8 Codec / Quality Badge (`.icast-badge-codec`)
- **Role**: Technical stream attribute indicator (e.g. 4K, FHD, HEVC, AC3, 5.1).
- **Dimensions**: Height 20px, padding `2px 8px`, border-radius `--radius-sm` (6px), font size 12px, monospaced numbers.
- **Styling**: Background `rgba(255, 255, 255, 0.12)`, border `1px solid rgba(255, 255, 255, 0.20)`, text `--text-secondary`.
- **Code Template**:
  ```html
  <span class="icast-badge icast-badge-codec">4K UHD</span>
  <span class="icast-badge icast-badge-codec">HEVC</span>
  ```

---

### 2.9 Navigation Item (`.icast-nav-item`)
- **Role**: Docked tab bar link or sidebar navigation button.
- **Dimensions**: Height 52px, horizontal padding `--space-5` (20px), border-radius `--radius-md` (10px).
- **Styling**: Flex row with icon and label, text `--text-secondary`. When `.selected`, text becomes `--text-primary` with active titanium indicator.
- **Code Template**:
  ```html
  <div class="icast-nav-item icast-focusable selected" data-key="nav-live">
    <svg class="icast-nav-icon" width="24" height="24" fill="currentColor">...</svg>
    <span class="icast-nav-label">Live Channels</span>
  </div>
  ```

---

### 2.10 Modal Dialog & Scrim (`.icast-modal-scrim`, `.icast-modal-dialog`)
- **Role**: Critical prompts (Parental PIN, Confirmation, Stream Errors).
- **Dimensions**: Dialog max-width 640px, padding `--space-10` (40px), border-radius `--radius-xl` (24px).
- **Styling**: Scrim uses `rgba(0, 0, 0, 0.75)` backdrop. Dialog uses Level 3 Prominent Material (`.icast-material-prominent`) with `--shadow-elevation-3`.
- **Code Template**:
  ```html
  <div class="icast-modal-scrim">
    <div class="icast-modal-dialog icast-material-prominent">
      <div class="icast-modal-header">
        <h2 class="icast-modal-title">Confirm Channel Deletion</h2>
      </div>
      <div class="icast-modal-body">
        <p>Are you sure you want to remove this channel from your favorites?</p>
      </div>
      <div class="icast-modal-actions">
        <button class="icast-btn-secondary icast-focusable">Cancel</button>
        <button class="icast-btn-primary icast-focusable">Delete</button>
      </div>
    </div>
  </div>
  ```

