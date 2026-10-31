/**
 * Tests for the shared LAN service HTTP routes. Each test gets its own
 * tempdir and a server bound to a random port.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type * as http from 'http';
import { startServer } from './server';

let server: http.Server;
let baseUrl: string;
let setupUrl: string;
let setupToken: string;
let appToken: string;
let pairingCode: string;
let dataDir: string;

const VALID_M3U = [
  '#EXTM3U url-tvg="http://epg.example.com/guide.xml"',
  '#EXTINF:-1 tvg-id="chan1" group-title="News",Channel One',
  'http://streams.example.com/one.m3u8',
  '#EXTINF:-1 tvg-id="chan2" group-title="News",Channel Two',
  'http://streams.example.com/two.m3u8',
  '#EXTINF:-1 tvg-id="chan3" group-title="Movies",Channel Three',
  'http://streams.example.com/three.m3u8',
].join('\n');

async function postUpload(name: string, body: string): Promise<Response> {
  return fetch(`${baseUrl}/uploads?name=${encodeURIComponent(name)}&token=${setupToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body,
  });
}

beforeAll(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-svc-test-'));
  const result = await startServer(0, dataDir);
  server = result.server;
  baseUrl = `http://127.0.0.1:${result.port}`;
  setupToken = result.setupToken;
  appToken = result.appToken;
  pairingCode = result.pairingCode;
  setupUrl = `${baseUrl}/setup?token=${setupToken}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  fs.rmSync(dataDir, { recursive: true, force: true });
});

beforeEach(async () => {
  for (const f of fs.readdirSync(dataDir)) fs.rmSync(path.join(dataDir, f));
  const actionsRes = await fetch(`${baseUrl}/setup-actions`, {
    headers: { Authorization: `Bearer ${appToken}` },
  });
  if (actionsRes.status === 200) {
    const actions = (await actionsRes.json()) as Array<{ id: number }>;
    for (const action of actions) {
      await fetch(`${baseUrl}/setup-actions/${action.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${appToken}` },
      });
    }
  }
});

describe('GET /info', () => {
  it('rejects unauthenticated requests even from loopback with 403', async () => {
    const res = await fetch(`${baseUrl}/info`);
    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/Unauthorized/i);
  });

  it('rejects requests authorized only with setupToken with 403', async () => {
    const res = await fetch(`${baseUrl}/info?token=${setupToken}`);
    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/Unauthorized/i);
  });

  it('returns the service ip/port and setup page URL when authorized with appToken', async () => {
    const res = await fetch(`${baseUrl}/info`, {
      headers: { Authorization: `Bearer ${appToken}` },
    });
    expect(res.status).toBe(200);
    const info = (await res.json()) as {
      ip: string;
      port: number;
      setupUrl: string;
      manualUrl: string;
      pairingCode: string;
    };
    expect(info.ip).toBeTruthy();
    expect(info.port).toBeGreaterThan(0);
    expect(info.setupUrl).toMatch(/^http:\/\/.+:\d+\/setup\?token=[a-f0-9]{12}$/);
    expect(info.manualUrl).toMatch(/^http:\/\/.+:\d+$/);
    expect(info.pairingCode).toMatch(/^\d{4}$/);
    expect((info as Record<string, unknown>).appToken).toBeUndefined();
  });

  it('accepts appToken via X-App-Token header or query param', async () => {
    const resHeader = await fetch(`${baseUrl}/info`, {
      headers: { 'X-App-Token': appToken },
    });
    expect(resHeader.status).toBe(200);

    const resQuery = await fetch(`${baseUrl}/info?token=${appToken}`);
    expect(resQuery.status).toBe(200);
  });
});

describe('GET /setup', () => {
  it('serves the setup page HTML', async () => {
    const res = await fetch(setupUrl);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    const body = await res.text();
    expect(body).toMatch(/^<!DOCTYPE html>/);
    expect(body).toContain('Set up IPTV');
    expect(body).toContain('var MESSAGES = {');
    expect(body).toContain('title: "Set up IPTV"');
    expect(body).toContain('title: "设置 IPTV"');
    expect(body).toContain('data-message="setupSources"');
    expect(body).toContain('setupSources: "设置节目源"');
    expect(body).toContain('uploadM3uFiles: "上传 M3U 文件"');
    expect(body).toContain('success: "Successfully uploaded"');
    expect(body).toContain('navigator.languages');
    expect(body).toContain('navigator.language');
  });

  it('serves the pairing page without a setup token', async () => {
    const res = await fetch(`${baseUrl}/setup`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('id="pair-form"');
  });

  it('serves the same pairing page at the short root URL', async () => {
    const res = await fetch(baseUrl);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('id="pair-form"');
  });

  it('does not serve the retired upload page route', async () => {
    const res = await fetch(`${baseUrl}/upload`);
    expect(res.status).toBe(404);
  });
});

describe('POST /pair', () => {
  function pair(code: string): Promise<Response> {
    return fetch(`${baseUrl}/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  }

  it('exchanges the four-digit pairing code for the setup token', async () => {
    expect((await pair('99999')).status).toBe(401);
    const res = await pair(pairingCode);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: setupToken });
  });

  it('resets failures after an expired lockout', async () => {
    const now = Date.now();
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        expect((await pair('99999')).status).toBe(401);
      }
      expect((await pair('99999')).status).toBe(429);
      nowSpy.mockReturnValue(now + 60_001);
      expect((await pair('99999')).status).toBe(401);
      expect((await pair(pairingCode)).status).toBe(200);
    } finally {
      nowSpy.mockRestore();
    }
  });
});

describe('setup state', () => {
  const state = {
    playlists: [{ id: 'p1', name: 'Alpha', url: 'http://host/a.m3u' }],
    xtreamAccounts: [{
      id: 'x1',
      name: 'host',
      serverUrl: 'http://host',
      username: 'u1',
    }],
    uploadedPlaylists: [{ id: 'u1', uploadId: 'upload-1', enabled: false }],
    manualEpgSources: [
      { url: 'http://host/epg.xml', playlistIds: ['p1'] },
      { url: 'http://host/epg-2.xml', playlistIds: [] },
    ],
    onlineSubtitles: {
      preferredLanguage: '',
      subdlConfigured: true,
      assrtConfigured: false,
      opensubtitlesConfigured: true,
      opensubtitlesApiKeyConfigured: true,
      opensubtitlesPasswordConfigured: true,
      opensubtitlesUsername: 'u2',
    },
  };

  it('accepts app-authorized snapshot and returns it only with valid token', async () => {
    // Unauthenticated PUT is rejected
    const unauthPut = await fetch(`${baseUrl}/setup-state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    expect(unauthPut.status).toBe(403);

    // Authorized PUT with appToken succeeds
    const put = await fetch(`${baseUrl}/setup-state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${appToken}` },
      body: JSON.stringify(state),
    });
    expect(put.status).toBe(200);

    // Unauthenticated GET is rejected
    expect((await fetch(`${baseUrl}/setup-state`)).status).toBe(403);

    // GET with setupToken succeeds
    const get = await fetch(`${baseUrl}/setup-state?token=${setupToken}`);
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual(state);
  });

  it('strips credential fields from snapshots', async () => {
    const put = await fetch(`${baseUrl}/setup-state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${appToken}` },
      body: JSON.stringify({
        ...state,
        xtreamAccounts: [{ ...state.xtreamAccounts[0], password: 'p1' }],
        onlineSubtitles: {
          ...state.onlineSubtitles,
          subdlApiKey: 'k1',
          opensubtitlesPassword: 'p1',
        },
      }),
    });
    expect(put.status).toBe(200);
    const saved = await (await fetch(`${baseUrl}/setup-state?token=${setupToken}`)).json();
    expect(saved).not.toHaveProperty('xtreamAccounts.0.password');
    expect(saved).not.toHaveProperty('onlineSubtitles.subdlApiKey');
    expect(saved).not.toHaveProperty('onlineSubtitles.opensubtitlesPassword');
  });

  it('rejects duplicate program guide URLs in setup snapshots', async () => {
    const put = await fetch(`${baseUrl}/setup-state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${appToken}` },
      body: JSON.stringify({
        ...state,
        manualEpgSources: [
          { url: 'http://host/epg.xml', playlistIds: ['p1'] },
          { url: 'http://host/epg.xml', playlistIds: ['x1'] },
        ],
      }),
    });
    expect(put.status).toBe(400);
  });
});

describe('setup actions', () => {
  async function postAction(payload: unknown, url = setupUrl): Promise<Response> {
    const token = new URL(url).search;
    return fetch(`${baseUrl}/setup-actions${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  it('queues source additions and removal for the local TV client', async () => {
    expect((await postAction({
      type: 'playlist', name: 'Alpha', url: 'http://host/a.m3u',
    })).status).toBe(201);
    expect((await postAction({
      type: 'xtream', serverUrl: 'http://host', username: 'u1', password: 'p1',
    })).status).toBe(201);
    expect((await postAction({
      type: 'manual-epg-sources',
      sources: [
        { url: 'http://host/epg.xml', playlistIds: ['p1'] },
        { url: 'http://host/epg-2.xml', playlistIds: [] },
      ],
    })).status).toBe(201);
    expect((await postAction({
      type: 'remove-source', sourceId: 'x1',
    })).status).toBe(201);
    expect((await postAction({
      type: 'set-source-enabled', sourceId: 'u1', enabled: false,
    })).status).toBe(201);
    expect((await postAction({
      type: 'online-subtitles',
      preferredLanguage: '',
      subdlApiKey: 'k1',
      opensubtitles: { apiKey: 'k2', username: 'u2', password: 'p2' },
    })).status).toBe(201);

    const actions = await (await fetch(`${baseUrl}/setup-actions`, {
      headers: { Authorization: `Bearer ${appToken}` },
    })).json();
    expect(actions).toEqual([
      { id: expect.any(Number), type: 'playlist', name: 'Alpha', url: 'http://host/a.m3u' },
      {
        id: expect.any(Number),
        type: 'xtream',
        serverUrl: 'http://host',
        username: 'u1',
        password: 'p1',
      },
      {
        id: expect.any(Number),
        type: 'manual-epg-sources',
        sources: [
          { url: 'http://host/epg.xml', playlistIds: ['p1'] },
          { url: 'http://host/epg-2.xml', playlistIds: [] },
        ],
      },
      { id: expect.any(Number), type: 'remove-source', sourceId: 'x1' },
      {
        id: expect.any(Number),
        type: 'set-source-enabled',
        sourceId: 'u1',
        enabled: false,
      },
      {
        id: expect.any(Number),
        type: 'online-subtitles',
        preferredLanguage: '',
        subdlApiKey: 'k1',
        opensubtitles: { apiKey: 'k2', username: 'u2', password: 'p2' },
      },
    ]);
  });

  it('rejects setup mutations without the QR token', async () => {
    const res = await fetch(`${baseUrl}/setup-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'manual-epg-sources',
        sources: [{ url: 'http://host/epg.xml', playlistIds: [] }],
      }),
    });
    expect(res.status).toBe(403);
    expect(await (await fetch(`${baseUrl}/setup-actions`, {
      headers: { Authorization: `Bearer ${appToken}` },
    })).json()).toEqual([]);
  });

  it('validates setup action fields and URL protocols', async () => {
    expect((await postAction({
      type: 'xtream', serverUrl: 'file:///tmp/a', username: 'u1', password: 'p1',
    })).status).toBe(400);
    expect((await postAction({
      type: 'playlist', name: 'Alpha', url: '',
    })).status).toBe(400);
    expect((await postAction({
      type: 'online-subtitles',
      preferredLanguage: 'invalid',
    })).status).toBe(400);
    expect((await postAction({
      type: 'online-subtitles',
      preferredLanguage: '',
      opensubtitles: {},
    })).status).toBe(400);
    expect((await postAction({
      type: 'set-source-enabled',
      sourceId: 'u1',
      enabled: 'false',
    })).status).toBe(400);
    expect((await postAction({
      type: 'manual-epg-sources',
      sources: [
        { url: 'http://host/epg.xml', playlistIds: ['p1'] },
        { url: 'http://host/epg.xml', playlistIds: ['x1'] },
      ],
    })).status).toBe(400);
  });

  it('acknowledges and removes a consumed action', async () => {
    const created = await postAction({
      type: 'manual-epg-sources',
      sources: [{ url: 'http://host/epg.xml', playlistIds: [] }],
    });
    const { id } = (await created.json()) as { id: number };
    const token = new URL(setupUrl).search;
    expect(await (await fetch(`${baseUrl}/setup-actions/${id}${token}`)).json())
      .toEqual({ id, pending: true });
    const removed = await fetch(`${baseUrl}/setup-actions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${appToken}` },
    });
    expect(removed.status).toBe(200);
    expect(await (await fetch(`${baseUrl}/setup-actions/${id}${token}`)).json())
      .toEqual({ id, pending: false });
    expect(await (await fetch(`${baseUrl}/setup-actions`, {
      headers: { Authorization: `Bearer ${appToken}` },
    })).json()).toEqual([]);
  });
});

describe('GET /uploads (empty)', () => {
  it('rejects GET /uploads without token even on loopback with 403', async () => {
    const res = await fetch(`${baseUrl}/uploads`);
    expect(res.status).toBe(403);
  });

  it('returns an empty JSON array when authorized with setupToken or appToken', async () => {
    const resSetup = await fetch(`${baseUrl}/uploads?token=${setupToken}`);
    expect(resSetup.status).toBe(200);
    expect(await resSetup.json()).toEqual([]);

    const resApp = await fetch(`${baseUrl}/uploads`, {
      headers: { Authorization: `Bearer ${appToken}` },
    });
    expect(resApp.status).toBe(200);
    expect(await resApp.json()).toEqual([]);
  });
});

describe('POST /uploads', () => {
  it('rejects an upload without the setup token', async () => {
    const res = await fetch(`${baseUrl}/uploads?name=list.m3u`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: VALID_M3U,
    });
    expect(res.status).toBe(403);
    expect(fs.readdirSync(dataDir)).toHaveLength(0);
  });

  it('saves a valid M3U and returns metadata + counted channels', async () => {
    const res = await postUpload('my-list.m3u', VALID_M3U);
    expect(res.status).toBe(200);
    const meta = (await res.json()) as { id: string; name: string; count: number };
    expect(meta.id).toBe('my-list');
    expect(meta.name).toBe('my-list');
    expect(meta.count).toBe(3);
    expect(fs.existsSync(path.join(dataDir, 'my-list.m3u'))).toBe(true);
    expect(fs.existsSync(path.join(dataDir, 'my-list.json'))).toBe(true);
  });

  it('rejects content that is not an M3U with HTTP 400', async () => {
    const res = await postUpload('garbage.m3u', 'plain text, no EXTM3U or EXTINF here');
    expect(res.status).toBe(400);
    const err = (await res.json()) as { error: string };
    expect(err.error).toMatch(/M3U/i);
    expect(fs.readdirSync(dataDir)).toHaveLength(0);
  });

  it('re-uploading with the same name overwrites the previous file', async () => {
    await postUpload('list.m3u', VALID_M3U);
    const shorter = '#EXTM3U\n#EXTINF:-1,Only\nhttp://x/y.m3u8';
    const res = await postUpload('list.m3u', shorter);
    expect(res.status).toBe(200);
    const meta = (await res.json()) as { count: number };
    expect(meta.count).toBe(1);
    expect(fs.readdirSync(dataDir).filter((f) => f.endsWith('.m3u'))).toEqual(['list.m3u']);
  });

  it('sanitizes filenames containing spaces and uppercase characters', async () => {
    const res = await postUpload('My Phone List.m3u', VALID_M3U);
    expect(res.status).toBe(200);
    const meta = (await res.json()) as { id: string; name: string };
    expect(meta.id).toBe('my-phone-list');
    expect(meta.name).toBe('My Phone List');
  });

  it('keeps path-traversal attempts confined to DATA_DIR (id is slugified)', async () => {
    const res = await postUpload('../../etc/evil.m3u', VALID_M3U);
    expect(res.status).toBe(200);
    const meta = (await res.json()) as { id: string };
    expect(meta.id).not.toContain('/');
    const files = fs.readdirSync(dataDir);
    expect(files.every((f) => path.resolve(dataDir, f).startsWith(dataDir))).toBe(true);
    expect(fs.existsSync('/etc/evil.m3u')).toBe(false);
  });
});

describe('GET /uploads (populated)', () => {
  it('lists every saved upload with a serve-back URL including token', async () => {
    await postUpload('one.m3u', VALID_M3U);
    await postUpload('two.m3u', '#EXTM3U\n#EXTINF:-1,A\nhttp://x/a.m3u8');
    const res = await fetch(`${baseUrl}/uploads?token=${setupToken}`);
    const items = (await res.json()) as Array<{ id: string; url: string; count: number }>;
    expect(items.map((i) => i.id).sort()).toEqual(['one', 'two']);
    for (const it of items) {
      expect(it.url).toMatch(new RegExp(`^${baseUrl}/uploads/${it.id}\\.m3u\\?token=${setupToken}$`));
    }
  });
});

describe('GET /uploads/:id.m3u', () => {
  it('rejects requests without token with 403', async () => {
    await postUpload('mine.m3u', VALID_M3U);
    const unauth = await fetch(`${baseUrl}/uploads/mine.m3u`);
    expect(unauth.status).toBe(403);
  });

  it('serves the original M3U bytes with audio/mpegurl content type when authorized', async () => {
    await postUpload('mine.m3u', VALID_M3U);
    const res = await fetch(`${baseUrl}/uploads/mine.m3u?token=${setupToken}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/audio\/mpegurl/);
    expect(await res.text()).toBe(VALID_M3U);
  });

  it('returns 404 when the upload does not exist', async () => {
    const res = await fetch(`${baseUrl}/uploads/missing.m3u?token=${setupToken}`);
    expect(res.status).toBe(404);
  });

  it('rejects encoded path traversal outside the upload directory', async () => {
    const outside = path.join(path.dirname(dataDir), 'outside.m3u');
    fs.writeFileSync(outside, VALID_M3U);
    try {
      const res = await fetch(`${baseUrl}/uploads/..%2Foutside.m3u?token=${setupToken}`);
      expect(res.status).toBe(400);
      expect(fs.readFileSync(outside, 'utf-8')).toBe(VALID_M3U);
    } finally {
      fs.unlinkSync(outside);
    }
  });
});

describe('DELETE /uploads/:id', () => {
  it('rejects DELETE without token with 403', async () => {
    await postUpload('gone.m3u', VALID_M3U);
    const unauth = await fetch(`${baseUrl}/uploads/gone`, { method: 'DELETE' });
    expect(unauth.status).toBe(403);
    expect(fs.existsSync(path.join(dataDir, 'gone.m3u'))).toBe(true);
  });

  it('removes both the .m3u and .json files when authorized', async () => {
    await postUpload('gone.m3u', VALID_M3U);
    expect(fs.existsSync(path.join(dataDir, 'gone.m3u'))).toBe(true);
    const res = await fetch(`${baseUrl}/uploads/gone?token=${setupToken}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true, id: 'gone' });
    expect(fs.existsSync(path.join(dataDir, 'gone.m3u'))).toBe(false);
    expect(fs.existsSync(path.join(dataDir, 'gone.json'))).toBe(false);
  });

  it('returns 404 for an id that has no upload', async () => {
    const res = await fetch(`${baseUrl}/uploads/does-not-exist?token=${setupToken}`, { method: 'DELETE' });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ deleted: false, id: 'does-not-exist' });
  });

  it('rejects encoded path traversal without deleting external files', async () => {
    const outside = path.join(path.dirname(dataDir), 'outside.m3u');
    fs.writeFileSync(outside, VALID_M3U);
    try {
      const res = await fetch(`${baseUrl}/uploads/..%2Foutside?token=${setupToken}`, { method: 'DELETE' });
      expect(res.status).toBe(400);
      expect(fs.existsSync(outside)).toBe(true);
    } finally {
      fs.unlinkSync(outside);
    }
  });
});

describe('unknown routes', () => {
  it('returns 404 with a hint for any unknown path', async () => {
    const res = await fetch(`${baseUrl}/no-such-path`);
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('Not found');
  });
});

describe('startServer onChange callback (Luna push fan-out source)', () => {
  it('fires onChange after a successful POST /uploads', async () => {
    const onChange = vi.fn();
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-svc-cb-'));
    const { server: s, port, setupToken: token } = await startServer(0, localDir, onChange);
    try {
      const res = await fetch(
        `http://127.0.0.1:${port}/uploads?name=on-change.m3u&token=${token}`, {
        method: 'POST', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: VALID_M3U,
      });

      expect(res.status).toBe(200);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('uploads-changed');
    } finally {
      await new Promise<void>((resolve) => s.close(() => resolve()));
      fs.rmSync(localDir, { recursive: true, force: true });
    }
  });

  it('fires a setup change after an authenticated source submission', async () => {
    const onChange = vi.fn();
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-svc-cb-'));
    const { server: s, port, setupToken: token } = await startServer(0, localDir, onChange);
    const localBase = `http://127.0.0.1:${port}`;
    try {
      const res = await fetch(`${localBase}/setup-actions?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'manual-epg-sources',
          sources: [{ url: 'http://host/epg.xml', playlistIds: [] }],
        }),
      });
      expect(res.status).toBe(201);
      expect(onChange).toHaveBeenCalledWith('setup-changed');
    } finally {
      await new Promise<void>((resolve) => s.close(() => resolve()));
      fs.rmSync(localDir, { recursive: true, force: true });
    }
  });

  it('does NOT fire onChange when POST /uploads is rejected as invalid M3U', async () => {
    const onChange = vi.fn();
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-svc-cb-'));
    const { server: s, port, setupToken: token } = await startServer(0, localDir, onChange);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/uploads?name=bad.m3u&token=${token}`, {
        method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'no m3u header here',
      });
      expect(res.status).toBe(400);
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve) => s.close(() => resolve()));
      fs.rmSync(localDir, { recursive: true, force: true });
    }
  });

  it('fires onChange after a successful DELETE /uploads/:id (file existed)', async () => {
    const onChange = vi.fn();
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-svc-cb-'));
    const { server: s, port, setupToken: token } = await startServer(0, localDir, onChange);
    try {
      await fetch(`http://127.0.0.1:${port}/uploads?name=to-delete.m3u&token=${token}`, {
        method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: VALID_M3U,
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      const del = await fetch(`http://127.0.0.1:${port}/uploads/to-delete?token=${token}`, { method: 'DELETE' });
      expect(del.status).toBe(200);
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenLastCalledWith('uploads-changed');
    } finally {
      await new Promise<void>((resolve) => s.close(() => resolve()));
      fs.rmSync(localDir, { recursive: true, force: true });
    }
  });

  it('does NOT fire onChange when DELETE targets a missing id (404, nothing changed)', async () => {
    const onChange = vi.fn();
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-svc-cb-'));
    const { server: s, port, setupToken: token } = await startServer(0, localDir, onChange);
    try {
      const del = await fetch(`http://127.0.0.1:${port}/uploads/does-not-exist?token=${token}`, { method: 'DELETE' });
      expect(del.status).toBe(404);
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve) => s.close(() => resolve()));
      fs.rmSync(localDir, { recursive: true, force: true });
    }
  });

  it('startServer works without an onChange callback (callback is optional)', async () => {
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-svc-cb-'));
    const { server: s, port, setupToken: token } = await startServer(0, localDir);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/uploads?name=no-cb.m3u&token=${token}`, {
        method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: VALID_M3U,
      });
      expect(res.status).toBe(200);
    } finally {
      await new Promise<void>((resolve) => s.close(() => resolve()));
      fs.rmSync(localDir, { recursive: true, force: true });
    }
  });

  it('a throwing onChange does not break the response (POST still returns 200)', async () => {
    const onChange = vi.fn(() => { throw new Error('boom'); });
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-svc-cb-'));
    const { server: s, port, setupToken: token } = await startServer(0, localDir, onChange);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/uploads?name=throws.m3u&token=${token}`, {
        method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: VALID_M3U,
      });
      expect(res.status).toBe(200);
      expect(onChange).toHaveBeenCalledTimes(1);
    } finally {
      await new Promise<void>((resolve) => s.close(() => resolve()));
      fs.rmSync(localDir, { recursive: true, force: true });
    }
  });
});

describe('Loopback Protection against Hostile Web Pages (Frente A)', () => {
  let secDir: string;
  let s: http.Server;
  let port: number;
  let secSetupToken: string;
  let secAppToken: string;

  beforeAll(async () => {
    secDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hostile-loopback-'));
    const res = await startServer(0, secDir);
    s = res.server;
    port = res.port;
    secSetupToken = res.setupToken;
    secAppToken = res.appToken;

    // Seed one upload using valid token
    await fetch(`http://127.0.0.1:${port}/uploads?name=test-upload.m3u&token=${secSetupToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: VALID_M3U,
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => s.close(() => resolve()));
    fs.rmSync(secDir, { recursive: true, force: true });
  });

  it('strictly blocks unauthenticated loopback requests to /info', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/info`);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('appToken required');
  });

  it('strictly blocks loopback requests to /info with invalid token or setupToken', async () => {
    const resWrong = await fetch(`http://127.0.0.1:${port}/info?token=attacker-fake-token`);
    expect(resWrong.status).toBe(403);

    const resSetup = await fetch(`http://127.0.0.1:${port}/info?token=${secSetupToken}`);
    expect(resSetup.status).toBe(403);
  });

  it('allows loopback requests to /info with valid appToken (Luna IPC boundary)', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/info`, {
      headers: { Authorization: `Bearer ${secAppToken}` },
    });
    expect(res.status).toBe(200);
    const info = (await res.json()) as { ip: string; port: number; pairingCode: string };
    expect(info.port).toBe(port);
  });

  it('strictly blocks unauthenticated loopback requests to /uploads list', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/uploads`);
    expect(res.status).toBe(403);
  });

  it('strictly blocks unauthenticated loopback requests to /uploads/:id.m3u content', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/uploads/test-upload.m3u`);
    expect(res.status).toBe(403);
  });

  it('strictly blocks unauthenticated loopback requests to DELETE /uploads/:id', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/uploads/test-upload`, { method: 'DELETE' });
    expect(res.status).toBe(403);
  });

  it('strictly blocks unauthenticated loopback requests to /setup-actions', async () => {
    const resGet = await fetch(`http://127.0.0.1:${port}/setup-actions`);
    expect(resGet.status).toBe(403);

    const resPost = await fetch(`http://127.0.0.1:${port}/setup-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'remove-source', sourceId: 'any' }),
    });
    expect(resPost.status).toBe(403);
  });

  it('strictly blocks unauthenticated loopback requests to /setup-state', async () => {
    const resGet = await fetch(`http://127.0.0.1:${port}/setup-state`);
    expect(resGet.status).toBe(403);

    const resPut = await fetch(`http://127.0.0.1:${port}/setup-state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlists: [] }),
    });
    expect(resPut.status).toBe(403);
  });

  it('allows access to uploads with appToken (TV app) or setupToken (phone)', async () => {
    const resApp = await fetch(`http://127.0.0.1:${port}/uploads`, {
      headers: { Authorization: `Bearer ${secAppToken}` },
    });
    expect(resApp.status).toBe(200);

    const resPhone = await fetch(`http://127.0.0.1:${port}/uploads?token=${secSetupToken}`);
    expect(resPhone.status).toBe(200);
  });
});

describe('Strict RFC 1918 CORS Validation (Frente B)', () => {
  let corsDir: string;
  let s: http.Server;
  let port: number;
  let token: string;

  beforeAll(async () => {
    corsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cors-test-'));
    const res = await startServer(0, corsDir);
    s = res.server;
    port = res.port;
    token = res.setupToken;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => s.close(() => resolve()));
    fs.rmSync(corsDir, { recursive: true, force: true });
  });

  const validOrigins = [
    'http://192.168.1.50:8080',
    'http://192.168.0.1',
    'http://192.168.254.254:3000',
    'http://10.0.0.1:3000',
    'http://10.255.255.255',
    'http://172.16.0.1',
    'http://172.24.10.20:8000',
    'http://172.31.255.254:9000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1',
    'http://localhost:3000',
    'http://localhost',
    'http://[::1]:8080',
    'file://',
  ];

  for (const origin of validOrigins) {
    it(`allows valid private/loopback origin: ${origin}`, async () => {
      const res = await fetch(`http://127.0.0.1:${port}/setup`, {
        headers: { Origin: origin },
      });
      expect(res.headers.get('access-control-allow-origin')).toBe(origin);
    });
  }

  const disallowedOrigins = [
    // Substring / prefix mimics (attacker domains attempting to fool prefix checks)
    'http://192.168.attacker.com',
    'http://192.168.1.attacker.com:8080',
    'http://10.attacker.com',
    'http://10.0.0.1.attacker.com',
    'http://172.16.0.1.attacker.com',
    'http://127.0.0.1.attacker.com',
    'http://localhost.attacker.com',
    // Public / non-RFC 1918 IPv4
    'http://8.8.8.8',
    'http://1.1.1.1:8080',
    'http://172.15.255.255', // Just below 172.16.0.0/12
    'http://172.32.0.1',     // Just above 172.31.255.255
    'http://192.169.1.1',     // Just outside 192.168.0.0/16
    'http://11.0.0.1',        // Outside 10.0.0.0/8
    'http://9.255.255.255',   // Outside 10.0.0.0/8
    // Arbitrary external web origins
    'https://evil-attacker-site.com',
    'https://google.com',
    'http://phishing.site:8080',
    // Null origin
    'null',
  ];

  for (const origin of disallowedOrigins) {
    it(`rejects disallowed origin: ${origin}`, async () => {
      const res = await fetch(`http://127.0.0.1:${port}/setup`, {
        headers: { Origin: origin },
      });
      // Origin must NOT be echoed and wildcard '*' must NEVER be returned
      const acao = res.headers.get('access-control-allow-origin');
      expect(acao).toBeNull();
    });
  }

  it('omits Access-Control-Allow-Origin when Origin header is absent', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/setup`);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('handles OPTIONS preflight for approved origin: 204 No Content with CORS headers', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/uploads`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://192.168.1.100:8080',
        'Access-Control-Request-Method': 'POST',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://192.168.1.100:8080');
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
    expect(res.headers.get('access-control-allow-headers')).toBe('Content-Type, Authorization, X-App-Token, X-Setup-Token');
  });

  it('handles OPTIONS preflight for disallowed origin: 403 Forbidden without CORS allow header', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/uploads`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://192.168.attacker.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    expect(res.status).toBe(403);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('Pairing Security & Hardening (Misión 1B.2 Frente D & E)', () => {
  let customDir: string;

  beforeEach(() => {
    customDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pairing-sec-test-'));
  });

  it('rotates pairing code immediately on successful pairing when rotateOnSuccess is true', async () => {
    const s = await startServer(0, customDir, undefined, undefined, undefined, { rotateOnSuccess: true });
    try {
      const url = 'http://127.0.0.1:' + s.port;
      const code1 = s.pairingCode;
      const res1 = await fetch(url + '/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code1 }),
      });
      expect(res1.status).toBe(200);
      const code2 = s.pairingCode;
      expect(code2).toHaveLength(4);
      const resOld = await fetch(url + '/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code1 }),
      });
      if (code1 !== code2) {
        expect(resOld.status).toBe(401);
      }
    } finally {
      await new Promise((resolve) => s.server.close(() => resolve()));
    }
  });

  it('triggers global lockout and rotates pairing code after 20 network-wide failures', async () => {
    let notified = false;
    const s = await startServer(0, customDir, (event) => {
      if (event === 'setup-changed') notified = true;
    }, undefined, undefined, {
      getClientAddress: (req) => (req.headers['x-client-ip'] as string) || req.socket.remoteAddress || 'unknown',
    });
    try {
      const url = 'http://127.0.0.1:' + s.port;
      for (let i = 0; i < 19; i++) {
        const res = await fetch(url + '/pair', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-ip': `10.0.0.${i + 1}`,
          },
          body: JSON.stringify({ code: 'wrong' }),
        });
        expect([401, 429]).toContain(res.status);
      }
      expect(notified).toBe(false);

      const res20 = await fetch(url + '/pair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-ip': '10.0.0.20',
        },
        body: JSON.stringify({ code: 'wrong' }),
      });
      expect(res20.status).toBe(429);
      const json = await res20.json();
      expect(json.error).toMatch(/too many pairing attempts/i);
      expect(json.retryAfter).toBeGreaterThan(0);
      expect(notified).toBe(true);
    } finally {
      await new Promise((resolve) => s.server.close(() => resolve()));
    }
  });

  it('a blocked client hammering /pair does NOT increment global failures or rotate PIN (prevents DoS)', async () => {
    let notified = false;
    const s = await startServer(0, customDir, (event) => {
      if (event === 'setup-changed') notified = true;
    });
    try {
      const url = 'http://127.0.0.1:' + s.port;
      const initialCode = s.pairingCode;

      // Fail 5 times from this client -> client gets blocked
      for (let i = 0; i < 5; i++) {
        await fetch(url + '/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'wrong' }),
        });
      }

      // Now client is blocked (429). Hammer 20 more times while blocked.
      for (let i = 0; i < 20; i++) {
        const res = await fetch(url + '/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'wrong' }),
        });
        expect(res.status).toBe(429);
      }

      // Proves DoS immunity: Blocked requests did NOT trigger global PIN rotation
      expect(notified).toBe(false);
      expect(s.pairingCode).toBe(initialCode);
    } finally {
      await new Promise((resolve) => s.server.close(() => resolve()));
    }
  });

  it('expires pairing code after pairingTtlMs', async () => {
    const s = await startServer(0, customDir, undefined, undefined, undefined, { pairingTtlMs: 20 });
    try {
      const code1 = s.pairingCode;
      await new Promise((r) => setTimeout(r, 40));
      const code2 = s.pairingCode;
      expect(typeof code2).toBe('string');
      expect(code2).toHaveLength(4);
    } finally {
      await new Promise((resolve) => s.server.close(() => resolve()));
    }
  });
});
