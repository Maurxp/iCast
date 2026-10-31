# Security Policy

## 1. Supported Versions

Security updates are provided for the following releases:

| Version | Supported | Target Environment |
| :--- | :--- | :--- |
| **1.17.x (iCast)** | :white_check_mark: | LG webOS 4.x - 24.x |
| < 1.17.0 | :x: | Legacy releases |

---

## 2. Reporting a Vulnerability

The iCast team takes security and user privacy seriously. If you discover a security vulnerability in iCast (including local LAN pairing, token exposure, Luna bus handling, or M3U injection risks), please report it responsibly.

### How to report:
1. **Do NOT open a public GitHub issue** for undisclosed security vulnerabilities.
2. Send an email to the repository maintainer (`mauricio.dev.security@gmail.com` or via GitHub Private Vulnerability Reporting on `https://github.com/Maurxp/iCast`).
3. Include:
   - Detailed description of the vulnerability.
   - Exact steps or minimal synthetic payload to reproduce the issue.
   - Affected device model and webOS version (e.g. LG 65UM7400PDA / webOS 4.10.2).
   - Any potential mitigations or patch suggestions.

---

## 3. Vulnerability Response Timeline

- **Initial Acknowledgment**: Within 48 hours of receipt.
- **Triage & Assessment**: Within 5 business days.
- **Fix & Public Advisory**: Coordinated release within 30 days of validation.

---

## 4. Local Hardware & Network Security Notice

- iCast runs with restricted permissions under webOS WebAppMgr.
- The LAN pairing server binds strictly to RFC1918 private IPv4 addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) and enforces a cryptographic pairing token for playlist uploads.
- Never expose the webOS Developer Mode port (9922 / 9998) or Chrome DevTools Protocol endpoint directly to public networks or untrusted Wi-Fi environments.

