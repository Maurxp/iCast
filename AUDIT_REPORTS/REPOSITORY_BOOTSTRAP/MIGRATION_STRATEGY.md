# Repository Migration & Governance Strategy — Mission R0.1

## 1. Identity Triad: Repository, Brand, and Platform App ID

A successful transition of **iCast** requires distinguishing three distinct identity layers:

```
+---------------------------------------------------------------------------------+
|                                IDENTITY TRIAD                                   |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [ LAYER 1: REPOSITORY IDENTITY ]                                               |
|  - GitHub Repository: https://github.com/Maurxp/iCast.git                      |
|  - Project Name: iCast                                                          |
|  - Package Name: icast (or @maurxp/icast)                                       |
|  - Upstream Tracking: https://github.com/lennylxx/webos-iptv-player              |
|                                                                                 |
|  [ LAYER 2: BRAND & VISUAL IDENTITY ]                                           |
|  - Commercial Name: iCast                                                       |
|  - Isotype: Alternative B (Monochromatic Prism)                                 |
|  - Visual Language: Obsidian (Dark) & Porcelain (Light)                         |
|  - Material System: 3-Tier Liquid Glass (Level 1 Solid, Level 2-3 Optical)      |
|                                                                                 |
|  [ LAYER 3: TECHNICAL PLATFORM IDENTIFIER ]                                     |
|  - webOS App ID: com.lennylxx.iptv (PRESERVED)                                  |
|  - Service ID: com.lennylxx.iptv.service (PRESERVED)                            |
|  - Status: Legacy Technical Identifier (Pending migration analysis)            |
+---------------------------------------------------------------------------------+
```

### 1.1 Technical Justification for Retaining `com.lennylxx.iptv`
Changing the webOS App ID at this stage would have catastrophic effects on existing deployments:
1. **Data Sandbox Wipe**: webOS isolates `localStorage` and `IndexedDB` strictly by App ID. Changing it would instantly erase all saved playlists, credentials, favorites, and parental PINs on deployed televisions.
2. **Luna Service Registration**: webOS requires background service IDs to share the application prefix (`<appId>.service`). Changing the App ID requires restructuring the security permissions in `bundled-service/services.json`.
3. **Physical TV Conflict**: The physical LG TV testbed would treat a new App ID as a separate application rather than an in-place upgrade, preventing side-by-side verification and rollback.

**Recommendation**: Retain `com.lennylxx.iptv` in `appinfo.json` for all M3 missions. An App ID migration tool can be introduced in a future release if deemed necessary.

---

## 2. Git Migration Strategy Analysis

Three potential approaches were evaluated for bootstrapping `https://github.com/Maurxp/iCast.git`:

| Strategy | History Preserved | Upstream Sync | Legal Traceability | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Hard Reset / Squashed Import** | No (Squashed) | Very Difficult | Low | Disapproved |
| **Option B: Preserved History Fork** | **Yes (Full)** | **Seamless** | **Highest (100%)** | **RECOMMENDED** |
| **Option C: Git Submodule** | Partial | Complex | Medium | Disapproved |

### Why Option B is the Superior Engineering Solution:
1. **Complete Provenance**: Retains every historical commit by Lenny and contributors, satisfying Apache 2.0 attribution requirements.
2. **Upstream Merging**: Allows iCast to pull future bug fixes or codec patches directly from `lennylxx/webos-iptv-player` via `git fetch upstream && git merge upstream/main`.
3. **Independent Autonomy**: iCast develops its own roadmap on `main` and feature branches without depending on upstream pull requests.

---

## 3. Remote Configuration Blueprint

When publication is approved, the local repository will transition to the dual-remote model:

```bash
# 1. Rename existing origin to upstream
git remote rename origin upstream

# 2. Add the official iCast GitHub repository as new origin
git remote add origin https://github.com/Maurxp/iCast.git

# 3. Verify configuration
git remote -v
# origin    https://github.com/Maurxp/iCast.git (fetch & push)
# upstream  https://github.com/lennylxx/webos-iptv-player.git (fetch & push)
```

---

## 4. Branching Model & Workflow Conventions

iCast adopts a structured Git flow tailored to embedded television validation:

```
main (Production, 100% stable, physical hardware validated)
  ▲
  │ (PR with gate check & approval)
develop (Integration branch for completed missions)
  ▲
  ├─ feature/m3-2-tabbar (TabBar & Navigation rail)
  ├─ feature/m3-3-live-epg (Live TV & EPG screens)
  ├─ feature/m3-4-catalog (Xtream VOD & Series)
  └─ fix/issue-description (Bug fixes with regression tests)
```

### Commit Message Standard (Conventional Commits):
- Format: `<type>(<scope>): <subject>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- Strict Rules:
  - First line ≤ 72 characters.
  - Imperative present tense ("add", "fix", not "added", "fixes").
  - Zero trailers (`Co-authored-by`, etc.) unless mandated.
  - Must include rationale in body if non-obvious.

