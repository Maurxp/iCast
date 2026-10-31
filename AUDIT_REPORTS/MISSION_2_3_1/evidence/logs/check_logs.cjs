const { Client } = require('C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  // Let's check syslog / pmlog for com.lennylxx
  conn.exec('grep -iE "com.lennylxx|iptv" /var/log/messages* | tail -n 50', (err, stream) => {
    let data = '';
    stream.on('data', d => { data += d.toString(); });
    stream.on('close', () => {
      console.log('--- VAR LOG MESSAGES ---');
      console.log(data);

      // Check devlog if any
      conn.exec('cat /media/developer/log/devlog* 2>/dev/null | tail -n 30 || true', (err2, stream2) => {
        let data2 = '';
        if (stream2) {
          stream2.on('data', d => { data2 += d.toString(); });
          stream2.on('close', () => {
            console.log('--- DEVLOG ---');
            console.log(data2);
            conn.end();
          });
        } else {
          conn.end();
        }
      });
    });
  });
}).connect({
  host: '192.168.1.8',
  port: 22,
  username: 'root',
  password: 'alpine'
});
