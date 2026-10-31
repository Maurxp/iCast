# CI/CD Pipeline & GitHub Actions Specification — Mission R0.1

## 1. Audit of Upstream Workflow

The inherited workflow in [`.github/workflows/build.yml`](file:///c:/Users/amaur/Desktop/webos-iptv-player/.github/workflows/build.yml) was analyzed:

### Strengths:
- **webOS Packaging Integration**: Utilizes `@webos-tools/cli@3.2.5` to package genuine `.ipk` binaries.
- **Service Smoke Matrix**: Tests the background service across a wide matrix of Node.js versions (Node 0.12.2 on webOS 4 through Node 20+ on webOS 24).
- **Chromium 53 Compat Gate**: Runs Stylelint with `iptv/no-mixed-legacy-selector` and ESLint with `eslint-plugin-compat`.

### Deficiencies in Upstream Configuration:
1. **Monolithic Job Execution**: A single `build` job combines typecheck, unit tests, E2E tests, and IPK packaging. A failure in an unrelated benchmark stops the entire package generation.
2. **Missing Test Diagnostics Gate**: Does not execute typechecking on test files or scripts.
3. **Artifact Retention Hygiene**: Artifact uploads lack structured SHA-256 manifests for binary provenance verification.

---

## 2. Proposed CI/CD Architecture for iCast

The new pipeline is structured into four specialized, parallelizable jobs:

```
+-----------------------------------------------------------------+
|                        GitHub Actions Push / PR                 |
+-------------------------------+---------------------------------+
                                |
        +-----------------------+-----------------------+
        |                                               |
        v                                               v
+-------------------------------+               +-------------------------------+
|  Job 1: Quality & Compat Gate |               |   Job 2: Unit & Matrix Tests  |
|  - TypeScript Typecheck       |               |   - Vitest Unit Suite         |
|  - ESLint (Chrome 53 Target)  |               |   - Service Smoke Matrix      |
|  - Stylelint CSS Compat Gate  |               |     (Node 0.12 to Node 22)    |
+---------------+---------------+               +---------------+---------------+
                |                                               |
                +-----------------------+-----------------------+
                                        |
                                        v
                        +-------------------------------+
                        |  Job 3: E2E Playwright Tests  |
                        |  - Modern Chromium Headless   |
                        |  - Chromium 53 Quirks Sim     |
                        +---------------+---------------+
                                        |
                                        v
                        +-------------------------------+
                        |   Job 4: Build & IPK Package  |
                        |   - Production esbuild Bundle |
                        |   - ares-package IPK Creation |
                        |   - SHA-256 Manifest Creation |
                        |   - Artifact Upload (IPK + ck)|
                        +-------------------------------+
```

---

## 3. Recommended Workflow Specification (`.github/workflows/ci.yml`)

```yaml
name: iCast CI & Quality Gate

on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  quality-gate:
    name: Code Quality & Engine Compatibility Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript Typecheck (Production)
        run: npm run typecheck

      - name: Service Typecheck
        run: npm run service:typecheck

      - name: CSS Compatibility Gate (Stylelint)
        run: npm run lint:css

      - name: JS Engine Compatibility Gate (ESLint)
        run: npm run lint:js

  test-suite:
    name: Unit & Service Compatibility Matrix
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Vitest Unit Tests
        run: npm test

      - name: Build Service
        run: npm run service:build

      - name: Service Runtime Matrix Smoke Test
        run: npm run service:smoke:matrix

  package-ipk:
    name: Build & Package webOS IPK
    needs: [quality-gate, test-suite]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install official webOS CLI
        run: npm install -g @webos-tools/cli@3.2.5

      - name: Compile Production Bundle
        run: npm run build

      - name: Package IPK Binary
        run: bash build.sh

      - name: Generate Checksums
        run: |
          sha256sum *.ipk > IPK_CHECKSUMS.sha256
          cat IPK_CHECKSUMS.sha256

      - name: Archive Production IPK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: icast-webos-package
          path: |
            *.ipk
            IPK_CHECKSUMS.sha256
          retention-days: 14
```

---

## 4. Security & Secret Hygiene

- **Zero Secrets in CI**: The build and packaging process requires no private tokens, API keys, or developer mode passwords.
- **No Automatic Publishing**: Official GitHub Releases are triggered exclusively on authenticated `v*` tag pushes, never on routine branch commits.
- **Reproducible Artifacts**: SHA-256 manifests ensure full provenance verification before on-device installation.

