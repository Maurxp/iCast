import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerLanService, isAuthorizedCaller, type LunaService, type LunaMsg } from './service';

class MockLunaService implements LunaService {
  handlers: Record<string, (msg: LunaMsg) => void> = {};
  activityManager = {
    create: vi.fn((_name: string, _cb: () => void) => {}),
    complete: vi.fn((_name: string, cb: () => void) => { cb(); }),
  };

  register(method: string, handler: (msg: LunaMsg) => void): void {
    this.handlers[method] = handler;
  }

  call(method: string, msg: Partial<LunaMsg>): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      const handler = this.handlers[method];
      if (!handler) {
        resolve({ returnValue: false, errorText: 'Method not registered: ' + method });
        return;
      }
      const fullMsg: LunaMsg = {
        respond: (r: unknown) => resolve(r as Record<string, unknown>),
        ...msg,
      };
      handler(fullMsg);
    });
  }
}

describe('Unit: isAuthorizedCaller policy verification (Misión 1C Fase B)', () => {
  it('allows message with legitimate applicationId', () => {
    expect(isAuthorizedCaller({ applicationId: 'com.lennylxx.iptv' })).toBe(true);
  });

  it('allows message with legitimate sender', () => {
    expect(isAuthorizedCaller({ sender: 'com.lennylxx.iptv' })).toBe(true);
  });

  it('allows message with legitimate callerId', () => {
    expect(isAuthorizedCaller({ callerId: 'com.lennylxx.iptv' })).toBe(true);
  });

  it('allows message with matching multiple claims', () => {
    expect(isAuthorizedCaller({
      applicationId: 'com.lennylxx.iptv',
      sender: 'com.lennylxx.iptv',
      callerId: 'com.lennylxx.iptv',
    })).toBe(true);
  });

  it('denies message with alien applicationId', () => {
    expect(isAuthorizedCaller({ applicationId: 'com.other.app' })).toBe(false);
  });

  it('denies message with absent identity claims (fail-closed)', () => {
    expect(isAuthorizedCaller({})).toBe(false);
  });

  it('denies message with empty string identity claims', () => {
    expect(isAuthorizedCaller({ applicationId: '', sender: '   ' })).toBe(false);
  });

  it('denies null or undefined or primitive messages', () => {
    expect(isAuthorizedCaller(null)).toBe(false);
    expect(isAuthorizedCaller(undefined)).toBe(false);
    expect(isAuthorizedCaller('com.lennylxx.iptv')).toBe(false);
    expect(isAuthorizedCaller(1234)).toBe(false);
  });

  it('denies contradictory claims (applicationId legitimate but sender is alien)', () => {
    expect(isAuthorizedCaller({
      applicationId: 'com.lennylxx.iptv',
      sender: 'com.malicious.service',
    })).toBe(false);
  });

  it('denies contradictory claims (applicationId legitimate but callerId is alien)', () => {
    expect(isAuthorizedCaller({
      applicationId: 'com.lennylxx.iptv',
      callerId: 'com.malicious.service',
    })).toBe(false);
  });

  it('denies client trying to spoof applicationId in payload body instead of LS2 metadata', () => {
    // Only top-level wrapper properties injected by LS2 are inspected; payload parameters are untrusted
    expect(isAuthorizedCaller({
      payload: { applicationId: 'com.lennylxx.iptv' },
    })).toBe(false);
  });

  it('denies prefix or suffix substring mimic attempts', () => {
    expect(isAuthorizedCaller({ applicationId: 'com.lennylxx.iptv.extra' })).toBe(false);
    expect(isAuthorizedCaller({ applicationId: 'fake.com.lennylxx.iptv' })).toBe(false);
  });
});

