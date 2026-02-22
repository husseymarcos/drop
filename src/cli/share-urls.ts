import type { DropConfig } from '../types/config.ts';
import { toMdnsHost } from '../core/mdns.ts';

function normalizeBaseUrl(url: URL): string {
  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  const portSuffix = port === '80' || port === '443' ? '' : `:${port}`;
  return `${url.protocol}//${url.hostname}${portSuffix}`;
}

export function buildShareUrls(
  config: DropConfig,
  baseUrl: string,
  sessionId: string,
  includeAlias: boolean,
): { lanUrl: string; aliasUrl?: string } {
  const pathSegment = sessionId ? `/${sessionId}` : '/';
  const url = new URL(baseUrl);
  const normalizedBase = normalizeBaseUrl(url);
  const lanUrl = `${normalizedBase}${pathSegment}`;
  if (!config.alias || !includeAlias) {
    return { lanUrl };
  }
  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  const portSuffix = port === '80' || port === '443' ? '' : `:${port}`;
  return {
    lanUrl,
    aliasUrl: `http://${toMdnsHost(config.alias)}${portSuffix}${pathSegment}`,
  };
}
