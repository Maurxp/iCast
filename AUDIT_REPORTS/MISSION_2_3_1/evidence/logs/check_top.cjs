const { Client } = require('C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('top -b -n 1 | head -n 35', (err, stream) => {
    let data = '';
    stream.on('data', d => { data += d.toString(); });
    stream.on('close', () => {
      console.log('--- TOP OUTPUT ---');
      console.log(data);

      conn.exec('ps | grep -iE "app|node|iptv|web"', (err2, stream2) => {
        let data2 = '';
        stream2.on('data', d => { data2 += d.toString(); });
        stream2.on('close', () => {
          console.log('--- PS FILTERED ---');
          console.log(data2);
          conn.end();
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
