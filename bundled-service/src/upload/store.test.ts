import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  UploadStore,
  secureChmod,
  enforceStorePermissions,
  resolveDataDir,
} from './store';

describe('UploadStore & File Permissions (Frente C)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'store-perm-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('secureChmod', () => {
    it('calls chmodFn with target path and mode', () => {
      const filePath = path.join(tmpDir, 'test.txt');
      fs.writeFileSync(filePath, 'hello');
      const mockChmod = vi.fn();
      secureChmod(filePath, 0o600, mockChmod);
      expect(mockChmod).toHaveBeenCalledWith(filePath, 0o600);
    });

    it('safely catches errors when chmod throws (e.g. EPERM / non-POSIX)', () => {
      const filePath = path.join(tmpDir, 'non-existent.txt');
      const mockChmod = vi.fn(() => {
        throw new Error('EPERM: operation not permitted');
      });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => secureChmod(filePath, 0o600, mockChmod)).not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('enforceStorePermissions', () => {
    it('sets 0o700 on dataDir and 0o600 on all .m3u and .json files', () => {
      const m3uPath = path.join(tmpDir, 'list1.m3u');
      const jsonPath = path.join(tmpDir, 'list1.json');
      const otherPath = path.join(tmpDir, 'other.txt');

      fs.writeFileSync(m3uPath, '#EXTM3U\n#EXTINF:-1,Chan\nhttp://stream');
      fs.writeFileSync(jsonPath, JSON.stringify({ id: 'list1', name: 'list1' }));
      fs.writeFileSync(otherPath, 'text');

      const mockChmod = vi.fn();
      enforceStorePermissions(tmpDir, mockChmod);

      expect(mockChmod).toHaveBeenCalledWith(tmpDir, 0o700);
      expect(mockChmod).toHaveBeenCalledWith(m3uPath, 0o600);
      expect(mockChmod).toHaveBeenCalledWith(jsonPath, 0o600);
      expect(mockChmod).not.toHaveBeenCalledWith(otherPath, 0o600);
    });

    it('handles non-existent directory gracefully without throwing', () => {
      const nonDir = path.join(tmpDir, 'does-not-exist');
      expect(() => enforceStorePermissions(nonDir)).not.toThrow();
    });
  });

  describe('UploadStore constructor and operations', () => {
    it('retroactively enforces permissions on existing files during constructor initialization', () => {
      // Seed pre-existing files before initializing store
      const preM3u = path.join(tmpDir, 'pre.m3u');
      const preJson = path.join(tmpDir, 'pre.json');
      fs.writeFileSync(preM3u, '#EXTM3U\n#EXTINF:-1,Ch\nhttp://s');
      fs.writeFileSync(preJson, '{}');

      const mockChmod = vi.fn();
      const store = new UploadStore(tmpDir, mockChmod);
      expect(store).toBeDefined();

      expect(mockChmod).toHaveBeenCalledWith(tmpDir, 0o700);
      expect(mockChmod).toHaveBeenCalledWith(preM3u, 0o600);
      expect(mockChmod).toHaveBeenCalledWith(preJson, 0o600);
    });

    it('enforces 0o600 permissions upon saving and overwriting an upload', () => {
      const mockChmod = vi.fn();
      const store = new UploadStore(tmpDir, mockChmod);

      const content = '#EXTM3U\n#EXTINF:-1,Chan\nhttp://stream/1';
      const meta = store.save('saved-list.m3u', content);

      const m3uFile = path.join(tmpDir, `${meta.id}.m3u`);
      const jsonFile = path.join(tmpDir, `${meta.id}.json`);

      expect(mockChmod).toHaveBeenCalledWith(m3uFile, 0o600);
      expect(mockChmod).toHaveBeenCalledWith(jsonFile, 0o600);

      // Overwrite test
      mockChmod.mockClear();
      const overwriteContent = '#EXTM3U\n#EXTINF:-1,Chan New\nhttp://stream/2';
      store.save('saved-list.m3u', overwriteContent);

      expect(mockChmod).toHaveBeenCalledWith(m3uFile, 0o600);
      expect(mockChmod).toHaveBeenCalledWith(jsonFile, 0o600);
    });

    it('deletes upload files and handles missing files gracefully', () => {
      const store = new UploadStore(tmpDir);
      store.save('del-test.m3u', '#EXTM3U\n#EXTINF:-1,C\nhttp://s');

      expect(store.delete('del-test')).toBe(true);
      expect(store.delete('del-test')).toBe(false);
    });
  });

  describe('resolveDataDir', () => {
    it('creates directory and enforces 0o700 on resolved path', () => {
      const targetDir = path.join(tmpDir, 'resolved-dir');
      const mockChmod = vi.fn();

      const resolved = resolveDataDir(targetDir, mockChmod);
      expect(resolved).toBe(targetDir);
      expect(fs.existsSync(targetDir)).toBe(true);
      expect(mockChmod).toHaveBeenCalledWith(targetDir, 0o700);
    });
  });
});
