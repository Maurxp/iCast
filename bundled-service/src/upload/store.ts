import * as fs from 'fs';
import * as path from 'path';
import { mkdirRecursive, stringEndsWith } from '../compat';

export interface UploadMeta {
  id: string;
  name: string;
  count: number;
  createdAt: number;
}

/**
 * Safely change file or directory permissions with explicit error catching.
 * On POSIX/Linux (webOS TV), this enforces strict 0700 / 0600 modes.
 * On Windows (NTFS), chmod differences are handled gracefully without throwing.
 */
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

/**
 * Enforce strict permissions (0o700) on the storage directory and (0o600) on
 * all contained .m3u and .json metadata files, retroactively fixing any
 * pre-existing files created with lax umask permissions.
 */
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

/**
 * Probe a list of candidate dirs and return the first writable one. The
 * service install dir is read-only and /tmp is wiped on reboot, so prefer
 * persistent storage. Logs each probe so failures are visible in the device
 * log (you can curl /info or check the service stdout to confirm).
 */
export function resolveDataDir(
  envOverride?: string,
  chmodFn?: (p: string, m: number) => void,
): string {
  const candidates: string[] = [
    envOverride,
    '/media/internal/iptv-uploads',
    path.join(__dirname, 'uploads'),
    '/tmp/iptv-uploads',
  ].filter((candidate): candidate is string => !!candidate);

  for (const dir of candidates) {
    try {
      mkdirRecursive(dir);
      secureChmod(dir, 0o700, chmodFn);
      const probe = path.join(dir, '.probe');
      fs.writeFileSync(probe, 'ok');
      fs.unlinkSync(probe);
      console.log('[upload] resolveDataDir: using ' + dir);
      return dir;
    } catch (e) {
      console.log('[upload] resolveDataDir: skipping ' + dir + ' (' +
        (e instanceof Error ? e.message : String(e)) + ')');
    }
  }
  throw new Error('No writable upload directory found');
}

/**
 * Turn an arbitrary filename into a safe alphanumeric slug for use as an ID.
 * Example: "My list (2).m3u" -> "my-list-2".
 */
export function sanitizeUploadId(filename: string): string {
  const base = path.basename(filename).replace(/\.m3u$/i, '');
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'playlist';
}

/**
 * Validate that an ID passed in a URL cannot escape the uploads directory.
 * Must be non-empty, strictly [a-z0-9_-], and cannot equal "." or "..".
 */
export function isValidUploadId(id: string): boolean {
  if (!id || id === '.' || id === '..') return false;
  return /^[a-z0-9_-]+$/i.test(id);
}

/**
 * Count the channels in an M3U body without loading the entire parser (which
 * belongs to the frontend bundle). Simply count lines beginning with #EXTINF.
 */
export function countChannels(m3uContent: string): number {
  const lines = m3uContent.split(/\r?\n/);
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('#EXTINF') === 0) {
      count++;
    }
  }
  return count;
}

/**
 * Storage for uploaded M3U files. Stores each playlist as `<id>.m3u` alongside
 * a `<id>.json` metadata file in `DATA_DIR`.
 */
export class UploadStore {
  readonly dataDir: string;
  private readonly chmodFn?: (p: string, m: number) => void;

  constructor(dataDir: string, chmodFn?: (p: string, m: number) => void) {
    this.dataDir = dataDir;
    this.chmodFn = chmodFn;
    mkdirRecursive(this.dataDir);
    enforceStorePermissions(this.dataDir, chmodFn);
  }

  list(): UploadMeta[] {
    const results: UploadMeta[] = [];
    let files: string[];
    try {
      files = fs.readdirSync(this.dataDir);
    } catch {
      return results;
    }

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!stringEndsWith(f, '.json')) continue;
      try {
        const content = fs.readFileSync(path.join(this.dataDir, f), 'utf-8');
        results.push(JSON.parse(content));
      } catch {
        // Skip corrupted metadata files
      }
    }

    results.sort((a, b) => b.createdAt - a.createdAt);
    return results;
  }

  get(id: string): { meta: UploadMeta; m3uPath: string } | null {
    if (!isValidUploadId(id)) return null;
    const m3uPath = path.join(this.dataDir, id + '.m3u');
    const jsonPath = path.join(this.dataDir, id + '.json');
    if (!fs.existsSync(m3uPath) || !fs.existsSync(jsonPath)) {
      return null;
    }
    try {
      const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as UploadMeta;
      return { meta, m3uPath };
    } catch {
      return null;
    }
  }

  save(originalName: string, m3uContent: string): UploadMeta {
    if (!/#EXTM3U/.test(m3uContent) && !/^#EXTINF:/m.test(m3uContent)) {
      throw new Error('Not a valid M3U playlist (missing #EXTM3U/#EXTINF)');
    }
    const id = sanitizeUploadId(originalName);
    const count = countChannels(m3uContent);
    const meta: UploadMeta = {
      id,
      name: path.basename(originalName).replace(/\.m3u$/i, ''),
      count,
      createdAt: Date.now(),
    };

    const m3uPath = path.join(this.dataDir, id + '.m3u');
    const jsonPath = path.join(this.dataDir, id + '.json');

    // Write file contents
    fs.writeFileSync(m3uPath, m3uContent, { encoding: 'utf-8', mode: 0o600 });
    fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2), { encoding: 'utf-8', mode: 0o600 });

    // Explicitly enforce mode 0o600 (covers overwrites of pre-existing files)
    secureChmod(m3uPath, 0o600, this.chmodFn);
    secureChmod(jsonPath, 0o600, this.chmodFn);

    console.log('[upload] wrote ' + m3uPath + ' (' + Buffer.byteLength(m3uContent) + ' bytes)');
    console.log('[upload] wrote ' + jsonPath);

    return meta;
  }

  delete(id: string): boolean {
    if (!isValidUploadId(id)) return false;
    const m3uPath = path.join(this.dataDir, id + '.m3u');
    const jsonPath = path.join(this.dataDir, id + '.json');

    let deleted = false;
    if (fs.existsSync(m3uPath)) {
      try {
        fs.unlinkSync(m3uPath);
        console.log('[upload] removed ' + m3uPath);
        deleted = true;
      } catch (e) {
        console.warn('[upload] failed to remove ' + m3uPath + ': ' + (e instanceof Error ? e.message : String(e)));
      }
    }
    if (fs.existsSync(jsonPath)) {
      try {
        fs.unlinkSync(jsonPath);
        console.log('[upload] removed ' + jsonPath);
        deleted = true;
      } catch (e) {
        console.warn('[upload] failed to remove ' + jsonPath + ': ' + (e instanceof Error ? e.message : String(e)));
      }
    }
    return deleted;
  }

  read(id: string): string {
    const m3uPath = path.join(this.dataDir, id + '.m3u');
    return fs.readFileSync(m3uPath, 'utf-8');
  }
}
