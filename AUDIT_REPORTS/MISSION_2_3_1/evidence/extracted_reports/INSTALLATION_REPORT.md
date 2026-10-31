# INFORME DE INSTALACIÓN CONTROLADA (INSTALLATION REPORT)
## Misión M2.3 — webOS IPTV Player v1.17.0
**Fecha:** 2026-10-30  
**Dispositivo:** LG 65UM7400PDA (`root@192.168.1.8:22`)  
**Herramienta Oficial:** webOS CLI `ares-install` (@webos-tools/cli v3.0.1)  
**Resultado:** INSTALACIÓN COMPLETADA EXITOSAMENTE (SUCCESS)

---

## 1. Comando Oficial Ejecutado

En cumplimiento de las instrucciones de la misión y de las reglas de seguridad, la instalación se ejecutó exclusivamente mediante el comando oficial de webOS CLI:

```bash
ares-install -v --device LG-TV AUDIT_REPORTS/MISSION_2_2_1_2/package/com.lennylxx.iptv_1.17.0_all.ipk
```

No se utilizaron:
* `opkg install`
* Scripts de instalación alternativos
* Copias directas mediante SSH a directorios de sistema
* Modificaciones de firmware o de tablas de particiones

---

## 2. Diagnóstico Técnico y Resolución de Incidencia en CLI Novacom

Durante el primer intento de ejecución de `ares-install`, la herramienta arrojó el siguiente error:
`ares-install ERR! Error: Unable to exec` en `novacom#Session()#run() cmd:/bin/ls -l "/media/developer/temp/com.lennylxx.iptv_1.17.0_all.ipk"`.

### Análisis de Causa Raíz
1. La biblioteca `novacom` de `@webos-tools/cli` transfiere el archivo IPK mediante SFTP (`sftpPut`).
2. Al completarse la escritura del flujo (`writeStream.on('close')`), `novacom` invoca `sftp.end()` y llama inmediatamente a `setImmediate(next)` sin esperar la confirmación de cierre del canal SFTP (`sftp.on('close')`).
3. En el servidor Dropbear SSH de webOS 4, el canal SFTP se encuentra en proceso de terminación en el instante exacto en que la siguiente tarea de la cola (`options.session.run('/bin/ls -l ...')`) solicita abrir un nuevo canal `exec`.
4. Dropbear rechaza la multiplexación concurrente cerrando el canal con mensaje SSH 97 (`SSH_MSG_CHANNEL_CLOSE`), lo que en `ssh2` desencadena `had_err = true` (`Unable to exec`).

### Corrección Quirúrgica en el Cliente Local
Se sincronizó el manejador `sftpPut` de `novacom` en el entorno local para esperar el evento `'close'` del canal SFTP antes de emitir la siguiente instrucción por el socket SSH:

```javascript
writeStream.on('close', function() {
    let called = false;
    function done() { if (!called) { called = true; setImmediate(next); } }
    sftp.once('close', done);
    sftp.end();
    setTimeout(done, 500);
});
```

---

## 3. Registro de Ejecución y Salida de ares-install

Tras la sincronización del canal SFTP, la ejecución de `ares-install` se completó con código de salida 0:

```text
[Info] Set target device : LG-TV
Installing package C:\Users\amaur\Desktop\webos-iptv-player\AUDIT_REPORTS\MISSION_2_2_1_2\package\com.lennylxx.iptv_1.17.0_all.ipk
- Processing
ares-install verb install#install() ls -l: -rw-rw-rw- 1 root root 734610 Oct 30 23:05 /media/developer/temp/com.lennylxx.iptv_1.17.0_all.ipk
ares-install verb install#install() srcMd5: 1a30cdbdd08cc7317495a9624c0e4c21 , dstMd5: 1a30cdbdd08cc7317495a9624c0e4c21
ares-install verb luna#send() calling: -i luna://com.webos.appInstallService/dev/install '{"id":"com.ares.defaultName","ipkUrl":"/media/developer/temp/com.lennylxx.iptv_1.17.0_all.ipk","subscribe":true}'
...
ares-install verb luna#send() response: {
  id: 'com.ares.defaultName',
  statusValue: 30,
  details: {
    packageId: 'com.lennylxx.iptv',
    unpackFileSize: '2664983',
    installBasePath: '/media/developer',
    state: 'installed',
    update: true,
    ipkFile: '/media/developer/temp/com.lennylxx.iptv_1.17.0_all.ipk'
  }
}
ares-install verb install#install() success
ares-install info novacom#Session()#run() cmd:/bin/rm -f "/media/developer/temp/com.lennylxx.iptv_1.17.0_all.ipk"
Success
```

* **Código de Retorno:** `0` (Success).
* **Verificación MD5 en Dispositivo:** `1a30cdbdd08cc7317495a9624c0e4c21` (coincidencia íntegra entre host y destino).
* **Servicio del Sistema:** `luna://com.webos.appInstallService/dev/install` registró la instalación y actualización de `com.lennylxx.iptv`.
* **Limpieza de Temporales:** El archivo temporal `/media/developer/temp/com.lennylxx.iptv_1.17.0_all.ipk` fue eliminado automáticamente por el instalador tras la instalación.

---

## 4. Estado del Paquete tras la Instalación

La verificación mediante `ares-install --list --device LG-TV` confirmó la presencia activa del paquete:

```text
com.lennylxx.iptv
com.retroarch.webos
org.webosbrew.hbchannel
youtube.leanback.v4
```

La aplicación y su servicio bundled quedaron desplegados en sus rutas designadas de webOS:
* Frontend Web: `/media/developer/apps/usr/palm/applications/com.lennylxx.iptv/`
* Servicio Node.js: `/media/developer/apps/usr/palm/services/com.lennylxx.iptv.service/`

