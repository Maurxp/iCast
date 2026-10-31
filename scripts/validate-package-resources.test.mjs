import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as zlib from 'zlib';
import {
  validatePackageResources,
  parseIpkArchive,
  validateIpkPackage,
} from './validate-package-resources.mjs';

function createMockTar(entries) {
  const buffers = [];

  for (const entry of entries) {
    const data = typeof entry.content === 'string'
      ? Buffer.from(entry.content, 'utf8')
      : entry.content;
    const header = Buffer.alloc(512);

    // Filename (0..100)
    header.write(entry.name, 0, 100, 'utf8');
    // Mode (100..108)
    header.write('0000644\0', 100, 8, 'ascii');
    // UID (108..116)
    header.write('0000000\0', 108, 8, 'ascii');
    // GID (116..124)
    header.write('0000000\0', 116, 8, 'ascii');
    // Size (124..136)
    header.write(data.length.toString(8).padStart(11, '0') + '\0', 124, 12, 'ascii');
    // Mtime (136..148)
    header.write('00000000000\0', 136, 12, 'ascii');
    // Typeflag (156)
    header[156] = 48; // '0' = regular file
    // Magic (257..263)
    header.write('ustar\0', 257, 6, 'ascii');
    // Version (263..265)
    header.write('00', 263, 2, 'ascii');

    // Checksum calculation (treat 148..156 as 8 spaces)
    header.fill(32, 148, 156);
    let checksum = 0;
    for (let i = 0; i < 512; i++) checksum += header[i];
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');

    buffers.push(header);
    buffers.push(data);

    const remainder = data.length % 512;
    if (remainder > 0) {
      buffers.push(Buffer.alloc(512 - remainder));
    }
  }

  // Tar end of archive: two 512-byte blocks of zeros
  buffers.push(Buffer.alloc(1024));
  return Buffer.concat(buffers);
}

function createMockIpk(files) {
  const dataTarGz = zlib.gzipSync(createMockTar(files));
  const controlTarGz = zlib.gzipSync(createMockTar([{ name: 'control', content: 'Package: test' }]));
  const debianBinary = Buffer.from('2.0\n', 'ascii');

  const arBuffers = [Buffer.from('!<arch>\n', 'ascii')];

  function addArEntry(name, data) {
    const header = Buffer.alloc(60, 32); // fill with spaces
    header.write(name + '/', 0, 16, 'ascii');
    header.write('0', 16, 12, 'ascii'); // timestamp
    header.write('0', 28, 6, 'ascii');  // uid
    header.write('0', 34, 6, 'ascii');  // gid
    header.write('100644', 40, 8, 'ascii'); // mode
    header.write(data.length.toString(10), 48, 10, 'ascii'); // size
    header[58] = 0x60;
    header[59] = 0x0a;

    arBuffers.push(header);
    arBuffers.push(data);
    if (data.length % 2 !== 0) {
      arBuffers.push(Buffer.from('\n', 'ascii'));
    }
  }

  addArEntry('debian-binary', debianBinary);
  addArEntry('control.tar.gz', controlTarGz);
  addArEntry('data.tar.gz', dataTarGz);

  return Buffer.concat(arBuffers);
}

