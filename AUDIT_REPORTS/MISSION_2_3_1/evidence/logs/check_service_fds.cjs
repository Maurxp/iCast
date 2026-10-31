const { Client } = require('C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('ls -l /proc/2800/fd', (err, stream) => {
    let data = '';
    stream.on('data', d => { data += d.toString(); });
    stream.on('close', () => {
      console.log('PID 2800 FDs:');
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
