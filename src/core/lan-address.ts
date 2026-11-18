import type { NetworkInterfaceInfo } from 'node:os';

type Interfaces = NodeJS.Dict<NetworkInterfaceInfo[]>;

const IPV4_LITERAL = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const VIRTUAL_INTERFACE = new RegExp(
  '^(utun|tun|tap|wg|ppp|ipsec|tailscale|zt|docker|br-|veth|vmnet|vboxnet|bridge|llw|awdl|anpi|gif|stf)',
  'i',
);
const PHYSICAL_INTERFACE = /^(en|eth|wlan|wl|wifi)/i;

type Candidate = { name: string; address: string };

export function pickLanAddress(interfaces: Interfaces, preference?: string): string {
  if (preference && IPV4_LITERAL.test(preference)) {
    return preference;
  }

  const candidates = lanCandidates(interfaces);

  if (preference) {
    const named = candidates.find((candidate) => candidate.name === preference);
    if (!named) {
      throw new Error(
        `No IPv4 address on interface "${preference}". Available: ${describe(candidates)}`,
      );
    }
    return named.address;
  }

  const [best] = [...candidates].sort((a, b) => score(b) - score(a));
  return best?.address ?? 'localhost';
}

function lanCandidates(interfaces: Interfaces): Candidate[] {
  return Object.entries(interfaces).flatMap(([name, infos]) =>
    (infos ?? [])
      .filter((info) => info.family === 'IPv4' && !info.internal)
      .filter((info) => !info.address.startsWith('169.254.'))
      .map((info) => ({ name, address: info.address })),
  );
}

function score({ name, address }: Candidate): number {
  let points = 0;
  if (PHYSICAL_INTERFACE.test(name)) points += 4;
  if (VIRTUAL_INTERFACE.test(name)) points -= 8;
  if (address.startsWith('192.168.')) points += 3;
  else if (address.startsWith('10.')) points += 2;
  else if (/^172\.(1[6-9]|2\d|3[01])\./.test(address)) points += 1;
  else if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(address)) points -= 4;
  return points;
}

function describe(candidates: Candidate[]): string {
  if (candidates.length === 0) return 'none';
  return candidates.map(({ name, address }) => `${name} (${address})`).join(', ');
}
