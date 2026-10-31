/**
 * Shared LAN HTTP server for phone setup and M3U uploads. The Luna registration
 * entry point lives in index.ts; lan/service.ts passes the resolved data
 * directory and fans change events out over Luna.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { randomBytes } from 'crypto';
import {
  bufferFrom,
  isSafeInteger,
  padStart,
  parseUrl,
  secureRandomInt,
  timingSafeEqualString,
} from '../compat';
import {
  parseSetupAction,
  SetupActionStore,
} from '../setup/actions';
import { parseSetupState, SetupStateStore } from '../setup/state';
import { isValidUploadId, UploadStore } from '../upload/store';

export type ServiceChangeEvent = 'uploads-changed' | 'setup-changed';

export interface StartServerOptions {
  isLoopback?: (req: http.IncomingMessage) => boolean;
  appToken?: string;
  setupToken?: string;
  rotateOnSuccess?: boolean;
  pairingTtlMs?: number;
  getClientAddress?: (req: http.IncomingMessage) => string;
}

export interface StartServerResult {
  server: http.Server;
  port: number;
  setupToken: string;
  appToken: string;
  pairingCode: string;
}

const PAIRING_MAX_FAILURES = 5;
const PAIRING_LOCK_MS = 60 * 1000;
const GLOBAL_PAIRING_MAX_FAILURES = 20;
const GLOBAL_PAIRING_LOCK_MS = 5 * 60 * 1000;

function getLanIp(): string {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const ni of ifaces[name] || []) {
      if (ni.family === 'IPv4' && !ni.internal) return ni.address;
    }
  }
  return 'localhost';
}

function isLoopback(req: http.IncomingMessage): boolean {
  const address = req.socket.remoteAddress || '';
  return address === '127.0.0.1' || address === '::1' ||
    address === '::ffff:127.0.0.1';
}

/**
 * Strict CORS origin validator.
 * Validates against loopback, local app package scheme (file://), and strictly
 * valid RFC 1918 IPv4 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).
 * Rejects public origins, malformed URLs, opaque origins ('null'), and domain
 * names that merely mimic private IPs (e.g. 192.168.attacker.example).
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin || origin === 'null') return false;
  if (origin === 'file://' || origin.indexOf('file:///') === 0) return true;
  try {
    const parsed = parseUrl(origin);
    const protocol = parsed.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    const hostname = parsed.hostname;
    if (!hostname) return false;

    // Loopback hostnames
    const cleanHost = hostname.replace(/^\[|\]$/g, '');
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === '::1') {
      return true;
    }

    // Strict RFC 1918 IPv4 validation: exactly 4 decimal octets
    const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
    if (ipv4Match) {
      const o1 = parseInt(ipv4Match[1], 10);
      const o2 = parseInt(ipv4Match[2], 10);
      const o3 = parseInt(ipv4Match[3], 10);
      const o4 = parseInt(ipv4Match[4], 10);

      // Verify each octet is in valid byte range 0-255
      if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) return false;

      // 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
      if (o1 === 10) return true;

      // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

      // 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
      if (o1 === 192 && o2 === 168) return true;
    }

    return false;
  } catch {
    return false;
  }
}

function getCorsOrigin(req: http.IncomingMessage): string | null {
  const origin = req.headers.origin;
  const originStr = Array.isArray(origin) ? origin[0] : origin;
  return isAllowedOrigin(originStr) ? originStr! : null;
}

function send(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  statusCode: number,
  contentType: string,
  body: string | Buffer,
): void {
  const allowedOrigin = getCorsOrigin(req);
  const headers: { [key: string]: string | number } = {
    'Content-Type': contentType,
    'Content-Length': Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body, 'utf-8'),
    'X-Content-Type-Options': 'nosniff',
  };
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-App-Token, X-Setup-Token';
    headers['Vary'] = 'Origin';
  }
  res.writeHead(statusCode, headers);
  res.end(body);
}

function sendJson(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  statusCode: number,
  obj: unknown,
): void {
  send(req, res, statusCode, 'application/json; charset=utf-8', JSON.stringify(obj));
}

function extractToken(req: http.IncomingMessage, query: (name: string) => string | null): string {
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.toLowerCase().indexOf('bearer ') === 0) {
    return auth.slice(7).trim();
  }
  const xAppToken = req.headers['x-app-token'];
  if (typeof xAppToken === 'string' && xAppToken.trim()) {
    return xAppToken.trim();
  }
  const xSetupToken = req.headers['x-setup-token'];
  if (typeof xSetupToken === 'string' && xSetupToken.trim()) {
    return xSetupToken.trim();
  }
  const queryToken = query('token');
  return queryToken || '';
}

function readBody(req: http.IncomingMessage, maxBytes = 16 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      const c = Buffer.isBuffer(chunk) ? chunk : bufferFrom(String(chunk), 'utf-8');
      size += c.length;
      if (size > maxBytes) {
        reject(new Error('Body exceeds limit (' + maxBytes + ' bytes)'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

// The setup page HTML lives in the sibling setup module so it can be
// edited as real HTML. The file is copied into the build output by build.sh.
let _setupPageCache: string | null = null;
function setupPageHtml(): string {
  if (_setupPageCache !== null) return _setupPageCache;
  _setupPageCache = fs.readFileSync(path.join(__dirname, '../setup/setup-page.html'), 'utf-8');
  return _setupPageCache;
}

/**
 * Bind the HTTP server on all interfaces. Pass `0` to let the OS assign a
 * free ephemeral port (typical production use — the bound port is returned
 * via the resolved promise and reported to the in-app client through Luna).
 *
 * `dataDir` is where uploaded .m3u files and their .json metadata live; pass
 * the result of resolveDataDir() (or any writable directory for tests).
 *
 * `onChange` is invoked synchronously after a successful upload mutation
 * (POST /uploads or DELETE /uploads/:id) or setup-action submission
 * (POST /setup-actions). Use it to fan out a push notification to subscribers
 * through the `serviceEvents` channel.
 */
