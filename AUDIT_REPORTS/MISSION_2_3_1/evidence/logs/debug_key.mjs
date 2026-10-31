import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  await cdp.send('Console.enable');
  await cdp.send('Runtime.enable');
  cdp.onEvent((msg) => {
    if (msg.method === 'Console.messageAdded') {
      const m = msg.params.message;
      console.log(`[CONSOLE ${m.level}]`, m.text, m.parameters ? JSON.stringify(m.parameters) : '');
    }
  });

  console.log('Sending Enter key with Object.defineProperty...');
  await cdp.evaluate(`
    (() => {
      const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'keyCode', { value: 13 });
      Object.defineProperty(ev, 'which', { value: 13 });
      document.dispatchEvent(ev);
    })()
  `);

  await new Promise(r => setTimeout(r, 1000));
  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
