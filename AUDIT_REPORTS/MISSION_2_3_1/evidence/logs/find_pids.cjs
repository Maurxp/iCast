const { Client } = require('C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  // Let's find the PID for 41926 (0xA3C6 in hex) and 9998 (0x270E in hex) from /proc/net/tcp or fuser
  conn.exec('fuser 41926/tcp 9998/tcp', (err, stream) => {
    let data = '';
    stream.on('data', d => { data += d.toString(); });
    stream.on('close', () => {
      console.log('fuser PIDs:', data);

      // Now inspect cmdline and status of any found PIDs
      conn.exec('for p in /proc/[0-9]*; do if grep -qE "com.lennylxx|iptv" "$p/cmdline" 2>/dev/null; then echo "PID $p:"; cat "$p/cmdline" | tr "\\0" " "; echo ""; cat "$p/status" | grep -E "VmRSS|VmSize|Name"; fi; done', (err2, stream2) => {
        let data2 = '';
        stream2.on('data', d => { data2 += d.toString(); });
        stream2.on('close', () => {
          console.log('Proc cmdline search:');
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
