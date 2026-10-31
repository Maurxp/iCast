# MISIÓN 1A — AUDITORÍA DEL MANIFIESTO WEBOS (WEBOS_MANIFEST_AUDIT.md)

**Proyecto:** `lennylxx/webos-iptv-player` (v1.17.0)  
**Dispositivo Objetivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2 / API 4.1.0)  
**Archivo Auditado:** `appinfo.json` y recursos localizados en `resources/*/appinfo.json`  
**Fecha:** 2026-10-29  

---

## 1. Contenido Oficial del Manifiesto Principal (`appinfo.json`)

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

---

## 2. Inspección Campo por Campo y Validación de Compatibilidad

| Propiedad | Valor Configurado | Validación Técnica (webOS 4.1.0) | Justificación e Impacto |
| :--- | :--- | :---: | :--- |
| `id` | `com.lennylxx.iptv` | **VÁLIDO** | Formato de dominio inverso requerido por el sistema de empaquetado de webOS y el gestor de aplicaciones `WebAppMgr`. Coincide con el espacio de nombres del servicio secundario (`com.lennylxx.iptv.service`). |
| `version` | `1.17.0` | **VÁLIDO** | Sincronizado automáticamente desde `package.json` mediante `esbuild.config.mjs` y `scripts/sync-version.mjs`. |
| `vendor` | `lennylxx` | **VÁLIDO** | Identificador de desarrollador obligatorio en el esquema de manifiesto. |
| `type` | `web` | **VÁLIDO** | Instruye a `WebAppMgr` para inicializar el motor Chromium (Blink) y alojar la aplicación como Web App en lugar de binario QML o nativo. |
| `main` | `index.html` | **VÁLIDO** | Documento principal de arranque. Ruta verificada y existente en la raíz del paquete. |
| `title` | `webOS IPTV Player` | **VÁLIDO** | Título predeterminado para el lanzador (Launcher) en inglés. |
| `appDescription` | *(Texto descriptivo)* | **VÁLIDO** | Descripción resumida expuesta en el administrador de aplicaciones de webOS. |
| `icon` | `icon.png` | **VÁLIDO** | Ícono de 80×80 píxeles. Validado: archivo PNG sin canal alfa anómalo que degrade el compositor. |
| `largeIcon` | `largeIcon.png` | **VÁLIDO** | Ícono de 130×130 píxeles utilizado por la barra de inicio rápido de webOS (Quick Launch Bar). |
| `iconColor` | `#241e52` | **VÁLIDO** | Color de fondo del mosaico en el lanzador mientras se carga el arte gráfico. |
| `resolution` | `1920x1080` | **ÓPTIMO** | **Configuración Crítica de Rendimiento.** Establece el lienzo lógico en Full HD (1080p). El hardware del televisor (panel 4K UHD 3840×2160) realiza el escalado por hardware en el compositor gráfico. Renderizar la UI directamente en 4K saturaría el ancho de banda de memoria de la GPU Mali/Bifrost del SoC RTD2870. |
| `disableBackHistoryAPI` | `true` | **CRÍTICO** | Deshabilita el comportamiento por defecto del navegador de retroceder en el historial web. Permite que la tecla **Back** del Magic Remote (código `461`) sea capturada exclusivamente por `src/navigation/key-handler.ts` para gestionar la pila de vistas interna (`viewStack`). |
| `transparent` | `false` | **ÓPTIMO** | Deshabilita la transparencia de ventana a nivel de compositor. Evita el costo de blending alfa en la GPU durante la navegación de menús. |

---

## 3. Análisis de Permisos y Acceso al Bus Luna (ACG)

### 3.1. Evaluación del Warning en el Empaquetado
Durante la ejecución de `ares-package`, el compilador emitió la siguiente advertencia:
> `[Warning] The 'requiredACG' field is not defined in appinfo.json. ACG (Access Control Group) controls an app's permission to call Luna Bus APIs on webOS...`

### 3.2. ¿Qué es ACG y Cómo Aplica a Nuestro Dispositivo?
1. **Contexto de Seguridad en webOS 4+:** LG introdujo el mecanismo *Access Control Group* (ACG) para restringir qué APIs del bus del sistema (`luna://`) puede invocar una aplicación web externa.
2. **APIs Luna que invoca la Aplicación:**
   * `luna://com.webos.service.tv.systemproperty/getSystemInfo`: Lectura de modelo y versión de SDK (API pública accesible por defecto).
   * `luna://com.lennylxx.iptv.service/*`: Comunicación bidireccional privada con su propio servicio empaquetado (permitida automáticamente al compartir el mismo prefijo de paquete `com.lennylxx.iptv`).
   * Servicios de Notificaciones y Activity Manager: Son invocados internamente por el servicio Node (`bundled-service/`), no directamente por la app web.
3. **Instalación vía Homebrew / Sideload:** En televisores con acceso root o Homebrew Channel (como nuestro 65UM7400PDA), las aplicaciones sin declaración explícita de `requiredACG` se instalan con el dominio de permisos estándar de desarrollo/sideload, que autoriza la comunicación IPC local requerida.
4. **Veredicto:** **No se debe modificar `appinfo.json` para agregar campos ACG.** Modificarlo manualmente violaría la regla del proyecto que establece que `appinfo.json` se gestiona a través de `package.json`, y no aporta ningún beneficio funcional en instalaciones de Homebrew/desarrollo.

---

## 4. Auditoría de Recursos Localizados (`resources/*/appinfo.json`)

El proyecto incluye 10 paquetes de localización en `dist/resources/`:
* Alemán (`de`)
* Español (`es`)
* Francés (`fr`)
* Italiano (`it`)
* Polaco (`pl`)
* Portugués de Brasil (`pt-BR`)
* Ruso (`ru`)
* Turco (`tr`)
* Ucraniano (`uk`)
* Chino Simplificado (`zh-Hans-CN`)

### Verificación Específica para el TV Objetivo (Español):
En `dist/resources/es/appinfo.json`:
```json
{
  "title": "webOS IPTV Player",
  "appDescription": "Reproductor IPTV compatible con M3U, Xtream, XMLTV y reproducción diferida."
}
```
* Dado que el televisor LG 65UM7400PDA está configurado en región hispanohablante, `WebAppMgr` resolverá automáticamente estos metadatos en español en el menú principal sin intervención del usuario.

---

## 5. Conclusión de la Auditoría del Manifiesto

El archivo `appinfo.json` cumple rigurosamente con los estándares de la API webOS 4.1.0. No presenta permisos excesivos, no contiene propiedades obsoletas, define la resolución adecuada para preservar recursos de GPU y está debidamente preparado para la instalación en el dispositivo objetivo.

