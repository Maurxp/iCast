# Root README Audit & Redesign Specification — Mission R0.1

## 1. Audit of Inherited Upstream README

The original [`README.md`](file:///c:/Users/amaur/Desktop/webos-iptv-player/README.md) is structured as a user guide for `webOS IPTV Player`:
- **Identity**: Branded entirely around the legacy name with cyan accent screenshots (`#00d4ff`).
- **Hardware Claims**: Mentions generic "webOS 4+" compatibility without specifying tested SoC architectures or RAM ceilings.
- **Developer Documentation**: Features build commands, but lacks a formal architecture map, design system specification, or security guidelines.

---

## 2. Requirements for the New iCast Root README

The new root `README.md` must establish iCast as an independent, enterprise-grade open-source project while honoring upstream origins:

### Key Requirements:
1. **Official Brand Assets**: Integrate the horizontal iCast vector lockup and Monochromatic Prism isotype.
2. **Design System Highlights**: Showcase the Obsidian and Porcelain theme architecture, 3-tier Liquid Glass materials, and dual-ring focus system.
3. **Rigorous Hardware Matrix**:
   - **Physically Validated on Real Hardware**:
     - Model: LG 65UM7400PDA (65" 4K Smart TV)
     - OS: webOS TV Lite 4.10.2-29 (API 4.1.0)
     - Firmware: 05.40.97
     - SoC: Realtek RTD2870 (Rockhopper, ARMv7 32-bit quad-core, 1GB RAM)
     - Engine: Chromium 53.0.2785.34
     - Background Service: Node.js 0.12.2
   - **Simulated & Desktop Tested**: Chromium 53 simulation in Playwright, Desktop Chrome 120+.
   - **Target Fleet**: LG webOS 4.0 through 24 (forward-compatible).
4. **Developer Quickstart**: Clear instructions for prerequisites (Node.js 22, webOS CLI), installation (`npm ci`), testing (`npm test`), and IPK packaging (`bash build.sh`).
5. **Upstream Attribution & Acknowledgments**: A prominent, grateful recognition of Lenny (`lennylxx`) and contributors for the foundational engine.
6. **Licensing**: Clear Apache 2.0 license declaration with links to `LICENSE` and `NOTICE`.

---

## 3. Comparison Matrix: Upstream vs. iCast README

| Section | Upstream README | iCast New README |
| :--- | :--- | :--- |
| **Brand Identity** | webOS IPTV Player | **iCast (Monochromatic Prism B)** |
| **Visual Aesthetics** | Cyan / Blue Saturated | **Obsidian (Dark) & Porcelain (Light)** |
| **Hardware Evidence** | Broad statement ("webOS 4+") | **Forensically audited on LG 65UM7400PDA** |
| **Design System Docs** | None | **8pt grid, Squircle radii, 3-tier Liquid Glass** |
| **Remote Navigation** | Brief mention | **D-pad dual-ring spatial focus contract** |
| **Background Service** | Mention of Luna | **Node 0.12.2 LAN upload & pairing architecture** |
| **Attribution** | Upstream root | **Full upstream acknowledgment to lennylxx** |
| **License** | Apache-2.0 | **Apache-2.0 (Dual attribution)** |

