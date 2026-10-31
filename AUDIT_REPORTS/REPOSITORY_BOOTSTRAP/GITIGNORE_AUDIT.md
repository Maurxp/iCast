# .gitignore Audit & Hardening Specification — Mission R0.1

## 1. Audit of Existing `.gitignore`

The original `.gitignore` inherited from upstream was basic (11 lines):

```gitignore
node_modules/
dist/
*.ipk
*.manifest.json
.DS_Store

# Test artifacts
test-output/

# Built JS service for the IPK
build/
```

### 1.1 Vulnerabilities & Gaps Identified:
1. **Secrets & Environment Variables**: No rules preventing accidental commits of `.env`, `.env.local`, API tokens, or SSH/TLS keys.
2. **OS & Editor Artifacts**: Ignored `.DS_Store`, but failed to exclude Windows `Thumbs.db`, JetBrains `.idea/`, Visual Studio `.vs/`, or editor swap files (`*.swp`).
3. **Playwright & Test Artifacts**: Only excluded `test-output/`, but left `playwright-report/` and `test-results/` exposed to accidental staging.
4. **Log Files**: No protection against npm debug logs or memory heap dumps (`*.log`, `npm-debug.log*`).

---

## 2. Hardened `.gitignore` Specification for iCast

The proposed `.gitignore` protects secrets and build outputs while explicitly safeguarding test fixtures and mission audit reports:

```gitignore
# ==========================================
# iCast — Professional .gitignore
# ==========================================

# Dependencies
node_modules/
.pnp/
.pnp.js

# Build Outputs & Generated Packages
dist/
build/
*.ipk
*.manifest.json
package-lock.json.bak

# Test Artifacts & Coverage Reports
test-output/
test-results/
playwright-report/
blob-report/
coverage/
.nyc_output/

# Logs & Debugging Output
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Environment Variables & Secrets
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.pem
*.key
*.cert
*.pfx

# Operating System & Filesystem Metadata
.DS_Store
.AppleDouble
.LSOverride
Icon?
Thumbs.db
ehthumbs.db
Desktop.ini

# IDE & Editor Configurations
.idea/
.vs/
*.sublime-project
*.sublime-workspace
*.swp
*.swo
*~

# VS Code — Keep settings/extensions/launch, ignore local state
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.vscode/*.log

# Temporary & Cache Directories
.cache/
.eslintcache
.stylelintcache
tmp/
temp/

# Critical Invariant Whitelist (Never Ignore)
!assets/brand/
!licenses/
!AUDIT_REPORTS/
!scripts/fixtures/
```

---

## 3. Verification with `git check-ignore`

All rules were validated against active paths in the repository:
- `git check-ignore dist/` -> Ignored.
- `git check-ignore com.lennylxx.iptv_1.17.0_all.ipk` -> Ignored.
- `git check-ignore node_modules/` -> Ignored.
- `git check-ignore AUDIT_REPORTS/REPOSITORY_BOOTSTRAP/README.md` -> NOT ignored (Preserved).
- `git check-ignore assets/brand/isotype_obsidian.svg` -> NOT ignored (Preserved).
- `git check-ignore scripts/fixtures/sample.m3u` -> NOT ignored (Preserved).

