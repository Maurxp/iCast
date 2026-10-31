/**
 * Automated package resource and IPK validator for webOS IPTV Player.
 *
 * Validates that all assets, stylesheets, scripts, and service files referenced
 * in appinfo.json, index.html, and services.json exist on disk and that no
 * desktop/preview-only libraries (such as preview-libs.js) are referenced in the
 * production bundle or included in the final packaged .ipk archive.
 */

import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { gunzipSync } from 'zlib';

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 * @property {string[]} warnings
 * @property {string[]} checkedFiles
 */

/**
 * @typedef {Object} IpkValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 * @property {string[]} warnings
 * @property {string[]} files
 * @property {number} ipkSize
 */

/**
 * Validate uncompressed build artifacts before ares-package execution.
 *
 * @param {string} [distDir='dist']
 * @param {string} [serviceDir='build/bundled-service']
 * @returns {ValidationResult}
 */
export function validatePackageResources(
  distDir = 'dist',
  serviceDir = 'build/bundled-service',
) {
  const errors = [];
  const warnings = [];
  const checkedFiles = [];

  const resolvedDist = resolve(distDir);
  if (!existsSync(resolvedDist)) {
    errors.push(`Dist directory does not exist: ${distDir}`);
    return { valid: false, errors, warnings, checkedFiles };
  }

  // 1. Validate appinfo.json
  const appinfoPath = join(resolvedDist, 'appinfo.json');
  if (!existsSync(appinfoPath)) {
    errors.push(`Missing appinfo.json in ${distDir}`);
  } else {
    checkedFiles.push(appinfoPath);
    try {
      const appinfo = JSON.parse(readFileSync(appinfoPath, 'utf8'));
      if (!appinfo.id) errors.push('appinfo.json is missing required field: id');
      if (!appinfo.version) errors.push('appinfo.json is missing required field: version');

      const mainFile = appinfo.main || 'index.html';
      const mainPath = join(resolvedDist, mainFile);
      if (!existsSync(mainPath)) {
        errors.push(`appinfo.json "main" points to non-existent file: ${mainFile}`);
      } else {
        checkedFiles.push(mainPath);
      }

      if (appinfo.icon) {
        const iconPath = join(resolvedDist, appinfo.icon);
        if (!existsSync(iconPath)) {
          errors.push(`appinfo.json "icon" points to non-existent file: ${appinfo.icon}`);
        } else {
          checkedFiles.push(iconPath);
        }
      }

      if (appinfo.largeIcon) {
        const largeIconPath = join(resolvedDist, appinfo.largeIcon);
        if (!existsSync(largeIconPath)) {
          errors.push(`appinfo.json "largeIcon" points to non-existent file: ${appinfo.largeIcon}`);
        } else {
          checkedFiles.push(largeIconPath);
        }
      }
    } catch (e) {
      errors.push(`Failed to parse appinfo.json: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 2. Validate index.html and referenced scripts/stylesheets
  const indexPath = join(resolvedDist, 'index.html');
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf8');

    // Reject preview-libs in production HTML
    if (html.includes('preview-libs.js')) {
      errors.push('CRITICAL: index.html references preview-libs.js! Preview assets must not be packaged in production IPK.');
    }

    // Check all script tags
    const scriptRegex = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    let scriptMatch;
    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      const src = scriptMatch[1];
      if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
        const cleanSrc = src.split('?')[0].split('#')[0];
        const scriptFile = join(resolvedDist, cleanSrc);
        if (!existsSync(scriptFile)) {
          errors.push(`index.html references missing script: ${src}`);
        } else {
          checkedFiles.push(scriptFile);
        }
      }
    }

    // Check all stylesheet link tags
    const linkRegex = /<link\b[^>]*>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const tag = linkMatch[0];
      const relMatch = /\brel=["']([^"']+)["']/i.exec(tag);
      const hrefMatch = /\bhref=["']([^"']+)["']/i.exec(tag);
      if (relMatch && hrefMatch) {
        const rel = relMatch[1].toLowerCase();
        const href = hrefMatch[1];
        if (rel.includes('stylesheet') || rel.includes('icon')) {
          if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
            const cleanHref = href.split('?')[0].split('#')[0];
            const linkedFile = join(resolvedDist, cleanHref);
            if (!existsSync(linkedFile)) {
              errors.push(`index.html references missing asset (${rel}): ${href}`);
            } else {
              checkedFiles.push(linkedFile);
            }
          }
        }
      }
    }
  }

  // 3. Validate service directory if present
  const resolvedService = serviceDir ? resolve(serviceDir) : null;
  if (resolvedService && existsSync(resolvedService)) {
    const servicePkgPath = join(resolvedService, 'package.json');
    if (!existsSync(servicePkgPath)) {
      warnings.push(`Service package.json missing at: ${servicePkgPath}`);
    } else {
      checkedFiles.push(servicePkgPath);
      try {
        const pkg = JSON.parse(readFileSync(servicePkgPath, 'utf8'));
        const main = pkg.main || 'index.js';
        const serviceMainPath = join(resolvedService, main);
        if (!existsSync(serviceMainPath)) {
          errors.push(`Service package.json "main" points to non-existent file: ${main}`);
        } else {
          checkedFiles.push(serviceMainPath);
        }
      } catch (e) {
        errors.push(`Failed to parse service package.json: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const servicesJsonPath = join(resolvedService, 'services.json');
    if (!existsSync(servicesJsonPath)) {
      warnings.push(`services.json missing at: ${servicesJsonPath}`);
    } else {
      checkedFiles.push(servicesJsonPath);
      try {
        const sj = JSON.parse(readFileSync(servicesJsonPath, 'utf8'));
        if (!sj.id) errors.push('services.json is missing required field: id');
      } catch (e) {
        errors.push(`Failed to parse services.json: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const setupHtmlPath = join(resolvedService, 'setup', 'setup-page.html');
    if (!existsSync(setupHtmlPath)) {
      errors.push(`Service setup HTML missing at: ${setupHtmlPath}`);
    } else {
      checkedFiles.push(setupHtmlPath);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checkedFiles,
  };
}

/**
 * Pure JavaScript parser for Debian/webOS .ipk (ar archive with tar.gz).
 *
 * @param {Buffer} ipkBuffer
 * @returns {{ arEntries: Record<string, Buffer>, files: Array<{ name: string, size: number, data: Buffer, isDir: boolean }> }}
 */
export function parseIpkArchive(ipkBuffer) {
  if (ipkBuffer.subarray(0, 8).toString('ascii') !== '!<arch>\n') {
    throw new Error('Not a valid ar/ipk archive: missing !<arch>\\n magic bytes');
  }

  const arEntries = {};
  let offset = 8;
  while (offset < ipkBuffer.length) {
    const header = ipkBuffer.subarray(offset, offset + 60);
    if (header.length < 60) break;
    const name = header.subarray(0, 16).toString('ascii').trim().replace(/\/$/, '');
    const size = parseInt(header.subarray(48, 58).toString('ascii').trim(), 10);
    if (isNaN(size) || size < 0) break;
    arEntries[name] = ipkBuffer.subarray(offset + 60, offset + 60 + size);
    offset += 60 + size + (size % 2);
  }

  if (!arEntries['data.tar.gz']) {
    throw new Error('IPK archive missing data.tar.gz');
  }

  const dataTar = gunzipSync(arEntries['data.tar.gz']);
  const files = [];
  let tarOff = 0;

  while (tarOff + 512 <= dataTar.length) {
    const h = dataTar.subarray(tarOff, tarOff + 512);
    // Two consecutive zero blocks mark end of tar archive
    if (h.every((b) => b === 0)) break;

    let filename = h.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const prefix = h.subarray(345, 345 + 155).toString('utf8').replace(/\0.*$/, '');
    if (prefix) {
      filename = `${prefix}/${filename}`;
    }

    const sizeOctal = h.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
    const size = parseInt(sizeOctal, 8) || 0;
    const typeFlag = String.fromCharCode(h[156]);
    const isDir = typeFlag === '5' || filename.endsWith('/');
    const data = dataTar.subarray(tarOff + 512, tarOff + 512 + size);

    files.push({ name: filename, size, data, isDir });
    tarOff += 512 + Math.ceil(size / 512) * 512;
  }

  return { arEntries, files };
}

/**
 * Validate the packaged .ipk archive against webOS deployment specifications.
 *
 * @param {string} ipkPath
 * @returns {IpkValidationResult}
 */
export function validateIpkPackage(ipkPath) {
  const errors = [];
  const warnings = [];
  const checkedFiles = [];

  const resolvedPath = resolve(ipkPath);
  if (!existsSync(resolvedPath)) {
    return {
      valid: false,
      errors: [`IPK package not found at: ${ipkPath}`],
      warnings: [],
      files: [],
      ipkSize: 0,
    };
  }

  const ipkBuffer = readFileSync(resolvedPath);
  let parsed;
  try {
    parsed = parseIpkArchive(ipkBuffer);
  } catch (e) {
    return {
      valid: false,
      errors: [`Failed to parse IPK archive: ${e instanceof Error ? e.message : String(e)}`],
      warnings: [],
      files: [],
      ipkSize: ipkBuffer.length,
    };
  }

  const fileNames = parsed.files.map((f) => f.name);
  checkedFiles.push(...fileNames);

  // 1. Verify that preview-libs.js is NEVER included
  const hasPreviewLibs = fileNames.some((f) => f.includes('preview-libs.js'));
  if (hasPreviewLibs) {
    errors.push('CRITICAL: Package contains preview-libs.js! Preview assets must be excluded from production IPK.');
  }

  // 2. Locate appinfo.json in package
  const appinfoEntry = parsed.files.find((f) => f.name.endsWith('appinfo.json'));
  if (!appinfoEntry) {
    errors.push('IPK is missing appinfo.json in data.tar.gz');
  } else {
    try {
      const appinfo = JSON.parse(appinfoEntry.data.toString('utf8'));
      if (appinfo.id !== 'com.lennylxx.iptv') {
        errors.push(`appinfo.json id mismatch: expected com.lennylxx.iptv, got ${appinfo.id}`);
      }
      if (!appinfo.version) {
        errors.push('appinfo.json missing version');
      }
    } catch (e) {
      errors.push(`Failed to parse appinfo.json in IPK: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 3. Locate index.html and verify no preview-libs reference
  const indexHtmlEntry = parsed.files.find((f) => f.name.endsWith('index.html'));
  if (!indexHtmlEntry) {
    errors.push('IPK is missing index.html');
  } else {
    const htmlText = indexHtmlEntry.data.toString('utf8');
    if (htmlText.includes('preview-libs.js')) {
      errors.push('CRITICAL: index.html inside IPK contains reference to preview-libs.js');
    }
  }

  // 4. Verify critical app assets
  const hasAppJs = fileNames.some((f) => f.endsWith('js/app.js') || f.endsWith('bundle.js'));
  const hasMainCss = fileNames.some((f) => f.endsWith('css/main.css') || f.endsWith('bundle.css'));
  const hasIcon = fileNames.some((f) => f.endsWith('icon.png'));

  if (!hasAppJs) errors.push('IPK is missing main app script (js/app.js or bundle.js)');
  if (!hasMainCss) errors.push('IPK is missing main stylesheet (css/main.css or bundle.css)');
  if (!hasIcon) warnings.push('IPK does not contain icon.png');

  // Verify all scripts and stylesheets referenced in index.html exist in the IPK
  if (indexHtmlEntry) {
    const html = indexHtmlEntry.data.toString('utf8');
    const scriptRegex = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    let sMatch;
    while ((sMatch = scriptRegex.exec(html)) !== null) {
      const src = sMatch[1];
      if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
        const clean = src.split('?')[0].split('#')[0];
        const exists = fileNames.some((f) => f.endsWith(clean));
        if (!exists) errors.push(`IPK index.html references missing script: ${src}`);
      }
    }

    const linkRegex = /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
    let lMatch;
    while ((lMatch = linkRegex.exec(html)) !== null) {
      const href = lMatch[1];
      if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
        const clean = href.split('?')[0].split('#')[0];
        const exists = fileNames.some((f) => f.endsWith(clean));
        if (!exists) errors.push(`IPK index.html references missing stylesheet/asset: ${href}`);
      }
    }
  }

  // 5. Verify service assets
  const servicePkgEntry = parsed.files.find((f) => f.name.includes('services/com.lennylxx.iptv.service') && f.name.endsWith('package.json'));
  if (!servicePkgEntry) {
    warnings.push('IPK does not contain bundled-service package.json');
  } else {
    try {
      const spkg = JSON.parse(servicePkgEntry.data.toString('utf8'));
      const main = spkg.main || 'index.js';
      const hasMain = fileNames.some((f) => f.includes('services/com.lennylxx.iptv.service') && f.endsWith(main));
      if (!hasMain) {
        errors.push(`Bundled service main file "${main}" not found in IPK`);
      }
    } catch (e) {
      errors.push(`Failed to parse service package.json in IPK: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const servicesJsonEntry = parsed.files.find((f) => f.name.includes('services/com.lennylxx.iptv.service') && f.name.endsWith('services.json'));
  if (!servicesJsonEntry) {
    warnings.push('IPK does not contain bundled-service services.json');
  } else {
    try {
      const sj = JSON.parse(servicesJsonEntry.data.toString('utf8'));
      if (sj.id !== 'com.lennylxx.iptv.service') {
        errors.push(`services.json id mismatch: expected com.lennylxx.iptv.service, got ${sj.id}`);
      }
    } catch (e) {
      errors.push(`Failed to parse services.json in IPK: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const hasSetupHtml = fileNames.some((f) => f.endsWith('setup-page.html'));
  if (!hasSetupHtml) {
    warnings.push('IPK does not contain setup-page.html');
  }

  // 6. Inspect any ELF binaries for ARMv7 32-bit compliance
  for (const file of parsed.files) {
    if (file.isDir || file.size < 20) continue;
    const buf = file.data;
    if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) {
      // ELF Header
      const eiClass = buf[4]; // 1 = 32-bit, 2 = 64-bit
      const eMachine = buf.readUInt16LE(18); // 40 (0x28) = ARM

      if (eiClass !== 1) {
        errors.push(`ELF binary "${file.name}" is 64-bit; webOS 4 (RTD2870) requires 32-bit ARMv7 binaries`);
      }
      if (eMachine !== 40) {
        errors.push(`ELF binary "${file.name}" has machine type ${eMachine}; webOS 4 (RTD2870) requires ARM (type 40)`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    files: fileNames,
    ipkSize: ipkBuffer.length,
  };
}

// CLI entry point
const isCli = process.argv[1] && resolve(process.argv[1]) === resolve('scripts/validate-package-resources.mjs');
if (isCli) {
  const args = process.argv.slice(2);
  const ipkFlagIdx = args.indexOf('--ipk');

  if (ipkFlagIdx !== -1 && args[ipkFlagIdx + 1]) {
    const ipkPath = args[ipkFlagIdx + 1];
    console.log(`[Package Resource Validator] Inspecting IPK archive: ${ipkPath}...`);
    const ipkResult = validateIpkPackage(ipkPath);
    console.log(`[Package Resource Validator] IPK size: ${ipkResult.ipkSize} bytes, Total entries: ${ipkResult.files.length}`);

    if (ipkResult.warnings.length > 0) {
      for (const w of ipkResult.warnings) {
        console.warn(`[WARN] ${w}`);
      }
    }

    if (!ipkResult.valid) {
      console.error(`[ERROR] IPK validation failed with ${ipkResult.errors.length} error(s):`);
      for (const err of ipkResult.errors) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    }

    console.log('[OK] IPK package passed all architectural, security, and resource checks.');
    process.exit(0);
  }

  const distArg = args[0] || 'dist';
  const serviceArg = args[1] || 'build/bundled-service';
  const result = validatePackageResources(distArg, serviceArg);

  console.log(`[Package Resource Validator] Validating ${distArg} and ${serviceArg}...`);
  console.log(`[Package Resource Validator] Verified ${result.checkedFiles.length} resources.`);

  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.warn(`[WARN] ${w}`);
    }
  }

  if (!result.valid) {
    console.error(`[ERROR] Resource validation failed with ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('[OK] All package resources are valid and verified.');
  process.exit(0);
}
