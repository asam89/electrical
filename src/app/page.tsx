import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { STATUS_CLASSES, STATUS_LABELS } from '@/lib/status';

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    include: { findings: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Submissions</h1>
        <p className="mt-1 text-sm text-slate-600">
          First-pass AI screening of electrical safety submissions. Every submission still requires engineer sign-off.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">No submissions yet.</p>
          <Link href="/submissions/new" className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline">
            Upload the first submission
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Submitter</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Findings</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((submission) => {
                const failures = submission.findings.filter((f) => f.status === 'FAIL').length;
                return (
                  <tr key={submission.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/submissions/${submission.id}`} className="font-medium text-blue-700 hover:underline">
                        {submission.projectName}
                      </Link>
                      <div className="text-xs text-slate-500">{submission.fileName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{submission.submitterName}</td>
                    <td className="px-4 py-3 text-slate-700">{submission.submissionDate.toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {submission.findings.length === 0 ? 'Not screened' : `${failures} flagged / ${submission.findings.length}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-medium ring-1 ${STATUS_CLASSES[submission.status]}`}>
                        {STATUS_LABELS[submission.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
