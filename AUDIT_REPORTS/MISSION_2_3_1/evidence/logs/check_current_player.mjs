import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  const playerInfo = await cdp.evaluate(`
    (() => {
      const v = document.querySelector('video');
      const playerView = document.getElementById('view-player');
      const toast = document.querySelector('.toast, .error-banner, .player-toast, .player-status');
      const osd = document.querySelector('.player-osd');
      return {
        playerVisible: playerView ? playerView.style.display !== 'none' : false,
        videoSrc: v ? v.src : null,
        currentSrc: v ? v.currentSrc : null,
        paused: v ? v.paused : null,
        currentTime: v ? v.currentTime : null,
        readyState: v ? v.readyState : null,
        networkState: v ? v.networkState : null,
        error: v && v.error ? { code: v.error.code, message: v.error.message } : null,
        toastText: toast ? toast.innerText.trim() : null,
        osdText: osd ? osd.innerText.trim().replace(/\\n+/g, ' | ') : null
      };
    })()
  `);
  console.log('Current Player State on TV:', JSON.stringify(playerInfo, null, 2));
  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
