/**
 * Session types for managing file sharing sessions
 */

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
