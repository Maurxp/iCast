import { Client } from 'C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2/lib/index.js';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected.');

  // Run ps command to get memory and CPU for app and service
  conn.exec('ps -o pid,user,vsz,rss,%cpu,%mem,stat,comm,args | grep -E "iptv|WebAppMgr|node|ls-hubd"', (err, stream) => {
    if (err) {
      console.error('exec error:', err);
      conn.end();
      return;
    }
    let data = '';
    stream.on('data', d => { data += d.toString(); });
    stream.on('close', () => {
      console.log('--- PROCESS LIST ---');
      console.log(data);

      // Check listening ports on the TV (e.g. netstat -tulnp)
      conn.exec('netstat -tuln | grep -E "4192|9998|LISTEN"', (err2, stream2) => {
        if (err2) {
          console.error('exec2 error:', err2);
          conn.end();
          return;
        }
        let data2 = '';
        stream2.on('data', d => { data2 += d.toString(); });
        stream2.on('close', () => {
          console.log('--- LISTENING PORTS ---');
          console.log(data2);

          // Check luna-send service call status for com.lennylxx.iptv.service
          conn.exec('luna-send -n 1 -f luna://com.lennylxx.iptv.service/heartbeat "{}" 2>&1 || true', (err3, stream3) => {
            let data3 = '';
            if (stream3) {
              stream3.on('data', d => { data3 += d.toString(); });
              stream3.on('close', () => {
                console.log('--- SERVICE HEARTBEAT / CALL ---');
                console.log(data3);
                conn.end();
              });
            } else {
              conn.end();
            }
          });
        });
      });
    });
  });
}).connect({
  host: '192.168.1.8',
  port: 22,
  username: 'root',
  password: 'alpine'
});