describe('Integration: Luna Service Security & Methods (Misión 1C Fase B)', () => {
  let tempDir: string;
  let service: MockLunaService;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'luna-test-'));
    service = new MockLunaService();
    registerLanService(service, tempDir);
    // Allow eager bind to settle
    await new Promise((r) => setTimeout(r, 100));
  });

  afterEach(async () => {
    // Teardown server if running
    if (service.handlers['stop']) {
      await service.call('stop', { applicationId: 'com.lennylxx.iptv' });
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('start method', () => {
    it('returns port and appToken to authorized caller com.lennylxx.iptv without setupToken or pairingCode', async () => {
      const res = await service.call('start', { applicationId: 'com.lennylxx.iptv' });
      expect(res.returnValue).toBe(true);
      expect(res.running).toBe(true);
      expect(typeof res.port).toBe('number');
      expect(typeof res.appToken).toBe('string');
      expect((res.appToken as string).length).toBeGreaterThan(0);

      // Secret hygiene: setupToken and pairingCode must NEVER be exposed over Luna start
      expect(res.setupToken).toBeUndefined();
      expect(res.pairingCode).toBeUndefined();
    });

    it('rejects unauthorized caller applicationId com.malicious.app', async () => {
      const res = await service.call('start', { applicationId: 'com.malicious.app' });
      expect(res.returnValue).toBe(false);
      expect(res.errorText).toBe('Unauthorized');
      expect(res.appToken).toBeUndefined();
    });

    it('rejects caller when applicationId is absent (strict fail-closed, no luna-send bypass)', async () => {
      const res = await service.call('start', {});
      expect(res.returnValue).toBe(false);
      expect(res.errorCode).toBe(-1);
      expect(res.errorText).toBe('Unauthorized');
      expect(res.appToken).toBeUndefined();
    });
  });

  describe('getInfo method', () => {
    it('returns only public operational info to authorized caller and zero secrets', async () => {
      const res = await service.call('getInfo', { applicationId: 'com.lennylxx.iptv' });
      expect(res.returnValue).toBe(true);
      expect(res.running).toBe(true);
      expect(typeof res.port).toBe('number');
      expect(typeof res.ip).toBe('string');
      expect(typeof res.manualUrl).toBe('string');

      // Zero-secrets policy for getInfo
      expect(res.appToken).toBeUndefined();
      expect(res.setupToken).toBeUndefined();
      expect(res.setupUrl).toBeUndefined();
      expect(res.pairingCode).toBeUndefined();
      expect(res.dataDir).toBeUndefined();
    });

    it('rejects unauthorized caller for getInfo', async () => {
      const res = await service.call('getInfo', { applicationId: 'com.other.app' });
      expect(res.returnValue).toBe(false);
      expect(res.errorText).toBe('Unauthorized');
      expect(res.port).toBeUndefined();
    });

    it('rejects absent caller identity for getInfo (fail-closed)', async () => {
      const res = await service.call('getInfo', {});
      expect(res.returnValue).toBe(false);
      expect(res.errorText).toBe('Unauthorized');
    });
  });

  describe('heartbeat method', () => {
    it('reports server running status and port only to authorized caller', async () => {
      const res = await service.call('heartbeat', { applicationId: 'com.lennylxx.iptv' });
      expect(res.returnValue).toBe(true);
      expect(res.running).toBe(true);
      expect(typeof res.port).toBe('number');
    });

    it('rejects unauthorized caller for heartbeat', async () => {
      const res = await service.call('heartbeat', { applicationId: 'com.snooping.app' });
      expect(res.returnValue).toBe(false);
      expect(res.errorText).toBe('Unauthorized');
      expect(res.port).toBeUndefined();
    });

    it('rejects heartbeat call with absent identity (fail-closed)', async () => {
      const res = await service.call('heartbeat', {});
      expect(res.returnValue).toBe(false);
      expect(res.errorText).toBe('Unauthorized');
    });
  });

  describe('stop and lifecycle', () => {
    it('rejects stop from unauthorized caller', async () => {
      const res = await service.call('stop', { applicationId: 'com.hostile.app' });
      expect(res.returnValue).toBe(false);
      expect(res.errorText).toBe('Unauthorized');
    });

    it('rejects stop from absent identity (fail-closed)', async () => {
      const res = await service.call('stop', {});
      expect(res.returnValue).toBe(false);
      expect(res.errorText).toBe('Unauthorized');
    });

    it('stops the server and drops subscribers when invoked by authorized caller', async () => {
      const res = await service.call('stop', { applicationId: 'com.lennylxx.iptv' });
      expect(res.returnValue).toBe(true);
      expect(res.stopped).toBe(true);

      const hb = await service.call('heartbeat', { applicationId: 'com.lennylxx.iptv' });
      expect(hb.returnValue).toBe(true);
      expect(hb.running).toBe(false);
      expect(hb.port).toBeNull();
    });
  });

  describe('serviceEvents subscription', () => {
    it('rejects serviceEvents subscription from unauthorized caller without storing subscriber', async () => {
      const res = await service.call('serviceEvents', {
        applicationId: 'com.untrusted.app',
        isSubscription: true,
      });
      expect(res.returnValue).toBe(false);
      expect(res.errorText).toBe('Unauthorized');
    });

    it('rejects serviceEvents subscription from absent identity', async () => {
      const res = await service.call('serviceEvents', {
        isSubscription: true,
      });
      expect(res.returnValue).toBe(false);
      expect(res.errorText).toBe('Unauthorized');
    });

    it('accepts serviceEvents subscription from authorized caller', async () => {
      const res = await service.call('serviceEvents', {
        applicationId: 'com.lennylxx.iptv',
        isSubscription: true,
      });
      expect(res.returnValue).toBe(true);
      expect(res.subscribed).toBe(true);
    });
  });

  describe('concurrency and repeated calls', () => {
    it('handles concurrent authorized calls correctly without state corruption', async () => {
      const calls = await Promise.all([
        service.call('start', { applicationId: 'com.lennylxx.iptv' }),
        service.call('getInfo', { applicationId: 'com.lennylxx.iptv' }),
        service.call('heartbeat', { applicationId: 'com.lennylxx.iptv' }),
      ]);
      expect(calls[0].returnValue).toBe(true);
      expect(calls[1].returnValue).toBe(true);
      expect(calls[2].returnValue).toBe(true);
      expect(calls[0].port).toBe(calls[1].port);
      expect(calls[1].port).toBe(calls[2].port);
    });
  });
});