describe('validatePackageResources', () => {
  let tempDir;
  let distDir;
  let serviceDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg-val-test-'));
    distDir = path.join(tempDir, 'dist');
    serviceDir = path.join(tempDir, 'service');
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(path.join(serviceDir, 'setup'), { recursive: true });

    // Populate minimal valid dist
    fs.writeFileSync(path.join(distDir, 'appinfo.json'), JSON.stringify({
      id: 'com.lennylxx.iptv',
      version: '1.17.0',
      main: 'index.html',
      icon: 'icon.png',
      largeIcon: 'largeIcon.png',
    }));
    fs.writeFileSync(path.join(distDir, 'icon.png'), 'fake-icon');
    fs.writeFileSync(path.join(distDir, 'largeIcon.png'), 'fake-large-icon');
    fs.writeFileSync(path.join(distDir, 'bundle.js'), 'console.log("app");');
    fs.writeFileSync(path.join(distDir, 'bundle.css'), 'body { margin: 0; }');
    fs.writeFileSync(path.join(distDir, 'index.html'), `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="bundle.css">
        <link rel="icon" href="icon.png">
      </head>
      <body>
        <script src="bundle.js"></script>
      </body>
      </html>
    `);

    // Populate minimal valid service
    fs.writeFileSync(path.join(serviceDir, 'package.json'), JSON.stringify({
      name: 'service',
      main: 'index.js',
    }));
    fs.writeFileSync(path.join(serviceDir, 'services.json'), JSON.stringify({
      id: 'com.lennylxx.iptv.service',
    }));
    fs.writeFileSync(path.join(serviceDir, 'index.js'), 'console.log("service");');
    fs.writeFileSync(path.join(serviceDir, 'setup', 'setup-page.html'), '<html></html>');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('passes validation when all resources exist and are valid', () => {
    const result = validatePackageResources(distDir, serviceDir);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.checkedFiles.length).toBeGreaterThan(5);
  });

  it('fails validation when index.html references preview-libs.js', () => {
    fs.writeFileSync(path.join(distDir, 'index.html'), `
      <!DOCTYPE html>
      <html>
      <head><link rel="stylesheet" href="bundle.css"></head>
      <body>
        <script src="bundle.js"></script>
        <script src="js/preview-libs.js"></script>
      </body>
      </html>
    `);
    const result = validatePackageResources(distDir, serviceDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('preview-libs.js'))).toBe(true);
  });

  it('fails validation when index.html references a missing script', () => {
    fs.writeFileSync(path.join(distDir, 'index.html'), `
      <!DOCTYPE html>
      <html>
      <body>
        <script src="missing-script.js"></script>
      </body>
      </html>
    `);
    const result = validatePackageResources(distDir, serviceDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing-script.js'))).toBe(true);
  });

  it('fails validation when index.html references a missing stylesheet', () => {
    fs.writeFileSync(path.join(distDir, 'index.html'), `
      <!DOCTYPE html>
      <html>
      <head><link rel="stylesheet" href="missing-style.css"></head>
      <body></body>
      </html>
    `);
    const result = validatePackageResources(distDir, serviceDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing-style.css'))).toBe(true);
  });

  it('fails validation when appinfo icon is missing', () => {
    fs.unlinkSync(path.join(distDir, 'icon.png'));
    const result = validatePackageResources(distDir, serviceDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('icon.png'))).toBe(true);
  });

  it('fails validation when service setup-page.html is missing', () => {
    fs.unlinkSync(path.join(serviceDir, 'setup', 'setup-page.html'));
    const result = validatePackageResources(distDir, serviceDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('setup-page.html'))).toBe(true);
  });
});

describe('parseIpkArchive', () => {
  it('throws error when buffer lacks ar magic bytes', () => {
    const invalidBuf = Buffer.from('NOT-AN-AR-ARCHIVE');
    expect(() => parseIpkArchive(invalidBuf)).toThrow(/!<arch>/);
  });

  it('successfully extracts ar entries and parses data.tar.gz', () => {
    const ipk = createMockIpk([
      { name: 'appinfo.json', content: '{"id":"com.lennylxx.iptv"}' },
      { name: 'index.html', content: '<html></html>' },
    ]);
    const parsed = parseIpkArchive(ipk);
    expect(parsed.arEntries['debian-binary']).toBeDefined();
    expect(parsed.arEntries['control.tar.gz']).toBeDefined();
    expect(parsed.arEntries['data.tar.gz']).toBeDefined();
    expect(parsed.files.some((f) => f.name === 'appinfo.json')).toBe(true);
    expect(parsed.files.some((f) => f.name === 'index.html')).toBe(true);
  });
});

