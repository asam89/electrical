import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_FILE_BYTES = 12 * 1024 * 1024;

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
}

export async function storeUpload(originalName: string, bytes: Buffer): Promise<string> {
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const storedFileName = `${randomUUID()}${path.extname(originalName).toLowerCase()}`;
  await writeFile(path.join(dir, storedFileName), bytes);
  return storedFileName;
}
