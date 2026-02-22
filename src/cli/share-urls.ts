import type { DropConfig } from '../types/config.ts';
import { toMdnsHost } from '../core/mdns.ts';

export function buildShareUrls(
  config: DropConfig,
  baseUrl: string,
  sessionId: string,
  includeAlias: boolean,
): { lanUrl: string; aliasUrl?: string } {
  const pathSegment = sessionId ? `/${sessionId}` : '/';
  const lanUrl = `${baseUrl.replace(/\/$/, '')}${pathSegment}`;
  if (!config.alias || !includeAlias) {
    return { lanUrl };
  }
  const url = new URL(baseUrl);
  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  const portSuffix = port === '80' ? '' : `:${port}`;
  return {
    lanUrl,
    aliasUrl: `http://${toMdnsHost(config.alias)}${portSuffix}${pathSegment}`,
  };
}
