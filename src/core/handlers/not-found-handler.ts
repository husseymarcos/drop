import { renderTemplate } from '../template-renderer.ts';

export class NotFoundHandler {
  async handle(): Promise<Response> {
    const html = await renderTemplate('not-found', {});
    return new Response(html, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
