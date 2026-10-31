const { Client } = require('C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('cat /proc/5675/cmdline | tr "\\0" " "; echo ""; cat /proc/5675/status | grep -E "VmRSS|VmSize|Name|Threads"', (err, stream) => {
    let data = '';
    stream.on('data', d => { data += d.toString(); });
    stream.on('close', () => {
      console.log('PID 5675:');
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
