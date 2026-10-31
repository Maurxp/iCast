# LIMITACIONES DE LA PLATAFORMA (PLATFORM LIMITATIONS)
## Misión M2.4 — webOS IPTV Player v1.17.0
**Dispositivo:** LG 65UM7400PDA (webOS TV Lite 4.10.2-29, Firmware 05.40.97)  
**SoC:** Realtek RTD2870 (K5LP) / ARMv7 32-bit Quad-Core  
**Memoria:** 987 MB RAM  

---

## 1. Definición del Límite de Plataforma

En ingeniería de software embebido, una **limitación de plataforma** se define como una propiedad arquitectónica o restricción funcional inherente al sistema operativo, al runtime o al hardware subyacente que:
1. No puede ser alterada mediante interfaces o APIs públicas proporcionadas al desarrollador de aplicaciones.
2. Es gobernada exclusivamente por procesos del sistema operativo con privilegios superiores a los del sandbox de la aplicación.
3. Opera exactamente según las especificaciones de diseño establecidas por el fabricante (LG Electronics), sin constituir un defecto en el código del software de aplicación.

---

## 2. Limitaciones Identificadas en webOS TV Lite 4.10.2

### 2.1 Línea Base del Motor Chromium 53 (Lanzamiento año 2016)
El motor de renderizado embebido en `WebAppMgr` para webOS 4.x corresponde a **Chromium 53.0.2785.34**:
* **Ausencia de Aislamiento de Objetivos CDP:** En esta versión del motor, `content::DevToolsHttpHandler` no disponía de filtros programables por paquete o dominio para ocultar selectivamente `WebContents` individuales una vez que el manejador de depuración remota ha sido instanciado a nivel de proceso.
* **Enlace de Socket no Granular:** El parámetro `--remote-debugging-port` en esta generación de Chromium se vincula a todas las interfaces disponibles (`0.0.0.0`), careciendo de banderas de configuración para restringirlo estrictamente a `127.0.0.1` sin recompilar el código fuente de Chromium.

### 2.2 Arquitectura del Gestor de Aplicaciones (`WebAppMgr`)
En la plataforma webOS 4.10.2:
* **Inyección Global en Scripts del Sistema:** El inicio de `WebAppMgr` está regulado por scripts de Upstart ubicados en particiones protegidas del sistema. La presencia de la sesión de Developer Mode activa la bandera `--remote-debugging-port=9998` de forma indiscriminada para toda la sesión gráfica.
* **Ignorancia del Atributo `inspectable: false`:** Aunque el esquema formal de `appinfo.json` contempla la clave `"inspectable"`, el cargador de aplicaciones de webOS 4 en modo desarrollador no instruye a Chromium a desvincular el agente de depuración de las aplicaciones instaladas en `/media/developer/apps/`. Dicho filtrado sólo fue implementado en revisiones mayores del sistema (webOS 6.0+).

### 2.3 Frontera Rígida del Sandbox de Aplicaciones
La aplicación `com.lennylxx.iptv` opera bajo severas restricciones impuestas por el sistema operativo:
* **Aislamiento de Sistema:** Se ejecuta bajo el usuario sin privilegios `wam` (UID ~6000), con permisos restringidos exclusivamente a su directorio de instalación y almacenamiento local.
* **Inexistencia de Acceso a Capa de Red del Kernel:** La aplicación no tiene acceso a sockets RAW, llamadas al sistema de filtrado de paquetes (`Netfilter`/`iptables`) ni control sobre otros procesos del sistema operativo.
* **Imposibilidad de Modificar Argumentos del Proceso Padre:** Ninguna aplicación web en webOS tiene capacidad para alterar la línea de comandos con la que el demonio del sistema operativo invocó a `/usr/bin/WebAppMgr`.

---

## 3. Delimitación de Responsabilidades: Plataforma vs. Aplicación

| Área / Dimensión | Jurisdicción de la Plataforma (LG webOS) | Jurisdicción de la Aplicación (`webOS IPTV Player`) |
| :--- | :--- | :--- |
| **Apertura del puerto TCP 9998** | **Exclusiva:** Decisión del sistema al activar Developer Mode. | **Nula:** La app no crea ni gobierna el socket. |
| **Exposición en `/json/list`** | **Exclusiva:** Manejada internamente por `WebAppMgr` (Chromium 53). | **Nula:** La app no puede retirarse de la lista nativa. |
| **Protección de Datos Sensibles** | Mecanismos de sandbox general y cifrado Cryptofs en retail. | **Total:** Responsabilidad de no exponer contraseñas ni claves en DOM. |
| **Seguridad del Servicio Node.js** | Aislamiento y control de permisos en el bus Luna (`ls-hubd`). | **Total:** Implementación fail-closed y validación de tokens de sesión. |
| **Cierre del Puerto en Producción** | **Exclusiva:** Al salir de Developer Mode o distribuir vía Content Store. | **Nula:** Gobernado por el ciclo de vida del televisor. |

---

## 4. Conclusión

Intentar forzar el cierre del puerto 9998 desde la aplicación es técnicamente imposible debido a las limitaciones arquitectónicas de webOS 4.10.2 y Chromium 53.
Cualquier intento de mitigación mediante modificación forzada de particiones o scripts de inicio del televisor violaría las directrices de seguridad de hardware y expondría el dispositivo a fallos irreversibles.
Por lo tanto, la exposición del endpoint CDP en Developer Mode se cataloga formalmente como una **Limitación Intrínseca de Plataforma Aceptable y Documentada**.

