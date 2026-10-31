import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  console.log('Reloading page via CDP...');
  await cdp.evaluate('location.reload()', false);
  cdp.close();

  console.log('Waiting 3 seconds for app reload...');
  await new Promise(r => setTimeout(r, 3000));

  const cdp2 = await createCdpClient();
  const title = await cdp2.evaluate('document.title');
  console.log('App reloaded, title:', title);

  const channelText = await cdp2.evaluate(`
    Array.from(document.querySelectorAll('.channel-item')).map(c => c.innerText.trim().replace(/\\n+/g, ' | '))
  `);
  console.log('Channels on screen:', channelText);

  cdp2.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
