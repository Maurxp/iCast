const { Client } = require('C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('grep -iE "IPTV|lennylxx" /var/log/* 2>/dev/null', (err, stream) => {
    let data = '';
    stream.on('data', d => { data += d.toString(); });
    stream.on('close', () => {
      console.log('Logs match:');
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
