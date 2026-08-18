import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runComplianceCheck } from '@/lib/claude';
import { extractionSchema } from '@/lib/schemas';
import { getRule } from '@/lib/rules';
import { derivedStatus } from '@/lib/status';

export const maxDuration = 180;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const submission = await prisma.submission.findUnique({ where: { id: params.id } });
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  if (!submission.extraction) {
    return NextResponse.json(
      { error: 'No extracted data to analyse — extraction did not succeed for this submission.' },
      { status: 409 },
    );
  }

  const extraction = extractionSchema.parse(submission.extraction);

  let analysis;
  try {
    analysis = await runComplianceCheck(extraction);
  } catch (error) {
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        analysisNote: `Compliance screen failed — please review manually. (${
          error instanceof Error ? error.message : 'unknown error'
        })`,
      },
    });
    return NextResponse.json({ error: 'Compliance screen failed. See the submission page for details.' }, { status: 502 });
  }

  const data = analysis.results.flatMap((result) => {
    const rule = getRule(result.ruleId);
    if (!rule) return [];
    return [
      {
        submissionId: submission.id,
        ruleId: rule.id,
        ruleTitle: rule.title,
        ruleCitation: rule.citation,
        status: result.status === 'pass' ? ('PASS' as const) : result.status === 'fail' ? ('FAIL' as const) : ('INSUFFICIENT_DATA' as const),
        explanation: result.explanation,
        evidence: result.evidence,
      },
    ];
  });

  await prisma.$transaction([
    prisma.finding.deleteMany({ where: { submissionId: submission.id } }),
    prisma.finding.createMany({ data }),
  ]);

  const findings = await prisma.finding.findMany({ where: { submissionId: submission.id } });
  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      analyzedAt: new Date(),
      analysisNote: null,
      status: derivedStatus(findings, submission.status),
    },
  });

  return NextResponse.json({ findings: data.length });
}
