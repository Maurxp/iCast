# Remaining Risks & Mission 1C Validation Matrix — LG 65UM7400PDA

**Project:** `webOS IPTV Player` (v1.17.0)  
**Target Hardware:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, ARMv7, 32-bit)  
**Current Phase:** Post-Mission 1B (PC Hardening & Packaging Complete)  
**Next Phase:** Mission 1C (On-Device Installation & Dynamic Verification)  
**Date:** October 2026  

---

## 1. Executive Summary

Mission 1B successfully hardened the LAN setup service, eliminated the `preview-libs.js` packaging defect, verified compatibility with Node 0.12.2 and Chromium 53, and produced a verified reproducible IPK package.

Because Mission 1B operated strictly on the PC without touching the physical TV, certain platform-specific and hardware-coupled behaviors cannot be completely validated in a synthetic desktop environment. This document categorizes these residual risks and defines the dynamic test matrix required for **Mission 1C**.

---

## 2. Residual Risks Breakdown

### 2.1 Risk R-01: Luna Service Bus Registration & IPC Lifecycle
- **Description:** On real webOS 4, the bundled service `com.lennylxx.iptv.service` registers with the Luna Service Bus (`luna://com.lennylxx.iptv.service`).
- **Risk:** If the TV's security configuration or service manager rejects the service registration, the LAN setup server will not launch automatically, preventing phone pairing and playlist uploads.
- **Why It Requires Device Testing:** Luna bus IPC cannot be emulated on Windows.
- **Mission 1C Test:** Inspect `journalctl -u com.lennylxx.iptv.service` or check `luna-send` responses after app launch.

### 2.2 Risk R-02: Network Interface Detection (`getLanIp()`)
- **Description:** The setup service enumerates network interfaces via `os.networkInterfaces()` to construct pairing URLs (`http://<ip>:<port>/setup`).
- **Risk:** On webOS TVs, network interface names vary (`eth0` for wired Ethernet, `wlan0` for Wi-Fi, `p2p0` for Wi-Fi Direct). If multiple interfaces are active or if `internal` flags differ, `getLanIp()` could bind or report the wrong IP to the user.
- **Mission 1C Test:** Verify that the QR code and on-screen pairing URL display the correct TV IP (`192.168.1.8`) on both Ethernet and Wi-Fi.

### 2.3 Risk R-03: Native Media Pipeline (Video Plane Punch-Through)
- **Description:** On webOS, video playback is handled by a native hardware media server (e.g. `gstreamer` or `libav` in the Starfish OS media pipeline), displaying video through a transparent "punch-through" hole cut into the Chromium web page.
- **Risk:**
  - HLS streams with discontinuous PTS or variant audio codecs might stall.
  - Calling `com.webos.media/selectTrack` directly can cause decode errors; tracks must switch strictly via HTML5 `audioTracks[i].enabled`.
- **Mission 1C Test:** Verify smooth playback of standard HLS, MPEG-TS, and Xtream streams on the real hardware video plane.

### 2.4 Risk R-04: RAM Budget & Memory Pressure under Large Playlists
- **Description:** The LG 65UM7400PDA has limited RAM shared with the TV firmware and graphic compositor.
- **Risk:** Feeds with 20,000+ channels could trigger WAM (Web Application Manager) low-memory warnings or process termination if DOM nodes or memory allocations spike during parsing.
- **Mitigation in Place:** Chunked web worker parsing (`app-worker.js`) and virtualized channel lists (`virtual-grid.ts`).
- **Mission 1C Test:** Monitor process RSS memory via `scripts/tv-perf.mjs` and `top` via SSH during full catalog refresh.

### 2.5 Risk R-05: Remote Control Input & Focus Ring Rendering
- **Description:** Magic Remote pointer mode emits native browser `click` and `mousemove` events, while D-pad keys emit keydown events handled by `SpatialNav`.
- **Risk:** Ensure no double-click events occur when clicking with the Magic Remote wheel button over interactive controls, and ensure only one focus ring is active at any time.
- **Mission 1C Test:** Verify remote control D-pad navigation and Magic Remote pointer hover/click behavior.

---

## 3. Mission 1C Validation Matrix

| Target Area | Dynamic Verification Test | Success Criteria |
| :--- | :--- | :--- |
| **Package Installation** | `ares-install --device lg-tv AUDIT_REPORTS/MISSION_1B/package/com.lennylxx.iptv_1.17.0_all.ipk` | App installs cleanly without ACG or signature errors. |
| **Cold Boot** | `ares-launch --device lg-tv com.lennylxx.iptv` | App boots cleanly to main UI in < 3.5s without stuck loading screen. |
| **Console Errors** | Inspect DevTools via `ares-inspect --device lg-tv --app com.lennylxx.iptv` | Zero `ERR_FILE_NOT_FOUND` errors; no `preview-libs.js` references. |
| **Service Status** | SSH check: `ps | grep com.lennylxx.iptv.service` | Node.js 0.12.2 service is running and listening on ephemeral port. |
| **LAN Pairing** | Open `http://192.168.1.8:<port>/setup` on mobile browser | Setup page loads, accepts 4-digit PIN, pairs successfully. |
| **Upload Security** | Run `curl -X GET http://192.168.1.8:<port>/uploads` without token | Returns `403 Forbidden` (`Invalid setup token`). |
| **M3U Upload & Play** | Upload test playlist from phone | Upload succeeds, appears in TV channel list, plays natively. |
| **Parental PIN** | Set and verify PIN in settings | PIN sets, verifies cleanly, locks out after 5 failures. |

