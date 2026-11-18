import { renderUnicodeCompact } from 'uqr';

export type ShareUrls = { lanUrl: string; aliasUrl?: string };

export function renderQr(url: string): string {
  return renderUnicodeCompact(url, { border: 2 });
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

export function renderShareCard(options: {
  title: string;
  urls: ShareUrls;
  qr: string;
}): string {
  const { title, urls, qr } = options;
  const lines = ['', qr, '', `  ${title}`, ''];

  if (urls.aliasUrl) {
    lines.push(`  ${urls.aliasUrl}`);
    lines.push(`  ${urls.lanUrl}   (use this one if the .local name does not open)`);
  }
  else {
    lines.push(`  ${urls.lanUrl}`);
  }

  lines.push('', '  Scan the code or open the link on a device on the same Wi-Fi.');
  lines.push('  Press q or Ctrl-C to stop sharing.', '');
  return lines.join('\n');
}

export class LiveStatus {
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private out: NodeJS.WriteStream,
    private expiresAt: number,
    private now: () => number = Date.now,
  ) {}

  start(): void {
    if (!this.out.isTTY) return;
    this.render();
    this.timer = setInterval(() => this.render(), 1000);
  }

  log(message: string): void {
    if (this.out.isTTY) this.out.write('\r\x1b[2K');
    this.out.write(`  ${message}\n`);
    if (this.timer) this.render();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    if (this.out.isTTY) this.out.write('\r\x1b[2K');
  }

  private render(): void {
    const left = formatRemaining(this.expiresAt - this.now());
    this.out.write(`\r\x1b[2K  Link expires in ${left}`);
  }
}
