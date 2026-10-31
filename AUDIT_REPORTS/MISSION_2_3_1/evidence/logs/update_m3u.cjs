const { Client } = require('C:/Users/amaur/AppData/Local/npm-cache/_npx/a6d32b54c94894f4/node_modules/@webos-tools/cli/node_modules/ssh2');

const newM3u = `#EXTM3U
#EXTINF:-1 tvg-id="ch1" tvg-name="HLS Stream" group-title="Synthetic",HLS Test Channel
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="ch2" tvg-name="DASH Stream" group-title="Synthetic",DASH Test Channel
https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd
#EXTINF:-1 tvg-id="ch3" tvg-name="MP4 Stream" group-title="Synthetic",MP4 Test Channel
http://192.168.1.6:8088/synthetic_test.mp4
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('sftp err:', err);
      conn.end();
      return;
    }
    const ws = sftp.createWriteStream('/media/internal/iptv-uploads/synthetictest.m3u');
    ws.on('close', () => {
      console.log('Successfully updated /media/internal/iptv-uploads/synthetictest.m3u');
      sftp.end();
      conn.end();
    });
    ws.write(newM3u);
    ws.end();
  });
}).connect({
  host: '192.168.1.8',
  port: 22,
  username: 'root',
  password: 'alpine'
});
