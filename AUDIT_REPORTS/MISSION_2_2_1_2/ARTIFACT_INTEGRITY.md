# Informe de Integridad Criptográfica de Artefactos
## Misión M2.2.1.2 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Objetivo:** Inventario criptográfico riguroso, trazabilidad determinista y resolución de autorreferencia  

---

## 1. Inventario Criptográfico Oficial

Los siguientes valores fueron verificados mediante cálculo real directo sobre el sistema de archivos (algoritmo SHA-256):

| Rol del Artefacto | Archivo / Ubicación | Tamaño (Bytes) | Hash SHA-256 |
| :--- | :--- | :---: | :--- |
| **IPK Candidato Oficial** | `AUDIT_REPORTS/MISSION_2_2_1_2/package/com.lennylxx.iptv_1.17.0_all.ipk` | **734.610** | `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531` |
| **IPK de Rollback Seguro** | `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk` | **733.772** | `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5` |
| **ZIP Consolidado M2.2.1.2** | `AUDIT_REPORTS/MISSION_2_2_1_2/mission2_2_1_2-final.zip` | *(Calculado al cerrar el archivo)* | *(Calculado al cerrar el archivo)* |

---

## 2. Resolución del Problema de Autorreferencia Criptográfica

Para evitar inconsistencias criptográficas causadas por dependencias circulares:
1. **Contenido Interno del ZIP:** Los documentos incluidos dentro del archivo comprimido (`reports/CHECKSUMS.sha256`, `reports/ARTIFACT_INTEGRITY.md` y `reports/mission2_2_1_2.json`) contienen las firmas inmutables de los paquetes IPK binarios preexistentes (`com.lennylxx.iptv_1.17.0_all.ipk`).
2. **Firma Externa del ZIP:** El archivo ZIP consolidado no incluye su propio hash en su interior. La verificación del archivo ZIP se entrega mediante:
   - El archivo lateral de verificación `AUDIT_REPORTS/MISSION_2_2_1_2/CHECKSUMS.sha256` generado inmediatamente después del empaquetado.
   - El informe ejecutivo final de la misión con los valores calculados de tamaño y SHA-256.

---

## 3. Justificación Técnica de Preservación del Paquete IPK

La auditoría externa independiente confirmó la validez del IPK candidato:
```text
Archivo: com.lennylxx.iptv_1.17.0_all.ipk
Tamaño: 734610 bytes
SHA-256: 9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531
```

### ¿Por qué se conserva bit a bit idéntico?
1. **Alcance Exclusivo:** Los cambios de código en esta misión se limitaron a `scripts/test-server.ts` y su archivo de pruebas `src/utils/test-server.test.ts`.
2. **Aislamiento del Empaquetador:** La herramienta `ares-package` empaqueta únicamente `dist/` (bundle de la aplicación para Chromium 53) y `build/bundled-service/` (servicio Node.js 0.12.2).
3. **Invarianza:** Los scripts de prueba y fixtures no forman parte de los directorios de producción. Reconstruir el IPK generaría un paquete funcionalmente redundante, mientras que conservar el archivo validado garantiza la trazabilidad con los ensayos previos.

---

## 4. Contenido del Paquete Consolidado `mission2_2_1_2-final.zip`

El archivo ZIP contiene la estructura completa del proyecto para auditoría:
- `package/com.lennylxx.iptv_1.17.0_all.ipk`
- `reports/`:
  - `SAFETY_CLOSURE.md`
  - `ARTIFACT_INTEGRITY.md`
  - `TEST_RESULTS.md`
  - `CHECKSUMS.sha256`
  - `mission2_2_1_2.json`
- `src/`: Código fuente TypeScript de la aplicación y pruebas.
- `bundled-service/`: Código fuente TypeScript del servicio Luna.
- `build/`: Servicio Luna compilado en CommonJS para Node 0.12.2.
- `dist/`: Aplicación frontend compilada con esbuild para Chromium 53.
- `scripts/`: Fixtures multimedia (`synthetic_test.mp4`, `synthetic_test.m3u`) y servidor restringido `test-server.ts`.
- `appinfo.json`, `package.json`, `esbuild.config.mjs`, `build.sh`.

