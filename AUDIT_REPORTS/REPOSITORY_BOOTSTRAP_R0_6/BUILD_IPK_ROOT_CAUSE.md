# Diagnóstico de Causa Raíz y Solución de Fallos en Build IPK (E2E Tests)

**Proyecto:** iCast  
**Fecha:** 2026-10-31  
**Ejecución analizada:** GitHub Actions Run ID `41253192543` (Workflow `Build IPK`)  
**Suite afectada:** Playwright E2E Tests (`npm run test:e2e`)

---

## 1. Resumen Ejecutivo del Problema

En las ejecuciones de GitHub Actions del workflow `Build IPK`, el paso *E2E tests* falló con 6 tests en error y 1 test intermitente (*flaky*):
- 2 fallos en `e2e/settings.spec.ts` (en `chromium` y `chromium-53-simulation`)
- 2 fallos en `e2e/tab-bar.spec.ts` línea 754 (en `chromium` y `chromium-53-simulation`)
- 2 fallos en `e2e/tab-bar.spec.ts` línea 798 (en `chromium` y `chromium-53-simulation`)
- 1 fallo intermitente en `e2e/epg.spec.ts` línea 16 (en `chromium-53-simulation`)

---

## 2. Análisis Detallado de Causa Raíz

### Problema A: Selector de temas de 15 a 17 temas (`e2e/settings.spec.ts`)
- **Síntoma:**
  ```text
  Error: expect(received).toEqual(expected)
  - Expected: [5, 5, 5]
  + Received: [5, 5, 5, 2]
  ```
- **Causa Raíz:**
  En la Misión M3.1 se incorporaron los temas oficiales de la marca iCast: `obsidian` (tema oscuro por defecto) y `porcelain` (tema claro). La constante `THEMES` en `src/config/themes.ts` pasó de 15 a 17 elementos.
  El grid CSS de apariencia cuenta con 5 columnas (`repeat(5, 1fr)`). Al renderizar 17 temas, la distribución real de filas calculada por `getBoundingClientRect().top` es 4 filas: 5 en la primera, 5 en la segunda, 5 en la tercera y 2 en la cuarta (`[5, 5, 5, 2]`). El test upstream verificaba rígidamente `[5, 5, 5]`.
- **Solución Aplicada:**
  Se actualizó la expectativa funcional del test a 17 temas en 4 filas:
  ```typescript
  test('lays out the 17 theme swatches across four rows', async ({ page }) => {
    ...
    expect(rowCounts).toEqual([5, 5, 5, 2]);
  });
  ```

---

### Problema B: Desaparición de programas EPG cerca de la medianoche UTC (`e2e/tab-bar.spec.ts`)
- **Síntoma:**
  ```text
  Error: expect(locator).toBeVisible() failed
  Locator: locator('#epg-programmes [data-prog-idx="1"]')
  Expected: visible, Received: element(s) not found, Timeout 5000ms
  ```
- **Causa Raíz:**
  Los tests en líneas 754 y 798 generaban fechas dinámicas relativas al reloj del sistema mediante `const now = Date.now();`:
  - Show 1: `start="${stamp(now - hour)}" stop="${stamp(now + hour)}"`
  - Show 2: `start="${stamp(now + hour)}" stop="${stamp(now + 2 * hour)}"`
  - Show 3: `start="${stamp(now + 2 * hour)}" stop="${stamp(now + 3 * hour)}"`
  
  Cuando la CI de GitHub ejecutó el workflow a las **23:47 UTC** (`2026-10-31T23:47:05Z`), `now` era las 23:47. Por tanto:
  - `now + hour` era las **00:47 UTC del día siguiente** (2026-11-01).
  - El componente `EpgGrid` (`src/components/epg-grid.ts`) agrupa y filtra los programas mostrados según el día de inicio (`getProgrammesStartingInRange(epgId, from, dayEnd)`).
  - Show 1 comenzaba el 2026-10-31 (hoy), por lo que aparecía como `[data-prog-idx="0"]`.
  - Show 2 y Show 3 comenzaban el 2026-11-01 (mañana), por lo que pertenecían al bucket del día siguiente y no se renderizaban en la vista del día actual.
  - Como resultado, la lista de programas del día actual contenía **únicamente 1 programa**. El elemento `[data-prog-idx="1"]` **no existía en el DOM**, provocando el timeout de 5 segundos.
