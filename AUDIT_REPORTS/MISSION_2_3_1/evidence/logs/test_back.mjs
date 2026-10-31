import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  await cdp.send('Console.enable');
  await cdp.send('Runtime.enable');
  cdp.onEvent((msg) => {
    if (msg.method === 'Console.messageAdded') {
      const m = msg.params.message;
      console.log(`[CONSOLE ${m.level}]`, m.text);
    }
  });

  console.log('Sending BACK key (461)...');
  await cdp.evaluate(`
    (() => {
      const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'keyCode', { value: 461 });
      Object.defineProperty(ev, 'which', { value: 461 });
      document.dispatchEvent(ev);
    })()
  `);

  await new Promise(r => setTimeout(r, 1500));
  const views = await cdp.evaluate(`
    (() => {
      const playerView = document.getElementById('view-player');
      const channelsView = document.getElementById('view-channels');
      const v = document.querySelector('video');
      return {
        playerDisplay: playerView ? playerView.style.display : null,
        channelsDisplay: channelsView ? channelsView.style.display : null,
        videoPaused: v ? v.paused : null
      };
    })()
  `);
  console.log('Views after Back:', views);
  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
