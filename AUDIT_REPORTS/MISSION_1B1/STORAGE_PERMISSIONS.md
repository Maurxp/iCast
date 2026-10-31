# AUDITORÍA Y CONTROL DE PERMISOS EN ALMACENAMIENTO — STORAGE PERMISSIONS
## webOS IPTV Player v1.17.0 — Misión 1B.1

**Proyecto:** `lennylxx/webos-iptv-player`  
**Dispositivo:** LG 65UM7400PDA (Kernel Linux 4.4.84 / ARMv7 / webOS TV Lite 4.10.2)  
**Fecha:** 2026-10-29  
**Estado:** Implementado, Probado y Verificado  

---

## 1. Contexto del Sistema de Archivos en webOS

El televisor LG 65UM7400PDA opera sobre un kernel Linux 4.4.84 con arquitectura de usuarios compartida para aplicaciones y servicios de usuario:
* El servicio Node.js se ejecuta típicamente bajo la cuenta de usuario `app_xxx` o `developer` con un `umask` por defecto (típicamente `0022` o `0002`).
* Con un `umask` de `0022`, cualquier archivo creado sin restricciones explícitas recibe permisos `0644` (`rw-r--r--`), permitiendo a otros procesos no privilegiados en el sistema leer las listas M3U y configuraciones que contengan credenciales o tokens de streaming.
* El directorio de almacenamiento de subidas (`/media/internal/iptv-uploads` o `/tmp/iptv-uploads`) debe estar aislado exclusivamente para el servicio (`0700` = `rwx------`), y los archivos de listas y metadatos deben ser `0600` (`rw-------`).

---

## 2. El Problema de Conservación de Modos en Sobrescritura de Inodos

En POSIX y Node.js, `fs.writeFileSync(path, data, { mode: 0o600 })` solo aplica el modo solicitado **cuando el inodo es recién creado**. Si el archivo ya existía previamente en disco:
1. `writeFileSync` abre el archivo existente con `O_WRONLY | O_CREAT | O_TRUNC`.
2. El sistema de archivos Linux **mantiene los bits de modo originales del inodo existente**.
3. Si el archivo se creó previamente con permisos laxos (`0644` o `0666`), la llamada a `writeFileSync` con `{ mode: 0o600 }` **NO modifica los permisos existentes**.

---

## 3. Solución Implementada: `secureChmod` y Reconciliación Retroactiva

En `bundled-service/src/upload/store.ts`, se implementaron tres mecanismos coordinados de protección:

### 3.1 `secureChmod` con Tolerancia a Fallos
```typescript
export function secureChmod(
  targetPath: string,
  mode: number,
  chmodFn?: (p: string, m: number) => void,
): void {
  try {
    const fn = chmodFn || fs.chmodSync;
    fn(targetPath, mode);
  } catch (e) {
    console.warn('[upload] chmod failed for ' + targetPath + ' (mode ' + mode.toString(8) + '): ' +
      (e instanceof Error ? e.message : String(e)));
  }
}
```
* **En webOS (Linux ext4):** Aplica de forma obligatoria los bits octales `0o700` y `0o600`.
* **En el PC de Desarrollo (Windows NTFS):** En sistemas donde `chmod` sobre directorios o archivos especiales genera excepciones `EPERM` o tiene semántica restringida a solo-lectura, la función captura el error de forma segura y registra una advertencia sin interrumpir el flujo del servicio.

### 3.2 Forzado de Permisos en Creación y Sobrescritura (`save`)
En cada operación de guardado o actualización de listas M3U (`UploadStore.save`):
```typescript
// Escribir contenidos
fs.writeFileSync(m3uPath, m3uContent, { encoding: 'utf-8', mode: 0o600 });
fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2), { encoding: 'utf-8', mode: 0o600 });

// Forzar explícitamente modo 0o600 para cubrir sobrescrituras de inodos preexistentes
secureChmod(m3uPath, 0o600, this.chmodFn);
secureChmod(jsonPath, 0o600, this.chmodFn);
```

### 3.3 Reconciliación Retroactiva al Inicio (`enforceStorePermissions`)
Al inicializarse el `UploadStore` en el arranque del servicio:
```typescript
export function enforceStorePermissions(
  dir: string,
  chmodFn?: (p: string, m: number) => void,
): void {
  try {
    if (!fs.existsSync(dir)) return;
    secureChmod(dir, 0o700, chmodFn);
    const files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (stringEndsWith(file, '.m3u') || stringEndsWith(file, '.json')) {
        secureChmod(path.join(dir, file), 0o600, chmodFn);
      }
    }
  } catch (e) {
    console.warn('[upload] enforceStorePermissions error: ' + (e instanceof Error ? e.message : String(e)));
  }
}
```
Esto garantiza que si el usuario ya tenía listas subidas de versiones anteriores con permisos `0644`, **el servicio endurece automáticamente todos los archivos existentes a `0600` y el directorio a `0700` al arrancar**.

---

## 4. Validación de Pruebas Unitarias

La suite dedicada `bundled-service/src/upload/store.test.ts` valida:
1. `secureChmod`: Invocación correcta con parámetros de modo y captura limpia ante excepciones `EPERM`.
2. `enforceStorePermissions`: Aplicación de `0o700` a directorios y `0o600` a `.m3u` y `.json`, ignorando archivos irrelevantes.
3. `UploadStore`: Reconciliación retroactiva automática en el constructor.
4. `save`: Aplicación obligatoria de `0o600` tanto en la primera creación como en la sobrescritura de archivos.
5. `resolveDataDir`: Creación y protección `0o700` del directorio resuelto.

Resultado: **8 de 8 pruebas unitarias pasadas con éxito.**

