import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { newSubmissionSchema } from '@/lib/schemas';
import { ACCEPTED_MIME_TYPES, MAX_FILE_BYTES, storeUpload } from '@/lib/storage';
import { extractSubmission } from '@/lib/claude';

export const maxDuration = 120;

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = newSubmissionSchema.safeParse({
    projectName: form.get('projectName'),
    submitterName: form.get('submitterName'),
    submissionDate: form.get('submissionDate'),
    description: form.get('description') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'A submission file (PDF or image) is required.' }, { status: 400 });
  }
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Unsupported file type "${file.type}". Upload a PDF, PNG, JPEG or WebP.` }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File is larger than 12 MB.' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storedFileName = await storeUpload(file.name, bytes);

  let extraction = null;
  let extractionNote: string | null = null;
  try {
    extraction = await extractSubmission({
      mimeType: file.type,
      base64: bytes.toString('base64'),
      projectName: parsed.data.projectName,
      submitterName: parsed.data.submitterName,
      description: parsed.data.description,
    });
  } catch (error) {
    extractionNote = `Automatic extraction failed — please review this submission manually. (${
      error instanceof Error ? error.message : 'unknown error'
    })`;
  }

  const submission = await prisma.submission.create({
    data: {
      projectName: parsed.data.projectName,
      submitterName: parsed.data.submitterName,
      submissionDate: new Date(parsed.data.submissionDate),
      description: parsed.data.description,
      fileName: file.name,
      fileMimeType: file.type,
      storedFileName,
      extraction: extraction ?? undefined,
      extractionNote,
    },
  });

  return NextResponse.json({ id: submission.id, extractionFailed: extraction === null });
}
