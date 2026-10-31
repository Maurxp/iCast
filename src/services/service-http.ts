import { CONFIG } from '../config';

// The LAN service binds to an OS-assigned port at startup and reports it
// along with a private application authorization token through the Luna `start`
// response (see app.ts → startBundledService). Until setServicePort() receives
// that value, serviceBase() returns null and both LAN clients behave as if the
// service were unreachable.
let runtimePort: number | null = null;
let runtimeAppToken: string | null = null;

export function setServicePort(port: number | null, token: string | null = null): void {
  if (port === null) {
    runtimePort = null;
    runtimeAppToken = null;
    return;
  }
  if (typeof port === 'number' && port > 0 && port < 65536) {
    runtimePort = port;
    if (token) runtimeAppToken = token;
  }
}

export function setServiceAuth(token: string | null): void {
  runtimeAppToken = token;
}

export function serviceAuthToken(): string | null {
  return runtimeAppToken;
}

export function serviceAuthHeaders(): Record<string, string> {
  if (!runtimeAppToken) return {};
  return {
    'Authorization': `Bearer ${runtimeAppToken}`,
    'X-App-Token': runtimeAppToken,
  };
}

export function serviceRequestOptions(extra: Record<string, unknown> = {}): Record<string, unknown> {
  if (!runtimeAppToken) return extra;
  const extraHeaders = (extra.headers as Record<string, string> | undefined) || {};
  return {
    ...extra,
    headers: {
      ...extraHeaders,
      'Authorization': `Bearer ${runtimeAppToken}`,
      'X-App-Token': runtimeAppToken,
    },
  };
}

export function serviceBase(): string | null {
  if (runtimePort === null) return null;
  return `http://${CONFIG.SERVICE_HOST}:${runtimePort}`;
}
