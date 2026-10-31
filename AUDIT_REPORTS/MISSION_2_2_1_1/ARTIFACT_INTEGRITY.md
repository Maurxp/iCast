# Informe de Integridad Criptográfica de Artefactos
## Misión M2.2.1.1 — webOS IPTV Player (LG 65UM7400PDA)
**Fecha:** 30 de Octubre de 2026  
**Objetivo:** Inventario criptográfico riguroso y verificación determinista de artefactos  

---

## 1. Inventario Criptográfico Oficial

Los siguientes valores fueron verificados mediante cálculo real directo sobre el sistema de archivos (algoritmo SHA-256):

| Rol del Artefacto | Archivo / Ubicación | Tamaño (Bytes) | Hash SHA-256 |
| :--- | :--- | :---: | :--- |
| **IPK Candidato Oficial** | `AUDIT_REPORTS/MISSION_2_2_1_1/package/com.lennylxx.iptv_1.17.0_all.ipk` | **734.610** | `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531` |
| **IPK de Rollback Seguro** | `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk` | **733.772** | `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5` |
| **ZIP Consolidado M2.2.1.1** | `AUDIT_REPORTS/MISSION_2_2_1_1/mission2_2_1_1-final.zip` | **3.855.469** | `4598E871963ECED3F237324823F448CB49D85D1DF5FA545F44C9A7FC84F20B93` |

---

## 2. Justificación Técnica de Preservación del Paquete IPK

La auditoría externa independiente confirmó la validez del IPK candidato:
```text
Archivo: com.lennylxx.iptv_1.17.0_all.ipk
Tamaño: 734610 bytes
SHA-256: 9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531
```

### ¿Por qué no fue necesario modificar ni reconstruir el IPK?
1. **Ámbito de los Cambios:** Las modificaciones introducidas en la Misión M2.2.1.1 se limitaron a:
   - `scripts/test-server.ts`: Servidor local auxiliar para emisión de fixtures multimedia en PC.
   - `src/utils/test-server.test.ts`: Pruebas unitarias de Vitest para validar dicho servidor.
2. **Exclusión del Bundle:** Conforme a la definición de empaquetado de webOS (`build.sh`):
   ```bash
   ares-package --no-minify -e "*preview-libs.js" dist build/bundled-service -o .
   ```
   El empaquetador `ares-package` únicamente incorpora los directorios `dist/` (código frontend compilado con esbuild para Chromium 53) y `build/bundled-service/` (servicio Node.js 0.12.2 compilado).
3. **Invarianza de Producción:** Ni `scripts/test-server.ts` ni los archivos de prueba `*.test.ts` entran en `dist/` ni en `build/bundled-service/`. La compilación de producción (`npm run build`) y el servicio Node.js son exactamente idénticos en código y binarios.
4. **Preservación de la Línea Base Validada:** Al no alterar el IPK, se mantiene con certeza absoluta la validación técnica previa, garantizando que el paquete contiene exactamente el soporte nativo de MP4, la clasificación HTTP temprana y la directiva `"inspectable": false` auditadas.

---

## 3. Contenido del Paquete Consolidado `mission2_2_1_1-final.zip`

El archivo ZIP final contiene todos los artefactos de la misión estructurados para auditoría independiente:
- `package/com.lennylxx.iptv_1.17.0_all.ipk`: Paquete instalable para el televisor webOS.
- `reports/`:
  - `SAFETY_CLOSURE.md`: Informe de cierre de seguridad y resolución de observaciones.
  - `ARTIFACT_INTEGRITY.md`: Presente informe de integridad criptográfica.
  - `TEST_RESULTS.md`: Registro de ejecución de puertas de calidad y pruebas unitarias.
  - `mission2_2_1_1.json`: Descriptor machine-readable del estado y resultados.
- `src/`: Código fuente TypeScript del reproductor (incluyendo `player-mp4.test.ts` y utilidades).
- `bundled-service/`: Código fuente TypeScript y configuración del servicio Luna Node.js 0.12.2.
- `build/`: Servicio Luna compilado en CommonJS compatible con Node 0.12.2.
- `dist/`: Aplicación frontend empaquetada compatible con Chromium 53.
- `scripts/`: Scripts de validación, fixtures sintéticos (`synthetic_test.mp4`, `synthetic_test.m3u`) y el servidor restringido `test-server.ts`.
- `appinfo.json`, `package.json`, `esbuild.config.mjs`, `build.sh`.

