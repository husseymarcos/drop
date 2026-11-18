import { formatBytes } from './utils.ts';

export type DropAddress =
  | { kind: 'slug'; value: string }
  | { kind: 'root' };

export type DropBody = Blob | ReadableStream<Uint8Array>;

export type DropContent = {
  fileName: string;
  mimeType: string;
  size: number;
  body: () => DropBody;
};

export const rootAddress: DropAddress = { kind: 'root' };

export function slugAddress(value: string): DropAddress {
  return { kind: 'slug', value };
}

export function pathFor(address: DropAddress): string {
  return address.kind === 'root' ? '/' : `/${address.value}`;
}

export class Drop {
  constructor(
    public readonly address: DropAddress,
    public readonly fileName: string,
    public readonly fileSize: number,
    public readonly mimeType: string,
    public readonly openBody: () => DropBody,
    public readonly expiresAt: Date,
  ) {}

  get sizeLabel(): string {
    return formatBytes(this.fileSize);
  }
}
