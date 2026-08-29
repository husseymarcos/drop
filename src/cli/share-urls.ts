import type { DropConfig } from '../types.ts';
import { toMdnsHost } from '../core/mdns.ts';

export function buildShareUrls(
  config: DropConfig,
  baseUrl: string,
  sessionId: string,
  includeAlias: boolean,
): { lanUrl: string; aliasUrl?: string } {
  const path = sessionId ? `/${sessionId}` : '/';
  const base = new URL(baseUrl);
  const lanUrl = new URL(path, base).toString();

  if (!config.alias || !includeAlias) {
    return { lanUrl };
  }

  const aliasBase = `http://${toMdnsHost(config.alias)}${base.port ? `:${base.port}` : ''}`;
  return { lanUrl, aliasUrl: new URL(path, aliasBase).toString() };
}
