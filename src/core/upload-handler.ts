import type { DropSession } from '../types/session.ts';
import type { SessionManager } from './session-manager.ts';

type FormDataRead = {
  get(name: string): unknown;
  getAll(name: string): unknown[];
};

export type UploadJsonPayload = {
  slug: string;
  fileName: string;
  expiresAt: string;
  fileSize: number;
  mimeType: string;
};

export type UploadFormResult =
  | { ok: false; status: 400; body: string }
  | { ok: true; payload: UploadJsonPayload };

export interface UploadResult {
  session: Awaited<ReturnType<SessionManager['createUploadSession']>>;
}

export async function handleUpload(
  formData: FormDataRead,
  sessionManager: SessionManager,
  durationMs: number,
): Promise<UploadFormResult> {
  const files = formData.getAll('file').filter((value) => value instanceof File) as File[];

  if (files.length === 0) {
    return { ok: false, status: 400, body: 'Missing file' };
  }

  const directoryNameField = formData.get('directoryName');
  const directoryName = typeof directoryNameField === 'string' && directoryNameField.trim().length > 0
    ? directoryNameField.trim()
    : undefined;

  let session: DropSession;

  if (files.length === 1 && !directoryName) {
    const result = await handleUploadSingle(files[0]!, sessionManager, durationMs);
    session = result.session;
  }
  else {
    const result = await handleUploadMultiple(files, directoryName, sessionManager, durationMs);
    session = result.session;
  }

  return {
    ok: true,
    payload: {
      slug: session.id,
      fileName: session.fileName,
      expiresAt: session.expiresAt.toISOString(),
      fileSize: session.fileSize,
      mimeType: session.mimeType,
    },
  };
}

export async function handleUploadSingle(
  file: File,
  sessionManager: SessionManager,
  durationMs: number,
): Promise<UploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const data = Buffer.from(arrayBuffer);
  const fileName = file.name || 'upload';

  const session = await sessionManager.createUploadSession(
    fileName,
    data,
    durationMs,
  );

  return { session };
}

export async function handleUploadMultiple(
  files: File[],
  directoryName: string | undefined,
  sessionManager: SessionManager,
  durationMs: number,
): Promise<UploadResult> {
  const archiveEntries: Record<string, Uint8Array> = {};

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    archiveEntries[file.name] = new Uint8Array(arrayBuffer);
  }

  const archive = new Bun.Archive(archiveEntries);
  const archiveBlob = await archive.blob();
  const archiveBuffer = Buffer.from(await archiveBlob.arrayBuffer());

  const inferredDirectoryName = directoryName
    ?? (files[0]?.name?.split('/')[0] || 'directory');

  const archiveFileName = `${inferredDirectoryName}.tar`;

  const session = await sessionManager.createUploadSession(
    archiveFileName,
    archiveBuffer,
    durationMs,
  );

  return { session };
}
