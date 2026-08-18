import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { extractionSchema } from '@/lib/schemas';
import { STATUS_CLASSES, STATUS_LABELS, summarize } from '@/lib/status';
import { PLACEHOLDER_DISCLAIMER, rules } from '@/lib/rules';
import { ExtractionSummary } from '@/components/ExtractionSummary';
import { FindingsList } from '@/components/FindingsList';
import { AnalyzeButton } from '@/components/AnalyzeButton';
import { LetterPanel } from '@/components/LetterPanel';
import { ApproveButton } from '@/components/ApproveButton';

export const dynamic = 'force-dynamic';

export default async function SubmissionPage({ params }: { params: { id: string } }) {
  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { findings: { orderBy: { ruleId: 'asc' } }, letters: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!submission) notFound();

  const parsedExtraction = submission.extraction ? extractionSchema.safeParse(submission.extraction) : null;
  const extraction = parsedExtraction?.success ? parsedExtraction.data : null;
  const triage = summarize(submission.findings);
  const latestLetter = submission.letters[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← All submissions
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{submission.projectName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Submitted by {submission.submitterName} on {submission.submissionDate.toISOString().slice(0, 10)} ·{' '}
            <a href={`/api/submissions/${submission.id}/file`} target="_blank" className="text-blue-700 hover:underline">
              {submission.fileName}
            </a>
          </p>
        </div>
        <span className={`rounded px-3 py-1.5 text-sm font-medium ring-1 ${STATUS_CLASSES[submission.status]}`}>
          {STATUS_LABELS[submission.status]}
        </span>
      </div>

      {submission.extractionNote && (
        <p className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {submission.extractionNote}
        </p>
      )}
      {submission.analysisNote && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{submission.analysisNote}</p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Here&apos;s what we found in your submission</h2>
        {extraction ? (
          <ExtractionSummary extraction={extraction} description={submission.description} />
        ) : (
          <p className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Could not extract structured data from this document — please review it manually.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Compliance screen{' '}
            <span className="text-sm font-normal text-slate-500">
              {submission.analyzedAt
                ? `· ${triage.passes} pass · ${triage.failures} flagged · ${triage.insufficient} insufficient data`
                : `· ${rules.length} demo rules not yet run`}
            </span>
          </h2>
          <AnalyzeButton submissionId={submission.id} hasExtraction={extraction !== null} hasRun={submission.analyzedAt !== null} />
        </div>
        <p className="rounded bg-slate-100 px-3 py-2 text-xs text-slate-600">{PLACEHOLDER_DISCLAIMER}</p>
        <FindingsList findings={submission.findings} />
      </section>

      {submission.findings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Letter</h2>
          <LetterPanel
            submissionId={submission.id}
            untriagedFailures={triage.untriagedFailures}
            confirmed={triage.confirmed}
            existingLetter={latestLetter ? { type: latestLetter.type, body: latestLetter.body } : null}
          />
          <ApproveButton
            submissionId={submission.id}
            disabled={submission.status === 'APPROVED' || triage.untriagedFailures > 0 || triage.confirmed > 0}
            approved={submission.status === 'APPROVED'}
          />
        </section>
      )}
    </div>
  );
}
