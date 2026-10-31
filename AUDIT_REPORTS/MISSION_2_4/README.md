# MISIÓN M2.4 — INVESTIGACIÓN DE SEGURIDAD CDP Y EVALUACIÓN DE COMPORTAMIENTO DE PLATAFORMA
## Proyecto: webOS IPTV Player (v1.17.0)
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Firmware 05.40.97, SoC Realtek RTD2870, Chromium 53.0.2785.34)  
**Fecha de Emisión:** 2026-10-31  
**Estado:** **COMPLETADA CON ÉXITO — LISTO PARA M3 CON RIESGO DOCUMENTADO**

---

## 1. Propósito y Alcance de la Misión

La **Misión M2.4** se constituyó para realizar una investigación técnica forense y documental sobre el endpoint de depuración **Chrome DevTools Protocol (CDP)** que permanece en escucha en el puerto **TCP 9998** del televisor físico durante la ejecución de la aplicación en entorno de desarrollo.

El objetivo central consistió en determinar si la exposición del puerto 9998:
1. Es una propiedad configurable o modificable desde el manifiesto (`appinfo.json`) o el código de la aplicación.
2. Es una consecuencia directa de la activación de **Developer Mode** en el televisor LG.
3. Es un comportamiento intrínseco de `WebAppMgr` (WAM) y de la versión de Chromium 53 integrada en webOS 4.x.
4. Constituye un riesgo de seguridad aceptable y acotado para continuar con la **Misión M3 (Estabilización Multimedia y Funcionalidad del Reproductor)**.

### Restricciones Operativas Aplicadas
* **Operación 100% Local en PC:** No se realizaron conexiones SSH, Luna, CDP ni peticiones de red hacia el televisor físico.
* **Integridad del Firmware Preservada:** Cero modificaciones a particiones del sistema, scripts de Upstart, `WebAppMgr` o tablas de `iptables`.
* **Código Productivo Intacto:** No se alteró `src/`, `appinfo.json`, `package.json` ni las dependencias del proyecto.

---

## 2. Resumen Ejecutivo del Dictamen Técnico

1. **Inoperancia de `inspectable: false` en webOS 4:** Se confirmó que la directiva `"inspectable": false` en `appinfo.json` es ignorada por el gestor de aplicaciones (`WebAppMgr`) cuando el televisor opera en **Developer Mode**.
2. **Causa Raíz Sistémica:** Al activar Developer Mode, el sistema operativo inyecta globalmente el parámetro `--remote-debugging-port=9998` al proceso `/usr/bin/WebAppMgr`. En Chromium 53, esta bandera instruye a `DevToolsHttpHandler` a abrir un servidor HTTP y WebSocket en `0.0.0.0:9998` exponiendo todas las páginas activas.
3. **Inexistencia de Mitigación Válida a Nivel de Aplicación:** No existe API, manifiesto ni llamada Luna documentada en webOS 4 que permita a una aplicación empaquetada individual suprimir selectivamente el socket CDP sin vulnerar el sistema operativo.
4. **Acotamiento del Riesgo:** El socket 9998 es accesible exclusivamente en el segmento de red de área local (LAN privada RFC 1918). La aplicación no almacena secretos, credenciales ni claves bancarias en el DOM, y las operaciones críticas del servicio Node.js en el bus Luna cuentan con autenticación por token y política *fail-closed*.
5. **Comportamiento en Entorno Comercial (Retail):** En televisores de usuario final (modo retail sin Developer Mode), `WebAppMgr` no recibe el flag de depuración remota y el puerto 9998 permanece cerrado.
6. **Decisión M3:** Se declara **READY FOR M3 WITH DOCUMENTED RISK**.

---

## 3. Índice Estructurado de Entregables

Los documentos técnicos que componen esta auditoría se encuentran organizados en este directorio:

| Archivo | Descripción y Contenido |
| :--- | :--- |
| [`CDP_ARCHITECTURE_ANALYSIS.md`](./CDP_ARCHITECTURE_ANALYSIS.md) | Arquitectura interna de Chromium 53, `DevToolsHttpHandler`, modelo de procesos y socket TCP 9998. |
| [`WEBOS_DEVELOPER_MODE_ANALYSIS.md`](./WEBOS_DEVELOPER_MODE_ANALYSIS.md) | Análisis del ciclo de vida de Developer Mode, Upstart, Novacom y diferencias con el modo Retail. |
| [`INSPECTABLE_BEHAVIOR_ANALYSIS.md`](./INSPECTABLE_BEHAVIOR_ANALYSIS.md) | Evolución histórica de `"inspectable"` en webOS (v1 a v22) y evidencia empírica de su inoperancia en webOS 4. |
| [`HYPOTHESIS_MATRIX.md`](./HYPOTHESIS_MATRIX.md) | Evaluación exhaustiva de las hipótesis H1 a H7 con veredictos, evidencias y niveles de confianza. |
| [`SECURITY_RISK_ASSESSMENT.md`](./SECURITY_RISK_ASSESSMENT.md) | Evaluación cuantitativa y cualitativa de riesgos (CVSS v3.1), vectores de amenaza, aislamiento de secretos y Luna Bus. |
| [`MITIGATION_FEASIBILITY.md`](./MITIGATION_FEASIBILITY.md) | Análisis de factibilidad de opciones de mitigación (aplicación, SO, red, operativas). |
| [`PLATFORM_LIMITATIONS.md`](./PLATFORM_LIMITATIONS.md) | Límites arquitectónicos infranqueables del firmware webOS Lite 4.10.2 / Chromium 53. |
| [`M3_READINESS_DECISION.md`](./M3_READINESS_DECISION.md) | Dictamen formal de pase a Misión M3 y directrices de diseño defensivo. |
| [`MISSION_2_4_SUMMARY.md`](./MISSION_2_4_SUMMARY.md) | Resumen técnico consolidado de la investigación. |
| [`SOURCES.md`](./SOURCES.md) | Bibliografía técnica, repositorios consultados, estándares y evidencias forenses. |
| [`mission2_4.json`](./mission2_4.json) | Resumen estructurado en formato JSON machine-readable. |
| [`CHECKSUMS.sha256`](./CHECKSUMS.sha256) | Hashes criptográficos de integridad de todos los artefactos. |

