import { createCdpClient } from 'file:///C:/Users/amaur/Desktop/webos-iptv-player/scripts/tv_cdp.mjs';

async function main() {
  const cdp = await createCdpClient();
  await cdp.evaluate(`
    window._tmp_res = null;
    const req = indexedDB.open('iptv', 7);
    req.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(['playlist-cache'], 'readonly');
      const store = tx.objectStore('playlist-cache');
      const getReq = store.get('combined-v3');
      getReq.onsuccess = () => {
        const val = getReq.result;
        const channels = val && val.channels ? val.channels : [];
        window._tmp_res = JSON.stringify(channels.map(c => ({ name: c.name, url: c.url, id: c.id, group: c.group })));
      };
      getReq.onerror = () => { window._tmp_res = 'error getReq'; };
    };
    req.onerror = () => { window._tmp_res = 'error req'; };
  `, false);

  // Poll for window._tmp_res
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    const res = await cdp.evaluate('window._tmp_res');
    if (res) {
      console.log('Channels from IDB:', JSON.parse(res));
      break;
    }
  }
  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
