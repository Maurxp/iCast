# Publication & GitHub Migration Checklist — Mission R0.1

## 1. Safety Status: STRICT FREEZE & NO-PUSH INVARIANT

> [!IMPORTANT]
> In strict accordance with Mission R0.1 guidelines, **ZERO git push commands have been executed**. No remote repository state has been altered. Publication remains strictly pending explicit user review and authorization.

---

## 2. Pre-Publication Verification Checklist

| Verification Category | Check Item | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Secrets & Credentials** | Zero private API keys, tokens, or passwords in tree | Automated regex audit across files | **CLEAN (0 secrets)** |
| **SSH / TLS Keys** | No `.pem`, `.key`, or certificate files tracked | `git status` & file search | **CLEAN** |
| **Intellectual Property** | Original Apache 2.0 license retained | `LICENSE` file audit | **VERIFIED** |
| **Upstream Attribution** | Lenny (`lennylxx`) credited in `NOTICE` & `README` | Document inspection | **VERIFIED** |
| **Platform Identifier** | `com.lennylxx.iptv` preserved in `appinfo.json` | `git diff appinfo.json` | **PRESERVED** |
| **Typecheck Gate** | `npm run typecheck` (`tsc --noEmit`) passes | Compiler execution | **PASS (0 errors)** |
| **CSS Linter Gate** | `npm run lint:css` (Stylelint Chromium 53) | Linter execution | **PASS (0 errors)** |
| **JS Linter Gate** | `npm run lint:js` (ESLint Chrome 53 compat) | Linter execution | **PASS (0 errors)** |
| **Unit Test Suite** | 3,564 tests across 155 test suites pass | `vitest run` execution | **PASS (100%)** |
| **Production Build** | `npm run build` produces clean Chromium 53 bundle | esbuild execution | **PASS (Clean)** |
| **Git Working Tree** | All modified & untracked files cataloged | `GIT_HISTORY_AUDIT.md` | **PRESERVED** |

---

## 3. Step-by-Step Publication Procedure (Awaiting User Authorization)

Once the user reviews this audit and provides explicit authorization, the following exact command sequence will transition the repository:

### Step 1: Inspect Destination Repository
Verify whether `https://github.com/Maurxp/iCast.git` is empty or contains an initial commit:
```bash
git ls-remote https://github.com/Maurxp/iCast.git
```
*(If the destination already contains commits, inspect them before any push; never force-overwrite).*

### Step 2: Configure Remotes
Preserve upstream connectivity while setting the new origin:
```bash
git remote rename origin upstream
git remote add origin https://github.com/Maurxp/iCast.git
git remote -v
```

### Step 3: Stage and Commit the Governance Baseline
Stage the hardened governance files, new brand assets, design tokens, and audit reports:
```bash
git add .gitignore LICENSE NOTICE README.md CONTRIBUTING.md CHANGELOG.md SECURITY.md CODE_OF_CONDUCT.md .editorconfig .github/
git add assets/brand/ css/tokens.css css/materials.css css/components.css css/themes.css
git add AUDIT_REPORTS/
git commit -m "chore(governance): bootstrap iCast repository and brand foundations"
```

### Step 4: Authorize and Push to GitHub
Push the validated history and branches to `origin`:
```bash
git push -u origin main
```

---

## 4. Certification

The repository at `C:\Users\amaur\Desktop\webos-iptv-player` is completely frozen, audited, and verified. No unauthorized network or push operations have taken place.

