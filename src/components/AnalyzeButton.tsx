'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AnalyzeButton({
  submissionId,
  hasExtraction,
  hasRun,
}: {
  submissionId: string;
  hasExtraction: boolean;
  hasRun: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setRunning(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/analyze`, { method: 'POST' });
      const json = await response.json();
      if (!response.ok) setError(json.error ?? 'Compliance screen failed.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Compliance screen failed.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={run}
        disabled={running || !hasExtraction}
        className="rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {running ? 'Screening…' : hasRun ? 'Re-run compliance screen' : 'Run compliance screen'}
      </button>
      {!hasExtraction && <p className="mt-1 text-xs text-slate-500">No extracted data to screen.</p>}
      {hasRun && <p className="mt-1 text-xs text-amber-700">Re-running clears existing triage decisions.</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
