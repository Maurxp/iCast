import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  const videoInfo = await cdp.evaluate(`
    (() => {
      const v = document.querySelector('video');
      if (!v) return 'no video element';
      return {
        id: v.id,
        src: v.src,
        currentSrc: v.currentSrc,
        paused: v.paused,
        currentTime: v.currentTime,
        duration: v.duration,
        readyState: v.readyState,
        networkState: v.networkState,
        error: v.error ? { code: v.error.code, message: v.error.message } : null
      };
    })()
  `);
  console.log('Video Element Info:', videoInfo);
  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
