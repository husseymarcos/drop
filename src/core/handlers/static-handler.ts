export class StaticHandler {
  async handle(asset: 'css' | 'js'): Promise<Response> {
    const path = asset === 'css' ? '../views/common.css' : '../views/countdown.js';
    const contentType = asset === 'css'
      ? 'text/css; charset=utf-8'
      : 'application/javascript; charset=utf-8';
    const file = Bun.file(new URL(path, import.meta.url));
    return new Response(file, {
      headers: { 'Content-Type': contentType },
    });
  }
}
