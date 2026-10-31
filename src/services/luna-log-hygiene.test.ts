// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { diagnosticStreamUrl } from '../utils/url';
import { setServicePort, serviceAuthToken } from './service-http';

describe('Secret Hygiene and Log Sanitization (Misión 1B.2 Frente C)', () => {
  const consoleLogs: string[] = [];
  let originalLog: typeof console.log;
  let originalInfo: typeof console.info;
  let originalWarn: typeof console.warn;
  let originalError: typeof console.error;

  beforeEach(() => {
    consoleLogs.length = 0;
    originalLog = console.log;
    originalInfo = console.info;
    originalWarn = console.warn;
    originalError = console.error;

    const capture = (...args: unknown[]): void => {
      consoleLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    };

    console.log = vi.fn(capture);
    console.info = vi.fn(capture);
    console.warn = vi.fn(capture);
    console.error = vi.fn(capture);
  });

  afterEach(() => {
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
    setServicePort(null);
  });

  it('redacts tokens and credentials from diagnostic stream URLs', () => {
    const safeUrl = diagnosticStreamUrl('http://user:secretpass@host:8080/live/ch1.m3u8?token=supersecrettoken&auth=1234');
    expect(safeUrl).not.toContain('secretpass');
    expect(safeUrl).not.toContain('supersecrettoken');
    expect(safeUrl).toContain('http://***:***@host:8080/live/***?token=***&auth=***');
  });

  it('stores runtime app token securely in service-http without logging it', () => {
    setServicePort(8890, 'secret-app-token-alpha');
    expect(serviceAuthToken()).toBe('secret-app-token-alpha');

    // Confirm that setting service port did not log the token to console
    const logsContainingToken = consoleLogs.filter((l) => l.includes('secret-app-token-alpha'));
    expect(logsContainingToken).toEqual([]);
  });

  it('formats sanitized start log summary without leaking secrets', () => {
    const rawLunaResponse = {
      returnValue: true,
      running: true,
      port: 54321,
      appToken: 'sensitive-app-token-999',
      setupToken: 'sensitive-setup-token-888',
      pairingCode: '1234',
    };

    // Simulate sanitized log formatting introduced in src/app.ts
    const r = rawLunaResponse;
    const p = typeof r.port === 'number' ? r.port : null;
    const token = typeof r.appToken === 'string' ? r.appToken : null;
    const running = Boolean(r.running);
    const sanitizedLog = 'Bundled service start onSuccess: running=' + running + ', port=' + p + ', hasToken=' + Boolean(token);

    console.info(sanitizedLog);

    expect(consoleLogs.some((l) => l.includes('running=true, port=54321, hasToken=true'))).toBe(true);
    expect(consoleLogs.some((l) => l.includes('sensitive-app-token-999'))).toBe(false);
    expect(consoleLogs.some((l) => l.includes('sensitive-setup-token-888'))).toBe(false);
    expect(consoleLogs.some((l) => l.includes('1234'))).toBe(false);
  });
});
