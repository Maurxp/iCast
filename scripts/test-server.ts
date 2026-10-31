import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as net from 'net';

export interface TestServerOptions {
  port?: number;
  host?: string;
  fixturesDir?: string;
}

export const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.m3u': 'application/x-mpegurl',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.json': 'application/json',
  '.xml': 'application/xml',
};

/**
 * Strict whitelist of allowed media fixture files.
 * The test server will strictly refuse to serve any file not in this whitelist.
 */
export const ALLOWED_FIXTURE_FILES = new Set([
  'synthetic_test.mp4',
  'synthetic_test.m3u',
]);

/**
 * HEURISTIC filter matching common virtual, VPN, container, or pseudo interface names.
 *
 * NOTE: Interface name pattern matching is a best-effort heuristic filter, NOT an OS-level
 * or cryptographic guarantee that an interface is physical hardware. Attackers or custom
 * network configurations could assign arbitrary names to virtual or VPN devices.
 * Therefore, this heuristic filter is strictly paired with RFC 1918 private IPv4 validation
 * and explicit ambiguity rejection in getLanIp().
 */
export const VIRTUAL_OR_VPN_REGEX =
  /(?:vpn|radmin|hamachi|tailscale|zerotier|wireguard|tun|tap|utun|wg|docker|vethernet|vmnet|vbox|virtual|pseudo|teredo|hyper-v|wsl)/i;

export function isVirtualOrVpnInterface(name: string): boolean {
  return VIRTUAL_OR_VPN_REGEX.test(name);
}

/**
 * Detect wildcard addresses (0.0.0.0, ::, ::0, 0:0:0:0:0:0:0:0, etc.)
 */
export function isWildcardIp(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase();
  if (trimmed === '0.0.0.0') return true;
  if (trimmed === '::' || trimmed === '::0') return true;
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').filter(Boolean);
    if (parts.length === 0 || parts.every((p) => /^0+$/.test(p))) {
      return true;
    }
  }
  const ipv4Parts = trimmed.split('.');
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => p === '0')) {
    return true;
  }
  return false;
}

/**
 * Return all available IP addresses on local network interfaces.
 */
export function getAvailableLocalIps(
  customInterfaces?: NodeJS.Dict<os.NetworkInterfaceInfo[]>,
): Set<string> {
  const ips = new Set<string>(['127.0.0.1', '::1']);
  const ifaces = customInterfaces || os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    const list = ifaces[name];
    if (!list) continue;
    for (const iface of list) {
      if (iface.address) {
        ips.add(iface.address.toLowerCase());
      }
    }
  }
  return ips;
}

/**
 * Check if an IPv4 address is strictly within RFC 1918 private ranges:
 * - 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
 * - 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
 * - 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
 *
 * Rejects public IPs, link-local (169.254.0.0/16), loopback (127.0.0.0/8),
 * CGNAT (100.64.0.0/10), multicast (224.0.0.0/4), and reserved addresses.
 */
export function isRfc1918PrivateIpv4(ip: string): boolean {
  const trimmed = ip.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 4) return false;
  const octets = parts.map((p) => parseInt(p, 10));
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return false;

  const [o1, o2] = octets;
  // 10.0.0.0/8
  if (o1 === 10) return true;
  // 172.16.0.0/12
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
  // 192.168.0.0/16
  if (o1 === 192 && o2 === 168) return true;

  return false;
}

/**
 * Backward compatibility alias for isRfc1918PrivateIpv4.
 */
export const isPrivateIpv4 = isRfc1918PrivateIpv4;

/**
 * Validates a host address: rejects wildcards, validates IP syntax,
 * and confirms it belongs to an active local network interface.
 */
export function validateHostAddress(
  host: string,
  customInterfaces?: NodeJS.Dict<os.NetworkInterfaceInfo[]>,
): string {
  const trimmed = host.trim();
  if (!trimmed) {
    throw new Error('Host address cannot be empty');
  }

  // 1. Explicitly reject wildcards (0.0.0.0, ::, etc.)
  if (isWildcardIp(trimmed)) {
    throw new Error(`Wildcard binding address "${trimmed}" is strictly prohibited for test server safety`);
  }

  // Allow 'localhost' explicitly as loopback alias
  if (trimmed.toLowerCase() === 'localhost') {
    return '127.0.0.1';
  }

  // 2. Syntactic validation
  const cleanIp = trimmed.replace(/^\[|\]$/g, '');
  if (net.isIP(cleanIp) === 0) {
    throw new Error(`Invalid IP address syntax: "${trimmed}"`);
  }

  // 3. Confirm address corresponds to an active local interface
  const availableIps = getAvailableLocalIps(customInterfaces);
  if (!availableIps.has(cleanIp.toLowerCase())) {
    throw new Error(`Host address "${trimmed}" does not correspond to any active local network interface`);
  }

  return cleanIp;
}

