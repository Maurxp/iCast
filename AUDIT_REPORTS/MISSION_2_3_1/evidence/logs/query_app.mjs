import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  console.log('Connected to CDP.');

  const playlists = await cdp.evaluate('localStorage.getItem("iptv_playlists")');
  console.log('Playlists in localStorage:', playlists);

  const lastChannel = await cdp.evaluate('localStorage.getItem("iptv_last_channel")');
  console.log('Last channel in localStorage:', lastChannel);

  const channelItems = await cdp.evaluate(`
    Array.from(document.querySelectorAll('.channel-item, .channel-row, [data-key]')).slice(0, 10).map(el => ({
      tag: el.tagName,
      className: el.className,
      key: el.getAttribute('data-key'),
      text: el.innerText.trim().replace(/\\n+/g, ' | ')
    }))
  `);
  console.log('Channel items in DOM:', JSON.stringify(channelItems, null, 2));

  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