export function startServer(
  port: number,
  dataDir: string,
  onChange?: (event: ServiceChangeEvent) => void,
  setupActions = new SetupActionStore(),
  setupState = new SetupStateStore(),
  options?: StartServerOptions,
): Promise<StartServerResult> {
  let boundPort = port;
  const setupToken = options?.setupToken || randomBytes(6).toString('hex');
  const appToken = options?.appToken || randomBytes(16).toString('hex');
  let pairingCode = padStart(String(secureRandomInt(10000)), 4, '0');
  let pairingCodeCreatedAt = Date.now();
  const pairingTtlMs = options?.pairingTtlMs || (15 * 60 * 1000);
  let globalFailures = 0;
  let globalBlockedUntil = 0;

  function currentPairingCode(): string {
    const now = Date.now();
    if (now - pairingCodeCreatedAt > pairingTtlMs) {
      pairingCode = padStart(String(secureRandomInt(10000)), 4, '0');
      pairingCodeCreatedAt = now;
      try { onChange?.('setup-changed'); } catch { /* ignore */ }
    }
    return pairingCode;
  }

  const pairingAttempts = Object.create(null) as {
    [client: string]: { failures: number; blockedUntil: number } | undefined;
  };
  const uploads = new UploadStore(dataDir);

  function isAppAuthorized(req: http.IncomingMessage, query: (name: string) => string | null): boolean {
    const token = extractToken(req, query);
    return token !== '' && token === appToken;
  }

  function isAuthorized(req: http.IncomingMessage, query: (name: string) => string | null): boolean {
    const token = extractToken(req, query);
    return token !== '' && (token === appToken || token === setupToken);
  }

  async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const urlObj = parseUrl(req.url || '/', 'http://' + (req.headers.host || 'localhost'));
    const pathname = urlObj.pathname;
    const query = urlObj.query;
    const host = req.headers.host || ('localhost:' + boundPort);

    try {
      if (req.method === 'OPTIONS') {
        const allowedOrigin = getCorsOrigin(req);
        if (!allowedOrigin) {
          res.writeHead(403);
          res.end();
          return;
        }
        res.writeHead(204, {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Token, X-Setup-Token',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        });
        res.end();
        return;
      }

      if (pathname === '/info') {
        // Internal metadata endpoint: requires appToken (Luna IPC boundary)
        if (!isAppAuthorized(req, query)) {
          sendJson(req, res, 403, { error: 'Unauthorized: appToken required' });
          return;
        }
        const ip = getLanIp();
        const hostPort = host.indexOf(':') >= 0 ? host.split(':')[1] : String(boundPort);
        sendJson(req, res, 200, {
          ip,
          port: parseInt(hostPort, 10) || boundPort,
          setupUrl: 'http://' + ip + ':' + hostPort + '/setup?token=' + setupToken,
          manualUrl: 'http://' + ip + ':' + hostPort,
          pairingCode: currentPairingCode(),
          dataDir,
        });
      } else if ((pathname === '/' || pathname === '/setup') && req.method === 'GET') {
        send(req, res, 200, 'text/html; charset=utf-8', setupPageHtml());
      } else if (pathname === '/pair' && req.method === 'POST') {
        const now = Date.now();
        if (globalBlockedUntil > now) {
          sendJson(req, res, 429, {
            error: 'Too many pairing attempts',
            retryAfter: Math.ceil((globalBlockedUntil - now) / 1000),
          });
          return;
        }
        if (globalBlockedUntil > 0 && globalBlockedUntil <= now) {
          globalBlockedUntil = 0;
          globalFailures = 0;
        }

        const client = (options?.getClientAddress ? options.getClientAddress(req) : null) || req.socket.remoteAddress || 'unknown';
        let current = pairingAttempts[client];
        if (current && current.blockedUntil > now) {
          // Reject immediately with 429. Do NOT increment globalFailures:
          // A blocked client cannot evaluate PINs and must not be allowed to DoS the network.
          sendJson(req, res, 429, {
            error: 'Too many pairing attempts',
            retryAfter: Math.ceil((current.blockedUntil - now) / 1000),
          });
          return;
        }
        if (current && current.blockedUntil > 0) {
          delete pairingAttempts[client];
          current = undefined;
        }
        let submitted = '';
        try {
          const body = JSON.parse(await readBody(req, 1024)) as { code?: unknown };
          submitted = typeof body.code === 'string' ? body.code : '';
        } catch {
          sendJson(req, res, 400, { error: 'Invalid pairing request' });
          return;
        }

        const expectedCode = currentPairingCode();
        if (!timingSafeEqualString(submitted, expectedCode)) {
          const failures = (current?.failures || 0) + 1;
          globalFailures += 1;

          if (globalFailures >= GLOBAL_PAIRING_MAX_FAILURES) {
            // Distributed brute-force defense: rotate the PIN immediately,
            // wiping out all accumulated attacker progress across the keyspace.
            pairingCode = padStart(String(secureRandomInt(10000)), 4, '0');
            pairingCodeCreatedAt = now;
            globalFailures = 0;
            try { onChange?.('setup-changed'); } catch { /* ignore */ }
            sendJson(req, res, 429, {
              error: 'Too many pairing attempts',
              retryAfter: Math.ceil(PAIRING_LOCK_MS / 1000),
            });
            return;
          }

          let blockedUntil = 0;
          if (failures >= PAIRING_MAX_FAILURES) {
            const multiplier = Math.min(5, Math.pow(2, failures - PAIRING_MAX_FAILURES));
            blockedUntil = now + Math.min(300 * 1000, PAIRING_LOCK_MS * multiplier);
          }
          pairingAttempts[client] = { failures, blockedUntil };
          sendJson(req, res, blockedUntil ? 429 : 401, {
            error: blockedUntil ? 'Too many pairing attempts' : 'Invalid pairing code',
            retryAfter: blockedUntil ? Math.ceil((blockedUntil - now) / 1000) : undefined,
          });
          return;
        }

        delete pairingAttempts[client];
        globalFailures = 0;
        if (options?.rotateOnSuccess) {
          pairingCode = padStart(String(secureRandomInt(10000)), 4, '0');
          pairingCodeCreatedAt = now;
          try { onChange?.('setup-changed'); } catch { /* ignore */ }
        }
        sendJson(req, res, 200, { token: setupToken });
      } else if (pathname === '/setup-state' && req.method === 'PUT') {
        // Updating setup state requires appToken (local TV app authority)
        if (!isAppAuthorized(req, query)) {
          sendJson(req, res, 403, { error: 'Unauthorized: appToken required' });
          return;
        }
        try {
          setupState.set(parseSetupState(JSON.parse(await readBody(req, 64 * 1024))));
          sendJson(req, res, 200, { updated: true });
        } catch (e) {
          sendJson(req, res, 400, { error: e instanceof Error ? e.message : String(e) });
        }
      } else if (pathname === '/setup-state' && req.method === 'GET') {
        if (!isAuthorized(req, query)) {
          sendJson(req, res, 403, { error: 'Invalid setup token' });
          return;
        }
        sendJson(req, res, 200, setupState.get());
      } else if (pathname === '/setup-actions' && req.method === 'POST') {
        if (!isAuthorized(req, query)) {
          sendJson(req, res, 403, { error: 'Invalid setup token' });
          return;
        }
        try {
          const action = setupActions.add(parseSetupAction(JSON.parse(await readBody(req, 64 * 1024))));
          try { onChange?.('setup-changed'); } catch (cbErr) {
            console.error('[lan] onChange callback threw:', cbErr);
          }
          sendJson(req, res, 201, { id: action.id, type: action.type });
        } catch (e) {
          sendJson(req, res, 400, { error: e instanceof Error ? e.message : String(e) });
        }
      } else if (pathname === '/setup-actions' && req.method === 'GET') {
        // Polling pending actions to execute them requires appToken
        if (!isAppAuthorized(req, query)) {
          sendJson(req, res, 403, { error: 'Unauthorized: appToken required' });
          return;
        }
        sendJson(req, res, 200, setupActions.list());
      } else if (pathname.indexOf('/setup-actions/') === 0 && req.method === 'GET') {
        if (!isAuthorized(req, query)) {
          sendJson(req, res, 403, { error: 'Invalid setup token' });
          return;
        }
        const id = Number(pathname.slice('/setup-actions/'.length));
        const pending = isSafeInteger(id) &&
          setupActions.list().some(action => action.id === id);
        sendJson(req, res, 200, { id, pending });
      } else if (pathname.indexOf('/setup-actions/') === 0 && req.method === 'DELETE') {
        // Acknowledging action execution requires appToken
        if (!isAppAuthorized(req, query)) {
          sendJson(req, res, 403, { error: 'Unauthorized: appToken required' });
          return;
        }
        const id = Number(pathname.slice('/setup-actions/'.length));
        const deleted = isSafeInteger(id) && setupActions.remove(id);
        sendJson(req, res, deleted ? 200 : 404, { deleted, id });
      } else if (pathname === '/uploads' && req.method === 'GET') {
        // Listing uploads requires appToken or setupToken
        if (!isAuthorized(req, query)) {
          sendJson(req, res, 403, { error: 'Invalid setup token' });
          return;
        }
        const base = 'http://' + host;
        const qToken = query('token');
        const tokenQuery = qToken ? '?token=' + encodeURIComponent(qToken) : '';
        sendJson(req, res, 200, uploads.list().map((u) => ({
          ...u,
          url: base + '/uploads/' + encodeURIComponent(u.id) + '.m3u' + tokenQuery,
        })));
      } else if (pathname === '/uploads' && req.method === 'POST') {
        // Uploading an M3U file requires authorization (no loopback bypass)
        if (!isAuthorized(req, query)) {
          sendJson(req, res, 403, { error: 'Invalid setup token' });
          return;
        }
        const name = query('name') || 'Uploaded Playlist';
        try {
          const body = await readBody(req, 20 * 1024 * 1024);
          const meta = uploads.save(name, body);
          console.log('[upload] saved "' + meta.name + '" (' + meta.count + ' channels) as ' + meta.id + '.m3u');
          try { onChange?.('uploads-changed'); } catch (cbErr) { console.error('[lan] onChange callback threw:', cbErr); }
          sendJson(req, res, 200, meta);
        } catch (e) {
          sendJson(req, res, 400, { error: e instanceof Error ? e.message : String(e) });
        }
      } else if (pathname.indexOf('/uploads/') === 0) {
        // Extract id: strip leading '/uploads/' and optional trailing '.m3u'
        let id = pathname.slice('/uploads/'.length);
        if (id.slice(-4).toLowerCase() === '.m3u') id = id.slice(0, -4);
        try { id = decodeURIComponent(id); } catch { /* keep raw */ }

        if (!isValidUploadId(id)) {
          send(req, res, 400, 'text/plain; charset=utf-8', 'Invalid upload id');
          return;
        }

        if (req.method === 'DELETE') {
          // Deleting uploads requires authorization (no loopback bypass)
          if (!isAuthorized(req, query)) {
            sendJson(req, res, 403, { error: 'Invalid setup token' });
            return;
          }
          const ok = uploads.delete(id);
          if (ok) { try { onChange?.('uploads-changed'); } catch (cbErr) { console.error('[lan] onChange callback threw:', cbErr); } }
          sendJson(req, res, ok ? 200 : 404, { deleted: ok, id });
        } else {
          // Downloading M3U content requires authorization (no loopback bypass)
          if (!isAuthorized(req, query)) {
            sendJson(req, res, 403, { error: 'Invalid setup token' });
            return;
          }
          try {
            send(req, res, 200, 'audio/mpegurl; charset=utf-8', uploads.read(id));
          } catch {
            send(req, res, 404, 'text/plain; charset=utf-8', 'Upload not found: ' + id);
          }
        }
      } else {
        send(req, res, 404, 'text/plain; charset=utf-8',
          'Not found. Use /setup, /setup-actions, /uploads, or /info');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.indexOf('EPIPE') >= 0 || msg.indexOf('ECONNRESET') >= 0) return;
      try { send(req, res, 500, 'text/plain; charset=utf-8', 'Internal error: ' + msg); } catch { /* ignore */ }
    }
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handleRequest(req, res).catch(() => {
        try { res.writeHead(500); res.end('Internal Server Error'); } catch { /* ignore */ }
      });
    });
    const onError = (err: NodeJS.ErrnoException): void => {
      server.removeListener('listening', onListening);
      reject(err);
    };
    const onListening = (): void => {
      server.removeListener('error', onError);
      const addr = server.address();
      const actualPort = addr && typeof addr === 'object' ? addr.port : port;
      boundPort = actualPort;
      console.log('[lan] listening on http://0.0.0.0:' + actualPort);
      console.log('[lan] setup page: http://' + getLanIp() + ':' + actualPort + '/setup');
      // Permanent error handler so post-listen errors don't crash the process.
      server.on('error', (e) => console.error('[lan] server error:', e));
      resolve({
        server,
        port: actualPort,
        setupToken,
        appToken,
        get pairingCode() { return currentPairingCode(); },
      });
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '0.0.0.0');
  });
}
