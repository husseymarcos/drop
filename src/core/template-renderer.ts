export type TemplateName = 'root' | 'download' | 'not-found';

export type TemplateContext = {
  filename?: string;
  slug?: string;
  expiresAt?: string;
};

export async function renderTemplate(
  name: TemplateName,
  context: TemplateContext,
): Promise<string> {
  const pathMap: Record<TemplateName, string> = {
    'root': '../views/root.html',
    'download': '../views/download.html',
    'not-found': '../views/not-found.html',
  };

  const htmlFile = Bun.file(new URL(pathMap[name], import.meta.url));
  const template = await htmlFile.text();

  let result = template;
  result = result.replace(/{{FILENAME}}/g, context.filename ?? '');
  result = result.replace(/{{SLUG}}/g, context.slug ?? '');
  result = result.replace(/{{EXPIRES_AT}}/g, context.expiresAt ?? '');

  return result;
}
