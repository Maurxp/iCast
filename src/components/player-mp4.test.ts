// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { healthMock, playlistMock } = vi.hoisted(() => ({
  healthMock: {
    recordPlaybackFailure: vi.fn().mockResolvedValue(undefined),
    recordPlaybackSuccess: vi.fn().mockResolvedValue(false),
  },
  playlistMock: {
    channels: [] as unknown[],
    getByIndex: vi.fn(),
    indexOf: vi.fn(),
    resolveChannelKey: vi.fn(),
    getByGroup: vi.fn(),
  },
}));

vi.mock('../services/playlist-service', () => ({ PlaylistService: playlistMock }));
vi.mock('../services/channel-health', () => ({ ChannelHealthService: healthMock }));
vi.mock('../services/epg-service', () => ({
  EpgService: { findChannelId: () => null, getNowPlaying: () => null, getUpcoming: () => [] },
}));
vi.mock('../services/storage-service', () => ({
  StorageService: {
    setLastChannel: vi.fn(),
    setLastChannelKey: vi.fn(),
    getSubtitlePref: vi.fn(),
    setSubtitlePref: vi.fn(),
    getAudioPref: vi.fn(),
    setAudioPref: vi.fn(),
    setResume: vi.fn(),
    clearResume: vi.fn(),
    removeWatchlist: vi.fn(),
    getPickedOnlineSub: vi.fn(),
    setPickedOnlineSub: vi.fn(),
    setCatchupProgress: vi.fn(),
    getCatchupProgress: vi.fn(),
    clearCatchupProgress: vi.fn(),
    touchRecentlyWatchedLive: vi.fn(),
    getSubtitleOffset: vi.fn(() => 0),
    setSubtitleOffset: vi.fn(),
    getChannelCycleMode: vi.fn(() => 'global'),
    getLiveReconnectAttempts: vi.fn(() => 3),
    getPlayerOsdTimeoutMs: vi.fn(() => 5000),
    getPlaylists: vi.fn(() => []),
  },
}));
vi.mock('./toast', () => ({ showToast: vi.fn() }));
vi.mock('../services/media-probe', () => ({ probeMedia: vi.fn() }));
vi.mock('../services/subtitle-search/subtitle-search-service', () => ({
  subtitleSearchService: { isAvailable: () => false },
}));

import { Player } from './player';
import { PlayerPipeline, type PlayerPipelineOptions } from './player-pipeline';
import * as platform from '../utils/platform';

