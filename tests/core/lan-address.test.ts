import { describe, expect, it } from 'bun:test';
import type { NetworkInterfaceInfo } from 'node:os';
import { pickLanAddress } from '../../src/core/lan-address.ts';

const ipv4 = (address: string, internal = false): NetworkInterfaceInfo => ({
  address,
  family: 'IPv4',
  internal,
  netmask: '255.255.255.0',
  mac: '00:00:00:00:00:00',
  cidr: `${address}/24`,
});

describe('pickLanAddress', () => {
  it('prefers the Wi-Fi/Ethernet address over a VPN tunnel listed first', () => {
    const interfaces = {
      lo0: [ipv4('127.0.0.1', true)],
      utun4: [ipv4('100.101.102.103')],
      en0: [ipv4('192.168.1.15')],
    };
    expect(pickLanAddress(interfaces)).toBe('192.168.1.15');
  });

  it('skips link-local and container bridge addresses', () => {
    const interfaces = {
      bridge100: [ipv4('192.168.64.1')],
      en5: [ipv4('169.254.10.2')],
      eth0: [ipv4('10.0.0.42')],
    };
    expect(pickLanAddress(interfaces)).toBe('10.0.0.42');
  });

  it('uses the named interface when one is requested', () => {
    const interfaces = { en0: [ipv4('192.168.1.15')], en7: [ipv4('10.1.2.3')] };
    expect(pickLanAddress(interfaces, 'en7')).toBe('10.1.2.3');
  });

  it('uses an explicit IPv4 address as given', () => {
    expect(pickLanAddress({}, '192.168.50.9')).toBe('192.168.50.9');
  });

  it('names the available interfaces when the requested one is unknown', () => {
    const interfaces = { en0: [ipv4('192.168.1.15')] };
    expect(() => pickLanAddress(interfaces, 'wlan9')).toThrow('en0 (192.168.1.15)');
  });

  it('falls back to localhost when nothing is reachable', () => {
    expect(pickLanAddress({ lo0: [ipv4('127.0.0.1', true)] })).toBe('localhost');
  });
});
