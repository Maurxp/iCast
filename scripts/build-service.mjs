import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLED_DIR = path.join(ROOT, 'bundled-service');
const BUILD_SERVICE_DIR = path.join(ROOT, 'build', 'bundled-service');

console.log('[service:build] Cleaning build/bundled-service...');
fs.rmSync(BUILD_SERVICE_DIR, { recursive: true, force: true });

console.log('[service:build] Compiling TypeScript via tsc...');
const tscPath = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
execFileSync(process.execPath, [tscPath, '-p', 'bundled-service/tsconfig.json'], {
  cwd: ROOT,
  stdio: 'inherit',
});

console.log('[service:build] Copying service configuration and static assets...');
fs.copyFileSync(
  path.join(BUNDLED_DIR, 'package.json'),
  path.join(BUILD_SERVICE_DIR, 'package.json'),
);
fs.copyFileSync(
  path.join(BUNDLED_DIR, 'src', 'services.json'),
  path.join(BUILD_SERVICE_DIR, 'services.json'),
);

const setupOutDir = path.join(BUILD_SERVICE_DIR, 'setup');
fs.mkdirSync(setupOutDir, { recursive: true });
fs.copyFileSync(
  path.join(BUNDLED_DIR, 'src', 'setup', 'setup-page.html'),
  path.join(setupOutDir, 'setup-page.html'),
);

console.log('[service:build] Running service compatibility gate (Node.js 0.12.2)...');
execFileSync(process.execPath, ['scripts/service-compat-gate.mjs', 'build/bundled-service'], {
  cwd: ROOT,
  stdio: 'inherit',
});

console.log('[service:build] Successfully built bundled-service in build/bundled-service.');