describe('PlayerPipeline MP4 and HTTP error handling', () => {
  let videoEl: HTMLVideoElement;
  let pipelineOpts: PlayerPipelineOptions;
  let pipeline: PlayerPipeline;

  beforeEach(() => {
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.load = vi.fn();
    videoEl = document.createElement('video');
    pipelineOpts = {
      playbackLabel: () => 'test-stream',
      mediaState: () => 'test-state',
      isCatchup: () => false,
      onError: vi.fn(),
      onAudioTracksUpdated: vi.fn(),
      onSubtitleTracksUpdated: vi.fn(),
      onManifest: vi.fn(),
    };
    pipeline = new PlayerPipeline(pipelineOpts);
    pipeline.setVideoElement(videoEl);
  });

  it('selects native webOS playback with video/mp4 MIME for .mp4 and .m4v URLs', () => {
    vi.spyOn(platform, 'isWebOS').mockReturnValue(true);

    pipeline.load('http://host:8088/synthetic_test.mp4?token=abc#t=0', null);
    const source = videoEl.querySelector('source');
    expect(source).not.toBeNull();
    expect(source?.src).toBe('http://host:8088/synthetic_test.mp4?token=abc#t=0');
    expect(source?.type).toBe('video/mp4');

    pipeline.load('http://host:8088/video.m4v?auth=xyz', null);
    const m4vSource = videoEl.querySelector('source');
    expect(m4vSource?.type).toBe('video/mp4');
  });

  it('selects direct desktop playback for .mp4 URLs in desktop preview', async () => {
    vi.spyOn(platform, 'isWebOS').mockReturnValue(false);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'video/mp4' },
      body: { cancel: async () => {} },
    })));

    pipeline.load('http://host:8088/synthetic_test.mp4', null);
    await vi.waitFor(() => {
      expect(videoEl.src).toBe('http://host:8088/synthetic_test.mp4');
    });
  });

  it('aborts playback on HTTP 403 Forbidden during probe and triggers onError(http_error)', async () => {
    vi.spyOn(platform, 'isWebOS').mockReturnValue(true);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: { get: () => 'application/xml' },
      body: { cancel: async () => {} },
    })));

    pipeline.load('http://host/stream/extensionless', null);
    await vi.waitFor(() => {
      expect(pipelineOpts.onError).toHaveBeenCalledWith('http_error');
    });
    // Must never append a <source> for a forbidden stream
    expect(videoEl.querySelector('source')).toBeNull();
  });

  it('aborts playback on HTTP 404 Not Found during probe', async () => {
    vi.spyOn(platform, 'isWebOS').mockReturnValue(true);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: { get: () => 'text/html' },
      body: { cancel: async () => {} },
    })));

    pipeline.load('http://host/stream/missing', null);
    await vi.waitFor(() => {
      expect(pipelineOpts.onError).toHaveBeenCalledWith('http_error');
    });
    expect(videoEl.querySelector('source')).toBeNull();
  });

  it('aborts playback on HTTP 416 Range Not Satisfiable during probe', async () => {
    vi.spyOn(platform, 'isWebOS').mockReturnValue(true);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: { get: () => 'text/plain' },
      body: { cancel: async () => {} },
    })));

    pipeline.load('http://host/stream/bad-range', null);
    await vi.waitFor(() => {
      expect(pipelineOpts.onError).toHaveBeenCalledWith('http_error');
    });
  });

  it('aborts playback on HTTP 500 Server Error during probe', async () => {
    vi.spyOn(platform, 'isWebOS').mockReturnValue(true);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: { get: () => 'text/html' },
      body: { cancel: async () => {} },
    })));

    pipeline.load('http://host/stream/server-error', null);
    await vi.waitFor(() => {
      expect(pipelineOpts.onError).toHaveBeenCalledWith('http_error');
    });
  });

  it('cancels in-flight probe on rapid channel change without firing error for superseded stream', async () => {
    vi.spyOn(platform, 'isWebOS').mockReturnValue(true);
    let aborted = false;
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: { signal?: AbortSignal }) => {
      return new Promise((resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          aborted = true;
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    }));

    pipeline.load('http://host/stream1', null);
    await new Promise(r => setTimeout(r, 10));
    // User changes channel while probe is in flight
    pipeline.load('http://host/stream2.mp4', null);

    expect(aborted).toBe(true);
    expect(pipelineOpts.onError).not.toHaveBeenCalled();
    const source = videoEl.querySelector('source');
    expect(source?.src).toBe('http://host/stream2.mp4');
  });
});

describe('Player recovery on MP4 failure', () => {
  let player: Player;
  let container: HTMLElement;
  let video: HTMLVideoElement;

  beforeEach(() => {
    vi.useFakeTimers();
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.load = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 403,
      headers: { get: () => 'application/xml' },
      body: { cancel: async () => {} },
    })));
    document.body.innerHTML = '';
    container = document.createElement('div');
    const osd = document.createElement('div');
    osd.id = 'player-osd';
    container.appendChild(osd);
    document.body.appendChild(container);

    const ch1 = { id: 'c1', name: 'MP4 Chan', logo: '', group: '', url: 'http://host/fail.mp4', extras: null };
    const ch2 = { id: 'c2', name: 'HLS Chan', logo: '', group: '', url: 'http://host/ok.m3u8', extras: null };
    playlistMock.channels = [ch1, ch2];
    playlistMock.getByIndex.mockImplementation((idx: number) => [ch1, ch2][idx] ?? ch1);
    playlistMock.indexOf.mockReturnValue(0);
    playlistMock.resolveChannelKey.mockReturnValue({ channel: ch1, channelIndex: 0 });

    player = new Player(container, vi.fn(), vi.fn(), vi.fn());
    video = document.createElement('video');
    container.appendChild(video);
    player.init(video);
  });

  it('marks channel unavailable and transitions to next channel on playback error', async () => {
    player.play(0);
    // Simulate error event with code 4 (MEDIA_ERR_SRC_NOT_SUPPORTED)
    Object.defineProperty(video, 'error', {
      value: { code: 4, message: 'Source not supported' },
      configurable: true,
    });
    video.dispatchEvent(new Event('error'));

    // Health failure recorded
    expect(healthMock.recordPlaybackFailure).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'MP4 Chan' }),
      'playback_error',
    );
    // OSD message updated
    expect(container.querySelector('#player-osd')?.textContent).toContain('Playback error');

    // After 2000 ms debounce, transitions to channel 1
    vi.advanceTimersByTime(2000);
    expect(playlistMock.getByIndex).toHaveBeenCalledWith(1);
  });
});