describe('validateIpkPackage', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ipk-val-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns invalid when IPK file does not exist', () => {
    const result = validateIpkPackage(path.join(tmpDir, 'nonexistent.ipk'));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('IPK package not found');
  });

  it('validates a complete, correctly structured IPK package', () => {
    const ipkBuf = createMockIpk([
      { name: 'usr/palm/applications/com.lennylxx.iptv/appinfo.json', content: JSON.stringify({ id: 'com.lennylxx.iptv', version: '1.17.0' }) },
      { name: 'usr/palm/applications/com.lennylxx.iptv/index.html', content: '<!DOCTYPE html><html><head><link rel="stylesheet" href="bundle.css"></head><body><script src="bundle.js"></script></body></html>' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.js', content: 'console.log("ok");' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.css', content: 'body {}' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/icon.png', content: 'PNG' },
      { name: 'usr/palm/services/com.lennylxx.iptv.service/package.json', content: JSON.stringify({ main: 'index.js' }) },
      { name: 'usr/palm/services/com.lennylxx.iptv.service/services.json', content: JSON.stringify({ id: 'com.lennylxx.iptv.service' }) },
      { name: 'usr/palm/services/com.lennylxx.iptv.service/index.js', content: 'service' },
      { name: 'usr/palm/services/com.lennylxx.iptv.service/setup/setup-page.html', content: 'setup' },
    ]);

    const ipkPath = path.join(tmpDir, 'valid.ipk');
    fs.writeFileSync(ipkPath, ipkBuf);

    const result = validateIpkPackage(ipkPath);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.files.length).toBe(9);
  });

  it('fails with critical error if IPK contains preview-libs.js', () => {
    const ipkBuf = createMockIpk([
      { name: 'usr/palm/applications/com.lennylxx.iptv/appinfo.json', content: JSON.stringify({ id: 'com.lennylxx.iptv', version: '1.17.0' }) },
      { name: 'usr/palm/applications/com.lennylxx.iptv/index.html', content: '<html></html>' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.js', content: 'console.log("ok");' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.css', content: 'body {}' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/js/preview-libs.js', content: 'alert("preview");' },
    ]);

    const ipkPath = path.join(tmpDir, 'preview-violation.ipk');
    fs.writeFileSync(ipkPath, ipkBuf);

    const result = validateIpkPackage(ipkPath);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('preview-libs.js'))).toBe(true);
  });

  it('fails with critical error if index.html inside IPK references preview-libs.js', () => {
    const ipkBuf = createMockIpk([
      { name: 'usr/palm/applications/com.lennylxx.iptv/appinfo.json', content: JSON.stringify({ id: 'com.lennylxx.iptv', version: '1.17.0' }) },
      { name: 'usr/palm/applications/com.lennylxx.iptv/index.html', content: '<script src="js/preview-libs.js"></script>' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.js', content: 'console.log("ok");' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.css', content: 'body {}' },
    ]);

    const ipkPath = path.join(tmpDir, 'html-preview-violation.ipk');
    fs.writeFileSync(ipkPath, ipkBuf);

    const result = validateIpkPackage(ipkPath);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('preview-libs.js'))).toBe(true);
  });

  it('detects incompatible 64-bit or non-ARM ELF binaries', () => {
    // Construct fake ELF x86_64 header:
    // \x7fELF, ei_class = 2 (64-bit), e_machine = 62 (x86_64)
    const x86Elf = Buffer.alloc(52);
    x86Elf[0] = 0x7f; x86Elf[1] = 0x45; x86Elf[2] = 0x4c; x86Elf[3] = 0x46;
    x86Elf[4] = 2; // 64-bit
    x86Elf.writeUInt16LE(62, 18); // x86_64

    const ipkBuf = createMockIpk([
      { name: 'usr/palm/applications/com.lennylxx.iptv/appinfo.json', content: JSON.stringify({ id: 'com.lennylxx.iptv', version: '1.17.0' }) },
      { name: 'usr/palm/applications/com.lennylxx.iptv/index.html', content: '<html></html>' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.js', content: 'console.log("ok");' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.css', content: 'body {}' },
      { name: 'bin/native-tool', content: x86Elf },
    ]);

    const ipkPath = path.join(tmpDir, 'bad-elf.ipk');
    fs.writeFileSync(ipkPath, ipkBuf);

    const result = validateIpkPackage(ipkPath);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('64-bit'))).toBe(true);
    expect(result.errors.some((e) => e.includes('requires ARM'))).toBe(true);
  });

  it('accepts compatible ARMv7 32-bit ELF binaries', () => {
    // Construct valid ARMv7 ELF:
    // \x7fELF, ei_class = 1 (32-bit), e_machine = 40 (0x28, ARM)
    const armElf = Buffer.alloc(52);
    armElf[0] = 0x7f; armElf[1] = 0x45; armElf[2] = 0x4c; armElf[3] = 0x46;
    armElf[4] = 1; // 32-bit
    armElf.writeUInt16LE(40, 18); // ARM

    const ipkBuf = createMockIpk([
      { name: 'usr/palm/applications/com.lennylxx.iptv/appinfo.json', content: JSON.stringify({ id: 'com.lennylxx.iptv', version: '1.17.0' }) },
      { name: 'usr/palm/applications/com.lennylxx.iptv/index.html', content: '<html></html>' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.js', content: 'console.log("ok");' },
      { name: 'usr/palm/applications/com.lennylxx.iptv/bundle.css', content: 'body {}' },
      { name: 'bin/arm-tool', content: armElf },
    ]);

    const ipkPath = path.join(tmpDir, 'arm-elf.ipk');
    fs.writeFileSync(ipkPath, ipkBuf);

    const result = validateIpkPackage(ipkPath);
    expect(result.valid).toBe(true);
  });

  it('validates the real packaged IPK if present', () => {
    const realIpk = path.resolve('AUDIT_REPORTS/MISSION_1B/package/com.lennylxx.iptv_1.17.0_all.ipk');
    if (fs.existsSync(realIpk)) {
      const result = validateIpkPackage(realIpk);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.files.length).toBeGreaterThan(50);
    }
  });
});
