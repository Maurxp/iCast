# AUDIT REPORT: SINGLE-BRANCH POLICY (MISSION R0.4)

> **Project**: iCast (webOS IPTV Player)  
> **Repository**: `https://github.com/Maurxp/iCast.git`  
> **Workspace**: `C:\Users\amaur\Desktop\webos-iptv-player`  
> **Date**: October 31, 2026  
> **Status**: **RATIFIED & DOCUMENTED**  

---

## 1. Executive Policy Statement

**iCast adopts an exclusive Single-Branch development and release architecture centered entirely on `main`.**

Under this policy:
* **`main`** is the **sole, definitive, and permanent branch** for:
  1. Feature integration.
  2. Codebase stabilization.
  3. Quality assurance and continuous testing.
  4. Production distribution and GitHub packaging.

### Prohibited Branch Archetypes
In order to eliminate integration drift, branch fragmentation, and maintenance overhead in an embedded TV environment, the following branch patterns are **strictly prohibited** in the iCast repository:
* `develop`
* `feature/*`
* `fix/*`
* `release/*`
* `hotfix/*`

Every contribution, bug fix, optimization, and security enhancement must be applied directly to `main` as an atomic, cohesive, and verified unit of work.

---

## 2. Commit Discipline: Conventional Commits

To ensure complete audibility and changelog generation without multi-branch complexity, all commits on `main` must strictly adhere to the **Conventional Commits v1.0.0** specification:

```
<type>(<optional scope>): <description>

[optional body explaining problem, root cause, and architectural why]

[optional footer(s)]
```

### Approved Commit Types
* **`feat`**: A new user-facing capability, UI surface, theme, or playback feature (e.g. `feat: add Obsidian and Porcelain theme switcher`).
* **`fix`**: A bug fix, stream decoder patch, or memory leak resolution (e.g. `fix: prevent native video focus leak on webOS 4`).
* **`refactor`**: A code change that neither fixes a bug nor adds a feature, improving code maintainability (e.g. `refactor: extract player track state into PlayerTracks`).
* **`perf`**: A code change that improves rendering or execution performance on limited TV hardware (e.g. `perf: virtualize category channel grid rendering`).
* **`test`**: Adding missing tests, correcting existing tests, or improving test fixtures (e.g. `test: add regression test for RFC1918 CORS origin rejection`).
* **`docs`**: Documentation only changes, README updates, or audit reports (e.g. `docs: calibrate 5-tier webOS compatibility matrix`).
* **`chore`**: Changes to the build process, auxiliary tools, dependencies, or repository governance (e.g. `chore: harden .gitignore against local testbed scripts`).
* **`security`**: Security vulnerability remediation, credential protection, or Luna access control hardening (e.g. `security: reject wildcard 0.0.0.0 binding in LAN service`).

### Quality Standard per Commit
1. **Atomicity**: Each commit represents a complete, self-contained change.
2. **Regression Gate**: Every fix ships with a colocated test.
3. **Green Build Gate**: No commit is merged or pushed unless `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass with zero errors.

---

## 3. Local Branch Inventory & Sunsetting Plan

A full audit of the current local and remote Git state was conducted:

```bash
$ git branch -a
  backup/pre-r03-establishment
  baseline/mission-0
  fix/mission-1b-hardening
  fix/mission-1b1-security-closure
  fix/mission-1b2-luna-trust
  fix/mission-1c-closure
  fix/mission-2-2-stabilization
* main
  remotes/upstream/HEAD -> upstream/main
  remotes/upstream/main
```

### Sunsetting and Cleanup Strategy
1. **Pre-Publication Freeze**:
   - `backup/pre-r03-establishment` and `fix/mission-2-2-stabilization` are **retained locally as safety points** during the publication phase.
   - They will NOT be pushed to `origin`.
2. **Post-Publication Decommissioning**:
   - Immediately following successful publication of `main` to `https://github.com/Maurxp/iCast.git` and verification of the GitHub Actions CI run, all historical local exploration branches (`fix/*`, `baseline/*`, `backup/*`) will be safely decommissioned using `git branch -D`.
   - The upstream tracking branches (`remotes/upstream/*`) will remain intact to enable future synchronization with Lenny's upstream repository.

---

## 4. Remote Architecture

* **`origin` (`https://github.com/Maurxp/iCast.git`)**:
  - The single official remote for iCast.
  - Receives all authorized pushes to `main`.
* **`upstream` (`https://github.com/lennylxx/webos-iptv-player.git`)**:
  - Read-only tracking remote for upstream updates.
  - Zero push operations are ever directed toward `upstream`.

**Certification**: Single-branch architecture formally established and documented.
