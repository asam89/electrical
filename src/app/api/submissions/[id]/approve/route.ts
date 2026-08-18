import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Explicit human sign-off. Nothing else in the app may set APPROVED. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const submission = await prisma.submission.findUnique({ where: { id: params.id }, include: { findings: true } });
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  const blocking = submission.findings.filter(
    (f) => f.status === 'FAIL' && (f.decision === 'PENDING' || f.decision === 'CONFIRMED'),
  );
  if (blocking.length > 0) {
    return NextResponse.json(
      { error: `Cannot approve: ${blocking.length} flagged finding(s) are still open or confirmed as issues.` },
      { status: 409 },
    );
  }

  await prisma.submission.update({ where: { id: submission.id }, data: { status: 'APPROVED' } });
  return NextResponse.json({ ok: true });
}
