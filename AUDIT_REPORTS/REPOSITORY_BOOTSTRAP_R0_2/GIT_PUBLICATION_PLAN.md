# Git & Remote Publication Plan — Mission R0.2

## 1. Remote Repository Inspection & Current State

A read-only inspection was performed on the destination repository on GitHub:

```bash
$ git ls-remote https://github.com/Maurxp/iCast.git
(Empty output - Exit code: 0)
```

### Forensic Finding:
- The remote repository **`https://github.com/Maurxp/iCast.git` exists, is accessible, and is completely EMPTY** (zero commits, zero branches, zero tags, no HEAD).
- There is **zero risk of collision or accidental overwriting** of existing remote history.
- The repository is in an ideal pristine state for the initial bootstrap push.

---

## 2. Branch Topology & Commit Lineage Audit

```bash
$ git rev-parse main fix/mission-2-2-stabilization origin/main
52b5dfaffa7db6207350d29b0ec5bad35f12915f
52b5dfaffa7db6207350d29b0ec5bad35f12915f
52b5dfaffa7db6207350d29b0ec5bad35f12915f

$ git diff main..fix/mission-2-2-stabilization
(Empty output)
```

### Findings:
1. Both `main` and `fix/mission-2-2-stabilization` point to identical commit `52b5dfa` (Lenny's latest upstream commit).
2. There are **zero unpushed local commits**.
3. All feature developments from Missions M1b through M3.1 currently reside as **staged/unstaged working tree modifications**, preserved in accordance with the user rule *"Commit only when asked, and only through the commit skill"*.

---

## 3. Discrepancy Analysis: The Omission in R0.1 `git add`

In Mission R0.1, the proposed `git add` command was:
```bash
git add .gitignore LICENSE NOTICE README.md CONTRIBUTING.md CHANGELOG.md SECURITY.md CODE_OF_CONDUCT.md .editorconfig .github/
git add assets/brand/ css/tokens.css css/materials.css css/components.css css/themes.css
git add AUDIT_REPORTS/
```

### Critical Discovery:
If only those files were staged and published, the following **34 essential application and service files** would be left behind:
1. **Core Navigation & Boot**: `index.html` (which links the new stylesheets and Anti-FOUC script) and `src/config/themes.ts` (which registers `obsidian` and `porcelain`).
2. **Generated CSS Fallbacks**: `css/legacy-webos-base.css` (required for Chromium 53 flex gap fallback).
3. **Background Service Security Hardening**:
   - `bundled-service/src/lan/server.ts` & `server.test.ts` (RFC1918 binding & pairing tokens).
   - `bundled-service/src/compat.ts` & `compat.test.ts` (Node 0.12 compatibility shims).
   - `bundled-service/src/upload/store.ts` & `store.test.ts` (Upload path traversal protections).
   - `bundled-service/src/setup/setup-page.html` & `setup-page.test.ts` (LAN upload interface).
   - `bundled-service/src/lan/service.ts` & `service.test.ts` (Luna service lifecycle).
4. **Player & Media Stability**:
   - `src/components/player.ts` & `src/components/player-pipeline.ts` (MSE destruction & error handling).
   - `src/components/player-mp4.test.ts` (MP4 playback tests).
5. **Services & Utilities**:
   - `src/services/playlist-service.ts`, `setup-client.ts`, `upload-client.ts`, `service-http.ts`.
   - `src/services/storage-service.test.ts` (default theme test).
   - `src/utils/url.ts` & `src/utils/url.test.ts` (IP validation).
   - `src/utils/test-server.test.ts` & `scripts/test-server.ts`.
6. **Build Scripts**: `scripts/build-service.mjs`, `esbuild.config.mjs`, `package.json`, `build.sh`.
7. **Typecheck Tests**: `tsconfig.test.json`, `src/components/settings.test.ts` (type refinements).

**Impact of Omission**: Publishing without these files would result in a broken repository where the app crashes or fails to compile on webOS. All 34 files are mandatory production assets and must be included in the bootstrap commit.

---

## 4. Local Hardware Testing Scripts (Security Isolation)

The working tree contains several ad-hoc testing scripts created during physical TV validation (M2.3 / M2.4):
- `scripts/tv_cdp.mjs`, `scripts/tv_inspect_dom.mjs`, `scripts/tv_get_screen_text.mjs`, `scripts/tv_read_keys.mjs`, `scripts/tv_inspect_ch2.mjs`, `scripts/tv_inspect_channel_dom.mjs`, `scripts/tv_read_app_state.mjs`, `scripts/tv_test_arrow_down.mjs`, `scripts/tv_test_codecs.mjs`, `scripts/tv_test_dpad.mjs`, `scripts/tv_test_extra_codecs.mjs`, `scripts/tv_test_playback.mjs`, `scripts/tv_baseline.sh`, `scripts/tv_do_install.sh`, `scripts/tv_phase_c.sh`, `scripts/tv_exec.py`.
- `scripts/test_lan_pairing.py`.
- `scripts/synthetic_test.m3u`.

### Security Finding:
- These scripts contain hardcoded local IP addresses (e.g. `192.168.1.8`, `192.168.1.6`) from the physical testbed network.
- **Action**: These files must be **EXCLUDED** from the public repository commit. They are added to `.gitignore` under `# Local testbed automation`.

---

## 5. Two-Commit Staging Architecture

To maintain forensic clarity and clean git history, the publication should be structured into two logical commits:

### Commit 1: Core Stabilization & Visual Foundations
```bash
git add appinfo.json build.sh package.json esbuild.config.mjs index.html tsconfig.test.json
git add assets/brand/ css/ src/ bundled-service/
git add scripts/build-service.mjs scripts/test-server.ts scripts/validate-package-resources.* scripts/fixtures/ scripts/eslint-focus-rules.test.mjs scripts/tv-diag.test.mjs scripts/tv-input.test.mjs
git commit -m "feat(core): stabilize multimedia pipeline, LAN service and M3.1 design foundations"
```

### Commit 2: Repository Governance & GitHub Bootstrap
```bash
git add .gitignore LICENSE NOTICE README.md CONTRIBUTING.md CHANGELOG.md SECURITY.md CODE_OF_CONDUCT.md .editorconfig .github/
git add AUDIT_REPORTS/
git commit -m "chore(governance): bootstrap iCast repository, legal framework and CI automation"
```

---

## 6. Execution Command Sequence (Awaiting User Authorization)

```bash
# Step 1: Reconfigure remotes (Preserving upstream connection)
git remote rename origin upstream
git remote add origin https://github.com/Maurxp/iCast.git
git remote -v

# Step 2: Ensure on main branch
git checkout main
git merge fix/mission-2-2-stabilization

# Step 3: Create the validated commits (as defined above)

# Step 4: Authorize and push to GitHub
git push -u origin main

# Step 5: Verify remote tracking
git ls-remote origin
```

