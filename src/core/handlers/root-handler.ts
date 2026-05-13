import { renderTemplate } from '../template-renderer.ts';

export class RootHandler {
  constructor(private durationMs: number) {}

  async handle(): Promise<Response> {
    const html = await renderTemplate('root', {
      expiresAt: new Date(Date.now() + this.durationMs).toISOString(),
    });

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
