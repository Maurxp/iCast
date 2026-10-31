# INVENTARIO Y VERIFICACIÓN DE INTEGRIDAD DE ARTEFACTOS (ARTIFACT INTEGRITY)
## Misión M2.3.1 — webOS IPTV Player v1.17.0
**Fecha:** 2026-10-30 / 2026-10-31  
**Método de Cálculo:** SHA-256 criptográfico directo sobre archivos en disco.

---

## 1. Artefactos Binarios Principales del Ciclo de Vida

| Artefacto / Archivo | Ruta Relativa | Tamaño (Bytes) | Hash SHA-256 Esperado | Hash SHA-256 Calculado en M2.3.1 | Coincidencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IPK Candidato M2.2 (Instalado)** | `AUDIT_REPORTS/MISSION_2_2_1_2/package/com.lennylxx.iptv_1.17.0_all.ipk` | 734.610 | `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531` | `9B4B02B69C7E70A0EE1BEE15B4F27583872C6F5D3D5B33707CD339F4F53FA531` | **EXACTA (100%)** |
| **IPK de Rollback M2** | `AUDIT_REPORTS/MISSION_2/package/com.lennylxx.iptv_1.17.0_all.ipk` | 733.772 | `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5` | `253648B348F1E5B16E073B07786FBE07A1B68B44026ADFF453B163003CEE9CD5` | **EXACTA (100%)** |
| **ZIP Auditoría M2.2.1.2** | `AUDIT_REPORTS/MISSION_2_2_1_2/mission2_2_1_2-final.zip` | 3.856.458 | `244123B0660DDF795AB5A541783C57A20558F0BE3BE9F9F6F32D58D3A6A3BAB9` | `244123B0660DDF795AB5A541783C57A20558F0BE3BE9F9F6F32D58D3A6A3BAB9` | **EXACTA (100%)** |
| **ZIP Auditoría M2.3 Previa** | `AUDIT_REPORTS/MISSION_2_3/MISSION_2_3.zip` | 15.057 | N/A (Generado en M2.3) | `D4B2A2E581BB82A4B49791B0F826106FF5AAC1E0D93E2714F3C55AC47F68DC00` | **VERIFICADO** |

---

## 2. Documentos e Informes Técnicos de M2.3 Preservados

Los siguientes informes técnicos generados durante el despliegue y validación de M2.3 fueron recalculados e inventariados:

| Archivo de Informe | Tamaño (Bytes) | Hash SHA-256 Calculado |
| :--- | :--- | :--- |
| `PRE_DEPLOYMENT_CHECK.md` | 2.619 | `F1D34B88E22974FFED864BCADD88CE174001ED57CFC73343A5164FC2C525830D` |
| `INSTALLATION_REPORT.md` | 4.720 | `099100050132C2D59C0448B1E99C14FEFCE1E1FC3B3281050AF9B7394A1BCB25` |
| `RUNTIME_VALIDATION.md` | 4.200 | `EDA332A8C37D3D53FAEABB49DFCA27BF51707CAA3B729F0E9A8882A7A42785A9` |
| `MEDIA_VALIDATION.md` | 6.689 | `88CC4FF2952D600BBEBA7C42E970B33AE32CC16F96C9F7A9C4219B08E048AE68` |
| `RESOURCE_USAGE.md` | 2.474 | `995666B7A5FA9D59D80051BC2E1624CD1FCE8C5CE0457A80F26770E19029992A` |
| `CDP_RUNTIME_STATUS.md` | 2.871 | `2ADE6278CF81E32A9883E6945B5C1C59E57A1AD5E7C7B9F87707DE13C2285028` |
| `MISSION_2_3_SUMMARY.md` | 5.337 | `35D802BE67E7FAC557AAC3871FA568351BD5ABD88CDB2E72F13FB180790512CE` |
| `mission_2_3_executive_report.md` | 4.263 | `E4D32D5E425291B169EB4EB1EC335CB5F4469B190B8264EA9DA6BD08FF6DCE0B` |

---

## 3. Fixtures y Recursos de Medios de Prueba

| Archivo | Ruta | Tamaño (Bytes) | Hash SHA-256 |
| :--- | :--- | :--- | :--- |
| `synthetic_test.mp4` | `scripts/fixtures/synthetic_test.mp4` | 992.274 | `E1A3059F7CBA340156942C7E5A548545A25DE54D7FD0182E94A2D4971BD5D757` |
| `synthetic_test.m3u` | `scripts/fixtures/synthetic_test.m3u` | 277 | `269A6623BC5417387F3B550DB669CEBE03B8D8F41D0E47F15CDA26456E84210B` |

---

## 4. Conclusiones de Integridad

1. **No se reconstruyó el IPK:** El paquete candidato desplegado en el televisor no sufrió modificaciones de compilación ni empaquetado; conserva exactamente los 734.610 bytes y el SHA-256 verificado en la auditoría M2.2.1.2.
2. **Paquete de Rollback íntegro:** El paquete de rollback de la misión M2 se encuentra disponible y verificado, garantizando capacidad de reversión segura en caso de ser requerida en el futuro.
3. **Ausencia de autorreferencia:** Los hashes de los paquetes y archivos fueron calculados directamente sobre los binarios en almacenamiento antes de la creación del paquete final de evidencias de M2.3.1.

