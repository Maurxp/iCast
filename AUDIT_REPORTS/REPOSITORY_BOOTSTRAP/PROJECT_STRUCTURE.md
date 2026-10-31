# Repository Architecture & Directory Structure — Mission R0.1

## 1. Architectural Principles

In embedded webOS application development, the repository structure is intimately bound to:
1. **The webOS packaging toolchain (`ares-package` / `build.sh`)**: Expects root assets (`appinfo.json`, `index.html`, `icon.png`, `bundled-service/`).
2. **esbuild bundling paths (`esbuild.config.mjs`)**: Directly references `src/app.ts`, `dist/js/`, and stylesheet cascade lists.
3. **Chromium 53 runtime constraints**: Relies on relative asset loading paths.

Therefore, an arbitrary reorganization or flattening of directories would introduce critical regressions into build scripts, import specifiers, and TV packaging. iCast adopts a clean, professional, and audit-compliant structure that preserves every build contract.

---

## 2. Directory Map & Functional Classification

```
iCast/
├── .github/
│   ├── workflows/             # CI/CD pipelines (build, test, lint, matrix)
│   └── ISSUE_TEMPLATE/        # Standardized GitHub issue templates
├── assets/
│   └── brand/                 # iCast vector assets (isotype, logos, app icon)
├── bundled-service/           # webOS Background Service (Node.js 0.12.2 / CommonJS)
│   ├── src/                   # Service logic (Luna bus, LAN upload, pairing)
│   ├── package.json           # Isolated service dependency tree
│   └── tsconfig.json          # ES5/CommonJS compilation configuration
├── css/                       # Cascading Style Sheets (Chromium 53 compatible)
│   ├── tokens.css             # M3.1 Design tokens (spacing, radii, typography, elevation)
│   ├── materials.css          # M3.1 3-Tier Liquid Glass material system
│   ├── themes.css             # M3.1 Obsidian & Porcelain palettes + legacy mappings
│   ├── components.css         # M3.1 Foundational UI components (.icast-*)
│   ├── legacy-webos-base.css  # Auto-generated flex-gap fallbacks for webOS 4
│   └── *.css                  # Dedicated view and feature stylesheets
├── docs/                      # Technical platform documentation & architecture specs
│   ├── audio-track-selection.md
│   ├── hls-subtitles.md
│   ├── mpeg-dash.md
│   └── vod-subtitles.md
├── licenses/                  # Standalone third-party license notices & sources
│   ├── SOURCES.txt            # Upstream provenance audit for third-party libraries
│   └── *.txt                  # MIT / Apache license copies (Shaka, Twemoji, ASS)
├── scripts/                   # Developer tooling, build automation & test harnesses
│   ├── compat-gate.mjs        # Chromium 53 API compatibility scanner
│   ├── css-transforms.mjs     # Flex-gap and color syntax transformer
│   ├── test-server.ts         # Hardened local RFC1918 test stream server
│   └── tv-*.mjs               # Hardware automation & diagnostic harnesses
├── src/                       # iCast Core TypeScript Client Application
│   ├── components/            # UI components (Player, TabBar, CatalogView, Settings)
│   ├── config/                # Platform constants, theme definitions, keys
│   ├── navigation/            # Spatial navigation, D-pad routing, focus rings
│   ├── parsers/               # High-tolerance M3U & XMLTV parsers
│   ├── services/              # Facades (Storage, Theme, EPG, Reminder, Xtream)
│   ├── utils/                 # DOM reconciliation (morph), logger, URL helpers
│   ├── workers/               # Web workers for background indexing and search
│   ├── app.ts                 # Main application orchestrator & entry point
│   └── globals.d.ts           # Compile-time constants & global declarations
├── AUDIT_REPORTS/             # Forensic mission audits & compliance certificates
│   ├── MISSION_2_2/           # Stabilization & media validation
│   ├── MISSION_2_3/           # Controlled deployment & hardware evidence
│   ├── MISSION_2_4/           # CDP security assessment & WebAppMgr
│   ├── MISSION_3_0/           # Initial brand & design system exploration
│   ├── MISSION_3_0_1/         # Monochromatic Prism refinement
│   ├── MISSION_3_1/           # Visual foundations implementation & demo
│   └── REPOSITORY_BOOTSTRAP/  # Governance, licensing & GitHub migration
├── .editorconfig              # Universal indentation & whitespace rules
├── .gitignore                 # Professional environment & build exclusions
├── appinfo.json               # webOS packaging manifest (id: com.lennylxx.iptv)
├── build.sh                   # Official IPK packaging script
├── esbuild.config.mjs         # Production bundle configuration & compat gate
├── eslint.config.mjs          # JavaScript compatibility linting
├── index.html                 # 1080p entry canvas & Anti-FOUC initialization
├── LICENSE                    # Apache 2.0 dual copyright license
├── NOTICE                     # Official Apache 2.0 attribution statement
├── package.json               # Root dependencies & build scripts
├── README.md                  # Comprehensive root documentation for iCast
├── stylelint.config.mjs       # CSS compatibility linting
├── THIRD_PARTY_NOTICES.txt    # Bundled third-party intellectual property notices
├── tsconfig.json              # Strict production TypeScript configuration
└── vitest.config.ts           # Unit & integration testing harness configuration
```

---

## 3. Structural Integrity Verification

- **Import Paths**: All imports in `src/` use relative paths (`../components/`, `../services/`) or root-relative aliases that remain 100% valid.
- **Service Isolation**: `bundled-service/` remains an independent CommonJS package executed by Node.js 0.12.2 on webOS 4, preventing dependency pollution from root npm packages.
- **Build Isolation**: Output artifacts are confined to `dist/` (webOS bundle) and root `.ipk` files, ensuring zero source-tree contamination.

