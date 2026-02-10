export interface DropSession {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  data: Buffer;
  expiresAt: Date;
  isConsumed: boolean;
  downloadCount: number;
}
