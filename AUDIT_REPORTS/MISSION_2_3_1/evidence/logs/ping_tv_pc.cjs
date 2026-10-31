const { Client } = require('C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('ping -c 3 192.168.1.6', (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Ping from TV to PC:\n' + out);
      conn.end();
    });
  });
}).connect({
  host: '192.168.1.8',
  port: 22,
  username: 'root',
  password: 'alpine'
});
