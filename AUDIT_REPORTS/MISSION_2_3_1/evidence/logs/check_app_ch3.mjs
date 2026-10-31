import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  const info = await cdp.evaluate(`
    (() => {
      // Find PlaylistService channels
      return {
        activeChannelIndex: window.app ? window.app.activeChannelIndex : null,
        focusedKey: document.querySelector('.channel-item.focused') ? document.querySelector('.channel-item.focused').getAttribute('data-key') : null
      };
    })()
  `);
  console.log('App state:', info);
  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
