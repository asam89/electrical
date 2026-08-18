import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadDir } from '@/lib/storage';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const submission = await prisma.submission.findUnique({ where: { id: params.id } });
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  const filePath = path.join(uploadDir(), path.basename(submission.storedFileName));
  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: 'Stored file is no longer available.' }, { status: 404 });
  }

  const stream = createReadStream(filePath) as unknown as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      'content-type': submission.fileMimeType,
      'content-disposition': `inline; filename="${submission.fileName.replace(/"/g, '')}"`,
    },
  });
}
