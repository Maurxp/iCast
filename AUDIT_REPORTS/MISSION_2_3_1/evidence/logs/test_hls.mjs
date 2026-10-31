import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  console.log('Connected to CDP for HLS test.');

  await cdp.send('Console.enable');
  await cdp.send('Runtime.enable');
  cdp.onEvent((msg) => {
    if (msg.method === 'Console.messageAdded') {
      const { level, text } = msg.params.message;
      console.log(`[DOM ${level}]`, text);
    }
  });

  console.log('Dispatching ENTER key (keyCode: 13) on document...');
  await cdp.evaluate(`
    document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13, which: 13, bubbles: true, cancelable: true }));
  `);

  console.log('Monitoring playback for 8 seconds...');
  for (let i = 1; i <= 8; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await cdp.evaluate(`
      (() => {
        const v = document.querySelector('video');
        const playerView = document.getElementById('view-player');
        const channelsView = document.getElementById('view-channels');
        return {
          playerVisible: playerView ? playerView.style.display !== 'none' : false,
          channelsVisible: channelsView ? channelsView.style.display !== 'none' : false,
          src: v ? v.src : null,
          currentSrc: v ? v.currentSrc : null,
          paused: v ? v.paused : null,
          currentTime: v ? v.currentTime : null,
          readyState: v ? v.readyState : null,
          error: v && v.error ? { code: v.error.code, message: v.error.message } : null
        };
      })()
    `);
    console.log(`Second ${i}:`, JSON.stringify(status));
  }

  console.log('Dispatching BACK key (keyCode: 461) on document...');
  await cdp.evaluate(`
    document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 461, which: 461, bubbles: true, cancelable: true }));
  `);

  await new Promise(r => setTimeout(r, 1500));
  const backStatus = await cdp.evaluate(`
    (() => {
      const v = document.querySelector('video');
      const playerView = document.getElementById('view-player');
      const channelsView = document.getElementById('view-channels');
      return {
        playerVisible: playerView ? playerView.style.display !== 'none' : false,
        channelsVisible: channelsView ? channelsView.style.display !== 'none' : false,
        videoPaused: v ? v.paused : null
      };
    })()
  `);
  console.log('After Back key status:', JSON.stringify(backStatus));

  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
