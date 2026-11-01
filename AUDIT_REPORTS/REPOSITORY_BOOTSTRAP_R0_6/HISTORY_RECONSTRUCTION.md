# Historial Independiente de iCast: Reconstrucción y Separación de Upstream

**Proyecto:** iCast  
**Repositorio local:** `C:\Users\amaur\Desktop\webos-iptv-player`  
**Repositorio remoto:** `https://github.com/Maurxp/iCast.git`  
**Rama principal:** `main`  
**Fecha de reconstrucción:** 2026-10-31  
**Autor y Committer:** `Mauricio Perdomo <u20241219818@usco.edu.co>`

---

## 1. Justificación y Propósito

El repositorio original fue clonado de `https://github.com/lennylxx/webos-iptv-player.git`. En su historial se incluían más de 450 commits de Lenny. Para establecer la gobernanza soberana e independiente de iCast, el propietario autorizó expresamente separar el historial de desarrollo de la rama principal (`main`), haciendo que comience formalmente con un commit raíz (orphan root commit) atribuido exclusivamente a Mauricio Perdomo, conservando el 100% del árbol de trabajo, archivos y estado del software.

---

## 2. Metodología de Creación del Commit Huérfano (Zero Parents)

Se utilizó la funcionalidad nativa de bajo nivel de Git (`git commit-tree`) para crear un commit sin ancestros (`zero parents`), reutilizando exactamente el mismo hash de árbol (`tree SHA`) del commit anterior:

1. **Identificación del Tree SHA anterior:**
   - Commit anterior: `1dc8bc38e3bac7c0c26f196ae7eee663ed7b4ef4`
   - Tree SHA extraído: `1d43003f9b1146ec47a65b43900cbbba880012f0`

2. **Creación del Commit Raíz Huérfano:**
   - Comando ejecutado:
     ```bash
     git commit-tree 1d43003f9b1146ec47a65b43900cbbba880012f0 -m "chore: establish independent iCast project history"
     ```
   - Nuevo Commit SHA generado: `bce8da2a1757f152c0c1360cbc074dc67fdb2f71`
   - Padres del nuevo commit: **0** (`git cat-file -p bce8da2` no contiene línea `parent`).

3. **Actualización de la Rama Local `main`:**
   - Se actualizó el puntero de `main`:
     ```bash
     git reset --hard bce8da2a1757f152c0c1360cbc074dc67fdb2f71
     ```

---

## 3. Verificación de Equivalencia de Árbol (Byte-for-Byte Parity)

Se realizó una comparación criptográfica de árbol de trabajo antes y después de la reconstrucción:
```bash
git diff-tree -r 1dc8bc38e3bac7c0c26f196ae7eee663ed7b4ef4 bce8da2a1757f152c0c1360cbc074dc67fdb2f71
```
**Resultado:** Salida vacía (0 diferencias).
El contenido completo del proyecto, archivos de configuración, código fuente y recursos estáticos son idénticos byte por byte.

---

## 4. Publicación en Remoto `origin/main` con Protecciones de Seguridad

Para actualizar el remoto de GitHub sin riesgo de sobreescrituras ciegas, se empleó `--force-with-lease` requiriendo que la referencia remota apuntara exactamente al SHA conocido previo:
```bash
git push --force-with-lease=refs/heads/main:1dc8bc38e3bac7c0c26f196ae7eee663ed7b4ef4 origin main:main
```
**Resultado:** Actualización forzada con validación de lease completada exitosamente (`forced update`).

---

## 5. Inspección de Autoría en GitHub

Al no tener ancestros heredados en `main`:
- GitHub atribuye el 100% de los commits de `main` a **Mauricio Perdomo**.
- En la interfaz web de GitHub y en el grafo de colaboradores (`/graphs/contributors`), el autor principal es Mauricio Perdomo.
- Se mantiene el remoto de solo lectura `upstream` (`https://github.com/lennylxx/webos-iptv-player.git`) como referencia de procedencia legal y técnica.
