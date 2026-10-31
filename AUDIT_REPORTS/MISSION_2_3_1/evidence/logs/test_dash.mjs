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
  console.log('Connected to CDP for DASH test.');

  await cdp.send('Console.enable');
  await cdp.send('Runtime.enable');
  cdp.onEvent((msg) => {
    if (msg.method === 'Console.messageAdded') {
      const m = msg.params.message;
      if (m.text.includes('Player') || m.text.includes('playback') || m.text.includes('dash') || m.text.includes('Error')) {
        console.log(`[CONSOLE ${m.level}]`, m.text, m.parameters ? JSON.stringify(m.parameters) : '');
      }
    }
  });

  console.log('Navigating down to channel 2 (DASH)...');
  await sendKey(cdp, 40); // DOWN key
  await new Promise(r => setTimeout(r, 500));

  const focusInfo = await cdp.evaluate(`
    (() => {
      const el = document.querySelector('.channel-item.focused');
      return el ? { key: el.getAttribute('data-key'), text: el.innerText.trim() } : null;
    })()
  `);
  console.log('Focused element:', focusInfo);

  console.log('Pressing Enter to play DASH channel...');
  await sendKey(cdp, 13); // ENTER key

  console.log('Monitoring DASH playback for 10 seconds...');
  for (let i = 1; i <= 10; i++) {
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
