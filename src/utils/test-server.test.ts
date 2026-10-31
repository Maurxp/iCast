import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'http';
import * as os from 'os';
import {
  parseRange,
  createTestServer,
  parseServerCliArgs,
  validateHostAddress,
  isWildcardIp,
  isVirtualOrVpnInterface,
  isRfc1918PrivateIpv4,
  getLanIp,
  ALLOWED_FIXTURE_FILES,
} from '../../scripts/test-server';

describe('test-server host validation and security restrictions', () => {
  it('identifies IPv4 and IPv6 wildcard addresses', () => {
    expect(isWildcardIp('0.0.0.0')).toBe(true);
    expect(isWildcardIp('::')).toBe(true);
    expect(isWildcardIp('::0')).toBe(true);
    expect(isWildcardIp('0:0:0:0:0:0:0:0')).toBe(true);
    expect(isWildcardIp('127.0.0.1')).toBe(false);
    expect(isWildcardIp('::1')).toBe(false);
    expect(isWildcardIp('192.168.1.1')).toBe(false);
  });

  it('identifies virtual and VPN interfaces as heuristic', () => {
    expect(isVirtualOrVpnInterface('Radmin VPN')).toBe(true);
    expect(isVirtualOrVpnInterface('Tailscale')).toBe(true);
    expect(isVirtualOrVpnInterface('vEthernet (WSL)')).toBe(true);
    expect(isVirtualOrVpnInterface('docker0')).toBe(true);
    expect(isVirtualOrVpnInterface('tun0')).toBe(true);
    expect(isVirtualOrVpnInterface('tap0')).toBe(true);
    expect(isVirtualOrVpnInterface('WireGuard')).toBe(true);
    expect(isVirtualOrVpnInterface('Wi-Fi')).toBe(false);
    expect(isVirtualOrVpnInterface('Ethernet')).toBe(false);
    expect(isVirtualOrVpnInterface('eth0')).toBe(false);
    expect(isVirtualOrVpnInterface('wlan0')).toBe(false);
  });

  it('validates strictly RFC 1918 private IPv4 ranges and rejects non-private addresses', () => {
    // 10.0.0.0/8
    expect(isRfc1918PrivateIpv4('10.0.0.1')).toBe(true);
    expect(isRfc1918PrivateIpv4('10.255.255.254')).toBe(true);
    // 172.16.0.0/12
    expect(isRfc1918PrivateIpv4('172.16.0.1')).toBe(true);
    expect(isRfc1918PrivateIpv4('172.31.255.254')).toBe(true);
    expect(isRfc1918PrivateIpv4('172.15.255.255')).toBe(false);
    expect(isRfc1918PrivateIpv4('172.32.0.1')).toBe(false);
    // 192.168.0.0/16
    expect(isRfc1918PrivateIpv4('192.168.1.1')).toBe(true);
    expect(isRfc1918PrivateIpv4('192.168.254.254')).toBe(true);
    // Public IPs
    expect(isRfc1918PrivateIpv4('8.8.8.8')).toBe(false);
    expect(isRfc1918PrivateIpv4('26.245.69.249')).toBe(false);
    expect(isRfc1918PrivateIpv4('203.0.113.50')).toBe(false);
    // Link-local
    expect(isRfc1918PrivateIpv4('169.254.1.1')).toBe(false);
    // Loopback
    expect(isRfc1918PrivateIpv4('127.0.0.1')).toBe(false);
    // Multicast & CGNAT
    expect(isRfc1918PrivateIpv4('224.0.0.1')).toBe(false);
    expect(isRfc1918PrivateIpv4('100.64.0.1')).toBe(false);
  });

  it('rejects explicit --host 0.0.0.0 with wildcard error', () => {
    expect(() => parseServerCliArgs(['--host', '0.0.0.0'])).toThrow(
      /Wildcard binding address "0\.0\.0\.0" is strictly prohibited/,
    );
  });

  it('rejects explicit --host :: with wildcard error', () => {
    expect(() => parseServerCliArgs(['--host', '::'])).toThrow(
      /Wildcard binding address "::" is strictly prohibited/,
    );
  });

  it('rejects explicit --host 0:0:0:0:0:0:0:0 with wildcard error', () => {
    expect(() => parseServerCliArgs(['--host', '0:0:0:0:0:0:0:0'])).toThrow(
      /Wildcard binding address/,
    );
  });

  it('rejects TEST_SERVER_HOST=0.0.0.0 with wildcard error', () => {
    expect(() => parseServerCliArgs([], { TEST_SERVER_HOST: '0.0.0.0' })).toThrow(
      /Wildcard binding address "0\.0\.0\.0" is strictly prohibited/,
    );
  });

  it('rejects malformed IP addresses with syntax error', () => {
    expect(() => parseServerCliArgs(['--host', '999.999.999.999'])).toThrow(
      /Invalid IP address syntax: "999\.999\.999\.999"/,
    );
    expect(() => parseServerCliArgs(['--host', 'abc'])).toThrow(
      /Invalid IP address syntax: "abc"/,
    );
    expect(() => parseServerCliArgs(['--host', '192.168.1'])).toThrow(
      /Invalid IP address syntax: "192\.168\.1"/,
    );
    expect(() => parseServerCliArgs([], { TEST_SERVER_HOST: 'not-an-ip' })).toThrow(
      /Invalid IP address syntax: "not-an-ip"/,
    );
  });

  it('rejects IP addresses that do not belong to any local network interface', () => {
    // 198.51.100.1 is documentation net (RFC 5737), guaranteed not local
    expect(() => parseServerCliArgs(['--host', '198.51.100.1'])).toThrow(
      /Host address "198\.51\.100\.1" does not correspond to any active local network interface/,
    );
  });

  it('accepts valid local loopback address 127.0.0.1 and localhost', () => {
    const res1 = parseServerCliArgs(['--host', '127.0.0.1']);
    expect(res1.host).toBe('127.0.0.1');

    const res2 = parseServerCliArgs(['--host', 'localhost']);
    expect(res2.host).toBe('127.0.0.1');
  });

  it('defaults to 127.0.0.1 and port 8088 when no arguments given', () => {
    const { host, port } = parseServerCliArgs([], {});
    expect(host).toBe('127.0.0.1');
    expect(port).toBe(8088);
  });

  it('parses valid port and validates port boundaries', () => {
    const res = parseServerCliArgs(['--port', '9000'], {});
    expect(res.port).toBe(9000);

    expect(() => parseServerCliArgs(['--port', '0'], {})).toThrow(/Invalid port/);
    expect(() => parseServerCliArgs(['--port', '70000'], {})).toThrow(/Invalid port/);
    expect(() => parseServerCliArgs(['--port', 'invalid'], {})).toThrow(/Invalid port/);
  });

  it('resolves --lan to physical non-virtual LAN interface', () => {
    const lanIp = getLanIp();
    expect(lanIp).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    expect(lanIp).not.toBe('0.0.0.0');
    expect(lanIp).not.toBe('127.0.0.1');
    expect(isRfc1918PrivateIpv4(lanIp)).toBe(true);

    const { host } = parseServerCliArgs(['--lan'], {});
    expect(host).toBe(lanIp);
  });

  it('prioritizes physical LAN over VPN/virtual interfaces when resolving LAN IP', () => {
    const mockInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      'Radmin VPN': [
        {
          address: '26.245.69.249',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '02:50:42:fa:db:de',
          internal: false,
          cidr: '26.245.69.249/8',
        },
      ],
      'vEthernet (Default Switch)': [
        {
          address: '172.28.16.1',
          netmask: '255.255.240.0',
          family: 'IPv4',
          mac: '00:15:5d:00:00:01',
          internal: false,
          cidr: '172.28.16.1/20',
        },
      ],
      'Wi-Fi': [
        {
          address: '192.168.1.50',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '40:5b:d8:67:ea:d9',
          internal: false,
          cidr: '192.168.1.50/24',
        },
      ],
    };

    const selected = getLanIp(mockInterfaces);
    expect(selected).toBe('192.168.1.50');
  });

  it('rejects public IPv4 interfaces when resolving LAN IP and fails closed', () => {
    const mockPublicOnly: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      'eth0': [
        {
          address: '203.0.113.50',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:11:22:33:44:55',
          internal: false,
          cidr: '203.0.113.50/24',
        },
      ],
    };

    expect(() => getLanIp(mockPublicOnly)).toThrow(
      /no non-virtual interface with an RFC 1918 private IPv4 address/,
    );
  });

  it('rejects link-local IPv4 interfaces when resolving LAN IP and fails closed', () => {
    const mockLinkLocalOnly: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      'Ethernet': [
        {
          address: '169.254.10.25',
          netmask: '255.255.0.0',
          family: 'IPv4',
          mac: '00:11:22:33:44:66',
          internal: false,
          cidr: '169.254.10.25/16',
        },
      ],
    };

    expect(() => getLanIp(mockLinkLocalOnly)).toThrow(
      /no non-virtual interface with an RFC 1918 private IPv4 address/,
    );
  });

  it('fails with explicit ambiguity error when multiple RFC 1918 private candidates exist', () => {
    const mockMultiplePrivate: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      'Ethernet': [
        {
          address: '192.168.1.10',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:11:22:33:44:77',
          internal: false,
          cidr: '192.168.1.10/24',
        },
      ],
      'Wi-Fi': [
        {
          address: '10.0.0.5',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:11:22:33:44:88',
          internal: false,
          cidr: '10.0.0.5/24',
        },
      ],
    };

    expect(() => getLanIp(mockMultiplePrivate)).toThrow(
      /Ambiguous LAN configuration: multiple RFC 1918 private IPv4 interfaces detected/,
    );
  });

  it('selects successfully when exactly one RFC 1918 private interface exists', () => {
    const mockSinglePrivate: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      'Ethernet': [
        {
          address: '192.168.1.15',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:11:22:33:44:99',
          internal: false,
          cidr: '192.168.1.15/24',
        },
      ],
    };

    expect(getLanIp(mockSinglePrivate)).toBe('192.168.1.15');
  });

  it('fails closed when no safe non-virtual physical LAN interface exists', () => {
    const mockVirtualOnly: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      'Radmin VPN': [
        {
          address: '26.245.69.249',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '02:50:42:fa:db:de',
          internal: false,
          cidr: '26.245.69.249/8',
        },
      ],
      'Tailscale': [
        {
          address: '100.64.0.1',
          netmask: '255.255.255.255',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: false,
          cidr: '100.64.0.1/32',
        },
      ],
    };

    expect(() => getLanIp(mockVirtualOnly)).toThrow(
      /Unable to identify a safe physical LAN interface/,
    );
  });

  it('validates host against custom mock interfaces', () => {
    const mockInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      'eth0': [
        {
          address: '10.0.0.25',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:11:22:33:44:55',
          internal: false,
          cidr: '10.0.0.25/24',
        },
      ],
    };

    expect(validateHostAddress('10.0.0.25', mockInterfaces)).toBe('10.0.0.25');
    expect(() => validateHostAddress('10.0.0.26', mockInterfaces)).toThrow(
      /does not correspond to any active local network interface/,
    );
  });
});