/**
 * Detect a non-internal, non-virtual physical LAN IPv4 address strictly within RFC 1918.
 *
 * Rules:
 * 1. Only RFC 1918 private IPv4 addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) are eligible.
 * 2. Public, link-local (169.254.x.x), multicast, and reserved addresses are strictly excluded.
 * 3. Virtual and VPN interfaces are filtered via the isVirtualOrVpnInterface() heuristic.
 * 4. If multiple candidates exist after filtering, automatic selection is refused to prevent
 *    silent wrong-interface binding. The function fails explicitly requiring --host <ip>.
 * 5. If no unequivocal private RFC 1918 candidate exists, the function fails closed.
 */
export function getLanIp(customInterfaces?: NodeJS.Dict<os.NetworkInterfaceInfo[]>): string {
  const ifaces = customInterfaces || os.networkInterfaces();
  const candidates: Array<{ name: string; ip: string }> = [];

  for (const name of Object.keys(ifaces)) {
    if (isVirtualOrVpnInterface(name)) {
      continue;
    }
    const list = ifaces[name] || [];
    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (isRfc1918PrivateIpv4(iface.address) && !isWildcardIp(iface.address)) {
          candidates.push({ name, ip: iface.address });
        }
      }
    }
  }

  const uniqueIps = Array.from(new Set(candidates.map((c) => c.ip)));

  if (uniqueIps.length === 0) {
    throw new Error(
      'Unable to identify a safe physical LAN interface: no non-virtual interface with an RFC 1918 private IPv4 address (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) was found. Please specify the host explicitly via --host <ip>.',
    );
  }

  if (uniqueIps.length > 1) {
    const candidateList = candidates.map((c) => `${c.name} (${c.ip})`).join(', ');
    throw new Error(
      `Ambiguous LAN configuration: multiple RFC 1918 private IPv4 interfaces detected [${candidateList}]. Automatic selection is refused for safety; please specify the intended interface explicitly via --host <ip>.`,
    );
  }

  return uniqueIps[0];
}

/**
 * Parse standard HTTP byte Range header.
 */
export function parseRange(
  rangeHeader: string,
  fileSize: number,
): { start: number; end: number } | 'invalid' | null {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null;
  }
  const parts = rangeHeader.slice(6).split('-');
  if (parts.length !== 2) return 'invalid';

  const rawStart = parts[0].trim();
  const rawEnd = parts[1].trim();

  let start: number;
  let end: number;

  if (rawStart === '') {
    const suffix = parseInt(rawEnd, 10);
    if (isNaN(suffix) || suffix <= 0) return 'invalid';
    start = Math.max(0, fileSize - suffix);
    end = fileSize - 1;
  } else {
    start = parseInt(rawStart, 10);
    if (isNaN(start) || start < 0) return 'invalid';
    if (rawEnd === '') {
      end = fileSize - 1;
    } else {
      end = parseInt(rawEnd, 10);
      if (isNaN(end) || end < start) return 'invalid';
    }
  }

  if (start >= fileSize) {
    return 'invalid';
  }
  end = Math.min(end, fileSize - 1);
  return { start, end };
}

/**
 * Creates the restricted media test server.
 */
