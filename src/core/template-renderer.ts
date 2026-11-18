import commonCss from '../views/common.css' with { type: 'text' };
import countdownJs from '../views/countdown.js' with { type: 'text' };
import downloadHtml from '../views/download.html' with { type: 'text' };
import expiredHtml from '../views/expired.html' with { type: 'text' };
import notFoundHtml from '../views/not-found.html' with { type: 'text' };
import rootHtml from '../views/root.html' with { type: 'text' };

export type TemplateName = 'root' | 'download' | 'not-found' | 'expired';

export type TemplateContext = {
  filename?: string;
  size?: string;
  path?: string;
  expiresAt?: string;
};

const templates: Record<TemplateName, string> = {
  'root': asText(rootHtml),
  'download': asText(downloadHtml),
  'not-found': asText(notFoundHtml),
  'expired': asText(expiredHtml),
};

export const staticAssets = {
  css: asText(commonCss),
  countdown: asText(countdownJs),
};

export function renderTemplate(name: TemplateName, context: TemplateContext): string {
  return templates[name]
    .replace(/{{FILENAME}}/g, escapeHtml(context.filename ?? ''))
    .replace(/{{SIZE}}/g, escapeHtml(context.size ?? ''))
    .replace(/{{PATH}}/g, escapeHtml(context.path ?? ''))
    .replace(/{{EXPIRES_AT}}/g, escapeHtml(context.expiresAt ?? ''));
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function renderNotFound(): Response {
  return htmlResponse(renderTemplate('not-found', {}), 404);
}

export function renderExpired(): Response {
  return htmlResponse(renderTemplate('expired', {}), 410);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function asText(module: unknown): string {
  return module as string;
}
