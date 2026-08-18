import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildLetter } from '@/lib/letter';

async function loadLetter(id: string) {
  const submission = await prisma.submission.findUnique({ where: { id }, include: { findings: true } });
  if (!submission) return null;
  return { submission, ...buildLetter(submission, submission.findings) };
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const result = await loadLetter(params.id);
  if (!result) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  const untriaged = result.submission.findings.filter((f) => f.status === 'FAIL' && f.decision === 'PENDING');
  if (untriaged.length > 0) {
    return NextResponse.json(
      { error: `Triage all flagged findings first — ${untriaged.length} still undecided.` },
      { status: 409 },
    );
  }

  const letter = await prisma.letter.create({
    data: { submissionId: result.submission.id, type: result.type, body: result.body },
  });

  return NextResponse.json({ id: letter.id, type: letter.type, body: letter.body });
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const latest = await prisma.letter.findFirst({
    where: { submissionId: params.id },
    orderBy: { createdAt: 'desc' },
    include: { submission: true },
  });
  if (!latest) return NextResponse.json({ error: 'No letter has been generated yet.' }, { status: 404 });

  const slug = latest.submission.projectName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const fileName = `${latest.type === 'APPROVAL' ? 'approval' : 'deficiency'}-letter-${slug || 'submission'}.txt`;

  return new NextResponse(latest.body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'content-disposition': `attachment; filename="${fileName}"`,
    },
  });
}
