export class Drop {
  constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly fileSize: number,
    public readonly mimeType: string,
    public readonly data: Buffer,
    public readonly expiresAt: Date,
    private _downloadCount = 0,
  ) {}

  get downloadCount(): number {
    return this._downloadCount;
  }

  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  consume(): void {
    this._downloadCount++;
  }
}
