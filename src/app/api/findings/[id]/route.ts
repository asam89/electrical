import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decisionSchema } from '@/lib/schemas';
import { derivedStatus } from '@/lib/status';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const parsed = decisionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const finding = await prisma.finding.findUnique({ where: { id: params.id }, include: { submission: true } });
  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 });

  await prisma.finding.update({
    where: { id: finding.id },
    data: { decision: parsed.data.decision, decisionNote: parsed.data.note },
  });

  const findings = await prisma.finding.findMany({ where: { submissionId: finding.submissionId } });
  await prisma.submission.update({
    where: { id: finding.submissionId },
    data: { status: derivedStatus(findings, finding.submission.status) },
  });

  return NextResponse.json({ ok: true });
}