- **Solución Aplicada:**
  Se fijó el reloj de la página en Playwright a las 12:00:00Z (mediodía) mediante `page.clock.setFixedTime(now)`, garantizando que `now - hour`, `now + hour` y `now + 2 * hour` queden siempre centrados en el mismo día del calendario:
  ```typescript
  const now = new Date('2024-03-09T12:00:00Z').getTime();
  await page.clock.setFixedTime(now);
  ```

---

### Problema C: Condición de carrera en escritura asíncrona de IndexedDB (`e2e/epg.spec.ts`)
- **Síntoma:**
  ```text
  Error: page.evaluate: Error: EPG cache entry was not stored
  ```
- **Causa Raíz:**
  En `EpgService` (`src/services/epg-service.ts`), al completarse la descarga y parseo de la guía EPG:
  1. Primero se llama a `this.publish(...)`, lo que notifica a la interfaz y renderiza el texto `"Cached Show"` en `.channel-now`.
  2. Luego se inicia de forma asíncrona la transacción de guardado en IndexedDB: `setCachedEpg(...)`.
  
  El test verificaba `await expect(nowPlaying).toHaveText('Cached Show');` y, acto seguido, ejecutaba inmediatamente una única lectura directa en IndexedDB (`store.get(url)`). En entornos con I/O más lento (como los runners compartidos de GitHub Actions), la transacción de IndexedDB aún no había finalizado su commit en disco, arrojando `undefined` y lanzando `reject(new Error('EPG cache entry was not stored'))`.
- **Solución Aplicada:**
  Siguiendo el patrón de resiliencia ya establecido en `e2e/startup.spec.ts`, se envolvió la lectura en un sondeo reactivo con `expect.poll`:
  ```typescript
  await expect.poll(() => page.evaluate(({ url, timestamp }) => new Promise<boolean>((resolve, reject) => {
    ...
    read.onsuccess = () => {
      if (!read.result) {
        resolve(false);
        return;
      }
      store.put({ ...read.result, timestamp });
    };
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
  }), { url: epgUrl, timestamp: ... })).toBe(true);
  ```
  Esto permite esperar de forma segura y sin sleep arbitrario a que la transacción asíncrona de IndexedDB se consolide.


---

### Problema D: Autenticación de Tokens en Script de Smoke de Servicio (`scripts/service-runtime-smoke.js`)
- **Síntoma:**
  ```text
  Error: /info returned HTTP 403: {"error":"Unauthorized: appToken required"}
      at expectStatus (/home/runner/work/iCast/iCast/scripts/service-runtime-smoke.js:68:11)
      at /home/runner/work/iCast/iCast/scripts/service-runtime-smoke.js:134:16
  ```
- **Causa Raíz:**
  En la Misión 1C / M2 se reforzó la seguridad de `bundled-service` (`bundled-service/src/lan/server.ts`), exigiendo tokens de autorización estrictos para endpoints internos:
  - `/info` requiere `appToken` (frontera Luna IPC / app local).
  - `PUT /setup-state` requiere `appToken`.
  - `GET /setup-actions` y `DELETE /setup-actions/:id` requieren `appToken`.
  - `GET /uploads` y `GET /uploads/:id.m3u` requieren `token` (`setupToken` o `appToken`).
  
  Sin embargo, el script de prueba de compatibilidad de runtime Node 0.12.2 (`scripts/service-runtime-smoke.js`) invocaba estas rutas sin adjuntar `bound.appToken` ni `token` en la query string (`?token=`), provocando que el servidor Node 0.12.2 devolviera `HTTP 403 Forbidden`.
- **Solución Aplicada:**
  Se actualizaron las llamadas HTTP en `scripts/service-runtime-smoke.js` para suministrar `bound.appToken` en endpoints internos y `token` en endpoints de setup y descargas de M3U, manteniendo compatibilidad estricta con ES5/Node 0.12.2.