export function createTestServer(options: TestServerOptions = {}): Server {
  const host = options.host ? validateHostAddress(options.host) : '127.0.0.1';
  const baseDir = path.resolve(options.fixturesDir || path.join(process.cwd(), 'scripts', 'fixtures'));

  return createServer((req: IncomingMessage, res: ServerResponse) => {
    // CORS headers for testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    const rawReqUrl = req.url || '/';
    // Reject path traversal attempts immediately
    if (rawReqUrl.includes('..') || rawReqUrl.toLowerCase().includes('%2e%2e')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Path Traversal Detected');
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawReqUrl, `http://${req.headers.host || host}`);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
      return;
    }

    let rawPath = parsedUrl.pathname;
    try {
      rawPath = decodeURIComponent(rawPath);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
      return;
    }

    let targetFilename = rawPath.replace(/^\/+/, '');
    if (targetFilename === '') {
      targetFilename = 'synthetic_test.mp4';
    }

    // Strict whitelist enforcement: reject any unapproved file requests
    if (!ALLOWED_FIXTURE_FILES.has(targetFilename)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: Unapproved fixture file');
      return;
    }

    const safePath = path.resolve(baseDir, targetFilename);
    if (!safePath.startsWith(baseDir + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Path Traversal Detected');
      return;
    }

    fs.stat(safePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileSize = stats.size;

      const rangeHeader = req.headers.range;
      if (rangeHeader) {
        const range = parseRange(rangeHeader, fileSize);
        if (range === 'invalid') {
          res.writeHead(416, {
            'Content-Range': `bytes */${fileSize}`,
            'Content-Type': 'text/plain',
          });
          res.end('Requested Range Not Satisfiable');
          return;
        }

        if (range) {
          const chunkSize = range.end - range.start + 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${range.start}-${range.end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType,
          });

          if (req.method === 'HEAD') {
            res.end();
            return;
          }

          const stream = fs.createReadStream(safePath, { start: range.start, end: range.end });
          stream.on('error', () => {
            if (!res.headersSent) {
              res.writeHead(500);
            }
            res.end();
          });
          stream.pipe(res);
          return;
        }
      }

      // Full file GET
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const fullStream = fs.createReadStream(safePath);
      fullStream.on('error', () => {
        if (!res.headersSent) {
          res.writeHead(500);
        }
        res.end();
      });
      fullStream.pipe(res);
    });
  });
}

/**
 * Parse CLI options for host, port and interface.
 */
export function parseServerCliArgs(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
  customInterfaces?: NodeJS.Dict<os.NetworkInterfaceInfo[]>,
): { host: string; port: number } {
  let host = '127.0.0.1';
  let port = 8088;

  // 1. Process environment variables first
  if (env.TEST_SERVER_PORT) {
    const p = parseInt(env.TEST_SERVER_PORT, 10);
    if (!isNaN(p) && p > 0 && p <= 65535) {
      port = p;
    }
  }

  if (env.TEST_SERVER_HOST) {
    const rawEnvHost = env.TEST_SERVER_HOST.trim();
    if (rawEnvHost === 'lan') {
      host = getLanIp(customInterfaces);
    } else {
      host = validateHostAddress(rawEnvHost, customInterfaces);
    }
  }

  // 2. Parse CLI arguments (higher precedence than environment)
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--host') {
      const next = argv[++i];
      if (!next) {
        throw new Error('--host requires an address argument');
      }
      const rawHost = next.trim();
      if (rawHost === 'lan') {
        host = getLanIp(customInterfaces);
      } else {
        host = validateHostAddress(rawHost, customInterfaces);
      }
    } else if (arg === '--port') {
      const next = argv[++i];
      if (!next) {
        throw new Error('--port requires a port argument');
      }
      const parsedPort = parseInt(next, 10);
      if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        throw new Error(`Invalid port: "${next}". Must be between 1 and 65535.`);
      }
      port = parsedPort;
    } else if (arg === '--lan') {
      host = getLanIp(customInterfaces);
    }
  }

  // Final validation of the selected host
  host = validateHostAddress(host, customInterfaces);

  return { host, port };
}

// Standalone execution: strictly requires user to invoke it; never binds to 0.0.0.0.
if (process.argv[1] && process.argv[1].endsWith('test-server.ts')) {
  const { host, port } = parseServerCliArgs(process.argv.slice(2));
  const server = createTestServer({ host, port });

  server.listen(port, host, () => {
    console.log(`[TestServer] Bound strictly to http://${host}:${port}`);
    console.log(`[TestServer] Available stream: http://${host}:${port}/synthetic_test.mp4`);
    console.log(`[TestServer] Allowed fixtures: ${Array.from(ALLOWED_FIXTURE_FILES).join(', ')}`);
    console.log('[TestServer] Press Ctrl+C (SIGINT) to stop the server cleanly.');
  });

  const shutdown = () => {
    console.log('\n[TestServer] Stopping server...');
    server.close(() => {
      console.log('[TestServer] Server stopped cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
