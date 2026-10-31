import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

function sendKey(cdp, keyCode) {
  return cdp.evaluate(`
    (() => {
      const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'keyCode', { value: ${keyCode} });
      Object.defineProperty(ev, 'which', { value: ${keyCode} });
      document.dispatchEvent(ev);
    })()
  `);
}

async function main() {
  const cdp = await createCdpClient();
  console.log('Connected to CDP for MP4 selection.');

  await cdp.send('Console.enable');
  await cdp.send('Runtime.enable');

  cdp.onEvent((msg) => {
    if (msg.method === 'Console.messageAdded') {
      const m = msg.params.message;
      const text = m.text;
      if (text.includes('Player') || text.includes('playback') || text.includes('mp4') || text.includes('recovery') || text.includes('Error')) {
        console.log(`[DOM ${m.level}]`, text, m.parameters ? JSON.stringify(m.parameters) : '');
      }
    }
  });

  console.log('Sending DOWN, DOWN, ENTER...');
  await sendKey(cdp, 40); // DOWN to ch:1
  await new Promise(r => setTimeout(r, 400));
  await sendKey(cdp, 40); // DOWN to ch:2
  await new Promise(r => setTimeout(r, 400));
  await sendKey(cdp, 13); // ENTER to play

  console.log('Monitoring playback for 8 seconds...');
  for (let i = 1; i <= 8; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await cdp.evaluate(`
      (() => {
        const v = document.querySelector('video');
        const playerView = document.getElementById('view-player');
        return {
          playerVisible: playerView ? playerView.style.display !== 'none' : false,
          currentSrc: v ? v.currentSrc : null,
          paused: v ? v.paused : null,
          currentTime: v ? v.currentTime : null,
          duration: v ? v.duration : null,
          readyState: v ? v.readyState : null,
          error: v && v.error ? { code: v.error.code, message: v.error.message } : null
        };
      })()
    `);
    console.log(`Second ${i}:`, JSON.stringify(status));
  }

  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
