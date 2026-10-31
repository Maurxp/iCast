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
  console.log('Connected to CDP for MP4 test.');

  await cdp.send('Console.enable');
  await cdp.send('Runtime.enable');

  const logs = [];
  cdp.onEvent((msg) => {
    if (msg.method === 'Console.messageAdded') {
      const m = msg.params.message;
      const text = m.text;
      const line = `[CONSOLE ${m.level}] ${text} ${m.parameters ? JSON.stringify(m.parameters) : ''}`;
      logs.push(line);
      if (text.includes('Player') || text.includes('playback') || text.includes('mp4') || text.includes('Error') || text.includes('probando')) {
        console.log(line);
      }
    }
  });

  console.log('Navigating down to channel 3 (MP4)...');
  await sendKey(cdp, 40); // DOWN to ch:1
  await new Promise(r => setTimeout(r, 400));
  await sendKey(cdp, 40); // DOWN to ch:2
  await new Promise(r => setTimeout(r, 400));

  const focusInfo = await cdp.evaluate(`
    (() => {
      const el = document.querySelector('.channel-item.focused');
      return el ? { key: el.getAttribute('data-key'), text: el.innerText.trim().replace(/\\n+/g, ' | ') } : null;
    })()
  `);
  console.log('Focused element:', focusInfo);

  console.log('Pressing Enter to play MP4 channel...');
  await sendKey(cdp, 13); // ENTER key

  console.log('Monitoring MP4 playback for 12 seconds...');
  const samples = [];
  for (let i = 1; i <= 12; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await cdp.evaluate(`
      (() => {
        const v = document.querySelector('video');
        const playerView = document.getElementById('view-player');
        const channelsView = document.getElementById('view-channels');
        const toast = document.querySelector('.toast, .error-banner');
        return {
          playerVisible: playerView ? playerView.style.display !== 'none' : false,
          channelsVisible: channelsView ? channelsView.style.display !== 'none' : false,
          currentSrc: v ? v.currentSrc : null,
          paused: v ? v.paused : null,
          currentTime: v ? v.currentTime : null,
          duration: v ? v.duration : null,
          readyState: v ? v.readyState : null,
          error: v && v.error ? { code: v.error.code, message: v.error.message } : null,
          toastText: toast ? toast.innerText.trim() : null
        };
      })()
    `);
    samples.push(status);
    console.log(`Second ${i}:`, JSON.stringify(status));
  }

  console.log('Pressing Back key (461)...');
  await sendKey(cdp, 461); // BACK key
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
