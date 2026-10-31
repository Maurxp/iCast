# INFORME DE COMPROBACIONES PREVIAS AL DESPLIEGUE (PRE-DEPLOYMENT CHECK)
## Misión M2.3 — webOS IPTV Player v1.17.0
**Fecha:** 2026-10-30  
**Dispositivo:** LG 65UM7400PDA  
**Plataforma:** webOS TV Lite 4.10.2-29 / API 4.1.0  
**Estado:** COMPROBADO Y SUPERADO (PASS)

---

## 1. Verificación Criptográfica de Paquetes IPK

Antes de cualquier interacción de despliegue sobre el televisor objetivo, se verificaron localmente los hashes criptográficos SHA-256 de ambos paquetes autorizados en el workspace local.

| Paquete | Ruta Local | Tamaño (bytes) | SHA-256 Esperado | SHA-256 Calculado | Coincidencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IPK Candidato M2.2** | `AUDIT_REPORTS/MISSION_2_2_1_2/package/com.lennylxx.iptv_1.17.0_all.ipk` | 734.610 | `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531` | `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531` | **EXACTA (PASS)** |
| **IPK Rollback M2** | `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk` | 733.772 | `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5` | `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5` | **EXACTA (PASS)** |

**Conclusión:** Ambos artefactos coinciden bit a bit con los hashes aprobados en las auditorías M2 y M2.2.1.2.

---

## 2. Identificación del Dispositivo Objetivo

Se realizó la consulta directa al hardware mediante la herramienta oficial webOS CLI `ares-device -i -d LG-TV`. Los datos devueltos por el sistema identificaron de forma unívoca el televisor físico:

```json
{
  "modelName": "65UM7400PDA",
  "sdkVersion": "4.10.0",
  "firmwareVersion": "05.40.97",
  "boardType": "K5LP_DVB_EU",
  "otaId": "HE_DTV_W19P_AFADABAA"
}
```

* **Dirección IP del Dispositivo:** `192.168.1.8`
* **Puerto de Servicio SSH:** `22` (Dropbear SSH)
* **Arquitectura:** ARMv7 32-bit (Realtek RTD2870 / Rockhopper)
* **Kernel:** Linux 4.4.84
* **Motor Web:** Chromium 53.0.2785.34 (WebAppMgr)
* **Runtime Node.js del Sistema:** Node.js 0.12.2

---

## 3. Estado de la Aplicación Previo a la Instalación

Se consultó la lista de paquetes instalados en el televisor mediante `ares-install --list --device LG-TV`:

* `com.lennylxx.iptv` (versión previa M2)
* `com.retroarch.webos`
* `org.webosbrew.hbchannel`
* `youtube.leanback.v4`

Se comprobó que no existía ninguna instancia activa en primer plano ejecutando `ares-launch --running --device LG-TV`.
No se realizaron modificaciones sobre particiones de solo lectura (`/`, `/boot`, `/tvservice`), ni se ejecutaron comandos `opkg` ni scripts fuera de los procedimientos estándar.

