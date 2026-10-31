import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  const info = await cdp.evaluate(`
    (() => {
      const ringOwner = document.querySelector('[data-ring-owner]');
      const focused = document.querySelector('.focused');
      const focusedKey = focused ? focused.getAttribute('data-key') : null;
      const channelFocused = document.querySelector('.channel-item.focused');
      return {
        ringOwner: ringOwner ? (ringOwner.id || ringOwner.className) : null,
        focusedKey: focusedKey,
        focusedDataset: focused ? JSON.stringify(focused.dataset) : null,
        channelFocusedDataset: channelFocused ? JSON.stringify(channelFocused.dataset) : null
      };
    })()
  `);
  console.log('Focus state on TV:', info);
  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
