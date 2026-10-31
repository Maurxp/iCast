const { Client } = require('C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  // Let's curl or cat the uploaded m3u file on the TV!
  conn.exec('curl -s "http://127.0.0.1:41926/uploads/synthetictest.m3u?token=f6cefde56a15a6f29a4943491f3190c1" || find / -name "synthetictest.m3u" 2>/dev/null', (err, stream) => {
    let data = '';
    stream.on('data', d => { data += d.toString(); });
    stream.on('close', () => {
      console.log('synthetictest.m3u content:');
      console.log(data);
      conn.end();
    });
  });
}).connect({
  host: '192.168.1.8',
  port: 22,
  username: 'root',
  password: 'alpine'
});