describe('test-server range parsing', () => {
  const size = 1000;

  it('returns null when no range is provided', () => {
    expect(parseRange('', size)).toBeNull();
  });

  it('parses explicit start and end', () => {
    expect(parseRange('bytes=0-499', size)).toEqual({ start: 0, end: 499 });
  });

  it('parses open-ended start', () => {
    expect(parseRange('bytes=500-', size)).toEqual({ start: 500, end: 999 });
  });

  it('parses suffix range', () => {
    expect(parseRange('bytes=-200', size)).toEqual({ start: 800, end: 999 });
  });

  it('returns invalid when start >= fileSize', () => {
    expect(parseRange('bytes=1000-', size)).toBe('invalid');
  });

  it('returns invalid when start > end', () => {
    expect(parseRange('bytes=500-400', size)).toBe('invalid');
  });

  it('returns invalid on non-numeric values', () => {
    expect(parseRange('bytes=abc-def', size)).toBe('invalid');
  });
});

describe('test-server HTTP requests', () => {
  let server: http.Server;
  let serverPort: number;

  beforeAll(async () => {
    server = createTestServer();
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          serverPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  function request(
    options: http.RequestOptions,
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: serverPort,
          ...options,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(Buffer.from(c)));
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode || 0,
              headers: res.headers,
              body: Buffer.concat(chunks),
            });
          });
        },
      );
      req.on('error', reject);
      req.end();
    });
  }

  it('serves synthetic_test.mp4 with 200 OK and correct headers', async () => {
    const res = await request({ path: '/synthetic_test.mp4', method: 'GET' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('video/mp4');
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(Number(res.headers['content-length'])).toBeGreaterThan(900000);
    expect(res.body.length).toBe(Number(res.headers['content-length']));
  });

  it('serves 206 Partial Content for byte range request', async () => {
    const res = await request({
      path: '/synthetic_test.mp4',
      method: 'GET',
      headers: { Range: 'bytes=0-99' },
    });
    expect(res.statusCode).toBe(206);
    expect(res.headers['content-type']).toBe('video/mp4');
    expect(res.headers['content-length']).toBe('100');
    expect(res.headers['content-range']).toMatch(/^bytes 0-99\/\d+$/);
    expect(res.body.length).toBe(100);
  });

  it('serves 206 Partial Content for suffix range request', async () => {
    const res = await request({
      path: '/synthetic_test.mp4',
      method: 'GET',
      headers: { Range: 'bytes=-50' },
    });
    expect(res.statusCode).toBe(206);
    expect(res.headers['content-length']).toBe('50');
    expect(res.body.length).toBe(50);
  });

  it('serves 416 Range Not Satisfiable for out of bounds range', async () => {
    const res = await request({
      path: '/synthetic_test.mp4',
      method: 'GET',
      headers: { Range: 'bytes=99999999-999999999' },
    });
    expect(res.statusCode).toBe(416);
    expect(res.headers['content-range']).toMatch(/^bytes \*\/\d+$/);
  });

  it('responds to HEAD requests with empty body and correct content length', async () => {
    const res = await request({ path: '/synthetic_test.mp4', method: 'HEAD' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('video/mp4');
    expect(Number(res.headers['content-length'])).toBeGreaterThan(900000);
    expect(res.body.length).toBe(0);
  });

  it('blocks path traversal attempts with 403 Forbidden', async () => {
    const res = await request({ path: '/%2e%2e/%2e%2e/package.json', method: 'GET' });
    expect(res.statusCode).toBe(403);
  });

  it('strictly rejects unapproved files outside the whitelist with 404', async () => {
    const res = await request({ path: '/unapproved.mp4', method: 'GET' });
    expect(res.statusCode).toBe(404);
    expect(res.body.toString()).toContain('Unapproved fixture file');
  });

  it('serves approved synthetic_test.m3u playlist with 200 OK', async () => {
    const res = await request({ path: '/synthetic_test.m3u', method: 'GET' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/x-mpegurl');
    expect(res.body.toString()).toContain('#EXTM3U');
  });

  it('exposes ALLOWED_FIXTURE_FILES with only synthetic_test.mp4 and synthetic_test.m3u', () => {
    expect(ALLOWED_FIXTURE_FILES.has('synthetic_test.mp4')).toBe(true);
    expect(ALLOWED_FIXTURE_FILES.has('synthetic_test.m3u')).toBe(true);
    expect(ALLOWED_FIXTURE_FILES.size).toBe(2);
  });
});
