export type TemplateName = 'root' | 'download' | 'not-found';

export type TemplateContext = {
  filename?: string;
  path?: string;
  expiresAt?: string;
};

const pathMap: Record<TemplateName, string> = {
  'root': '../views/root.html',
  'download': '../views/download.html',
  'not-found': '../views/not-found.html',
};

export async function renderTemplate(
  name: TemplateName,
  context: TemplateContext,
): Promise<string> {
  const htmlFile = Bun.file(new URL(pathMap[name], import.meta.url));
  const template = await htmlFile.text();

  let result = template;
  result = result.replace(/{{FILENAME}}/g, context.filename ?? '');
  result = result.replace(/{{PATH}}/g, context.path ?? '');
  result = result.replace(/{{EXPIRES_AT}}/g, context.expiresAt ?? '');

  return result;
}

export async function renderNotFound(): Promise<Response> {
  const html = await renderTemplate('not-found', {});
  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
