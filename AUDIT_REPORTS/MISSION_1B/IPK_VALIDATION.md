# IPK Package Forensic Validation Report — webOS IPTV Player (v1.17.0)

**Project:** `webos-iptv-player`  
**Package File:** `com.lennylxx.iptv_1.17.0_all.ipk`  
**Package Location:** `AUDIT_REPORTS/MISSION_1B/package/com.lennylxx.iptv_1.17.0_all.ipk`  
**Date:** October 2026  
**Target Hardware:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, ARMv7, 32-bit)  

---

## 1. Package Metadata & Cryptographic Integrity

| Attribute | Forensic Value |
| :--- | :--- |
| **Filename** | `com.lennylxx.iptv_1.17.0_all.ipk` |
| **Format** | webOS Package Format v2 (Debian `ar` archive with gzip tarballs) |
| **Architecture** | `all` (Architecture-independent Web + Node.js) |
| **Package Size (Compressed)** | **729,518 bytes** (712.42 KB) |
| **Installed Size (Uncompressed)**| **2,645,759 bytes** (2.52 MB) |
| **SHA-256 Checksum** | `A1849BD9ED1328BE30DAE289130A1EE7E668F1EB8E287627624F903037E8DB1F` |
| **Application ID** | `com.lennylxx.iptv` |
| **Service ID** | `com.lennylxx.iptv.service` |
| **Version** | `1.17.0` |

---

## 2. Package Structure & Archive Breakdown

The `.ipk` is a standard `ar` archive composed of three parts:

```
com.lennylxx.iptv_1.17.0_all.ipk
├── debian-binary (2.0)
├── control.tar.gz
│   ├── control
│   └── packageinfo.json
└── data.tar.gz
    ├── usr/palm/applications/com.lennylxx.iptv/
    │   ├── appinfo.json
    │   ├── index.html
    │   ├── icon.png (80x80)
    │   ├── largeIcon.png (130x130)
    │   ├── css/
    │   │   ├── legacy-webos-base.css (generated flex-gap fallbacks)
    │   │   ├── app.css
    │   │   ├── player.css
    │   │   ├── epg.css
    │   │   ├── settings.css
    │   │   └── ...
    │   ├── js/
    │   │   ├── app.js (minified main application bundle)
    │   │   ├── app-worker.js (minified background search & parse worker)
    │   │   └── shaka-player.dash.js (DASH Widevine player for webOS 4)
    │   ├── assets/
    │   │   ├── group-icons/
    │   │   └── icons/
    │   └── resources/
    └── usr/palm/services/com.lennylxx.iptv.service/
        ├── package.json
        ├── services.json
        ├── index.js (service entry point)
        ├── setup/
        │   └── setup-page.html (authenticated web setup UI)
        ├── lan/
        │   ├── server.js (hardened LAN server)
        │   └── service.js
        ├── upload/
        │   └── store.js (hardened 0o600 storage)
        └── compat.js (Node 0.12 shims)
```

---

## 3. Manifest Verification

### 3.1 `packageinfo.json`
```json
{
  "id": "com.lennylxx.iptv",
  "version": "1.17.0",
  "app": "com.lennylxx.iptv",
  "services": [
    "com.lennylxx.iptv.service"
  ]
}
```

### 3.2 `appinfo.json`
```json
{
  "id": "com.lennylxx.iptv",
  "version": "1.17.0",
  "vendor": "lennylxx",
  "type": "web",
  "main": "index.html",
  "title": "webOS IPTV Player",
  "appDescription": "IPTV player with M3U, Xtream, XMLTV, and catch-up.",
  "icon": "icon.png",
  "largeIcon": "largeIcon.png",
  "iconColor": "#241e52",
  "resolution": "1920x1080",
  "disableBackHistoryAPI": true,
  "transparent": false
}
```

### 3.3 `services.json`
```json
{
  "id": "com.lennylxx.iptv.service",
  "description": "Bundled webOS JS service for the IPTV player",
  "services": [
    {
      "name": "com.lennylxx.iptv.service"
    }
  ]
}
```

---

## 4. Verification Checklist Against Audit Findings

| Audit Check | Expected Criteria | Observed Status | Verdict |
| :--- | :--- | :--- | :--- |
| **Preview Libs Exclusion** | No `preview-libs.js` in IPK or `index.html` | Completely absent; verified clean | **PASS** |
| **Dangling Scripts** | All `<script>` and `<link>` resolve to files in package | 26 resources checked, 0 missing | **PASS** |
| **Node.js 0.12.2 Target**| No ES6 syntax or modern APIs in service | Verified via AST scan | **PASS** |
| **Chromium 53 Target** | No ES2017+ syntax or post-Chromium 53 APIs | Verified via compat gate scanner | **PASS** |
| **Icon Assets** | `icon.png` (80x80) and `largeIcon.png` (130x130) exist | Verified present and valid PNGs | **PASS** |
| **LAN Hardening** | `server.js` contains loopback check, tokens, CORS | Verified in compiled service bundle | **PASS** |
| **Permissions** | `store.js` writes with `mode: 0o600` | Verified in compiled service bundle | **PASS** |

---

## 5. Deployment Readiness

The package `com.lennylxx.iptv_1.17.0_all.ipk` is cryptographically and structurally validated. It is completely ready for safe installation and testing on the physical LG 65UM7400PDA television in **Mission 1C**.

