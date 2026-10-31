# Changelog

All notable changes to **iCast** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.17.0-icast.1] - 2026-10-31

### Added
- **Brand Identity**: Introduced official iCast Monochromatic Prism isotype B and vector brand lockups in `assets/brand/`.
- **Design Tokens**: Complete 10-foot television design token taxonomy (`css/tokens.css`) covering modular 8pt spacing, squircle radii, typography scale (`LG Smart UI`), multi-tier elevation, and GPU-accelerated motion.
- **Bi-Thematic Engine**:
  - `Obsidian`: Cinematic dark mineral theme (`#101114` base, warm titanium accent `#C8BFAF`).
  - `Porcelain`: Gallery light theme (`#F3F2EF` base, bronze champagne accent `#A99476`).
- **Liquid Glass Materials**: 3-tier optical simulation material system (`.icast-material-base`, `.icast-material-translucent`, `.icast-material-prominent`) with progressive enhancement for webOS 22+.
- **Architectural Dual-Ring Focus**: Universal high-contrast remote control navigation contract (`.icast-focusable`) featuring 2px inner halo separation, 2px outer crisp ring, 1.03x scale elevation, and 0.98x active compression.
- **Component Foundations**: Initial suite of 10 atomic UI components (`.icast-btn-primary`, `.icast-card`, `.icast-channel-tile`, `.icast-badge-live`, `.icast-modal-dialog`, etc.).
- **Governance & Legal Framework**: Added formal Apache 2.0 `NOTICE`, dual copyright in `LICENSE`, `SECURITY.md`, and repository governance standards.

### Changed
- Default theme updated from `midnight` to `obsidian`.
- Anti-FOUC initialization script in `index.html` updated to default to `obsidian`.
- Hardened `.gitignore` to safeguard secrets, environment variables, and build outputs.

### Fixed
- Stabilized LAN upload pairing logic and enforced RFC1918 private IPv4 binding.
- Hardened media player pipeline against unexpected stream error states.

---

## [1.17.0] - 2026-10-29 (Upstream Base)
- Initial base release by Lenny (`lennylxx/webos-iptv-player`).
- Added third-party license bundle in package distribution.
- Added CONTRIBUTING guide and documentation updates.

