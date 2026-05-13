import type { DropConfig } from '../types.ts';
import { toMdnsHost } from '../core/mdns.ts';

function portSuffix(port: string): string {
  return port === '80' || port === '443' ? '' : `:${port}`;
}

export function buildShareUrls(
  config: DropConfig,
  baseUrl: string,
  sessionId: string,
  includeAlias: boolean,
): { lanUrl: string; aliasUrl?: string } {
  const pathSegment = sessionId ? `/${sessionId}` : '/';
  const url = new URL(baseUrl);
  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  const suffix = portSuffix(port);
  const lanUrl = `${url.protocol}//${url.hostname}${suffix}${pathSegment}`;

  if (!config.alias || !includeAlias) {
    return { lanUrl };
  }

  return {
    lanUrl,
    aliasUrl: `http://${toMdnsHost(config.alias)}${suffix}${pathSegment}`,
  };
}
