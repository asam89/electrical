'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LetterPanel({
  submissionId,
  untriagedFailures,
  confirmed,
  existingLetter,
}: {
  submissionId: string;
  untriagedFailures: number;
  confirmed: number;
  existingLetter: { type: string; body: string } | null;
}) {
  const router = useRouter();
  const [letter, setLetter] = useState(existingLetter);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setGenerating(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/letter`, { method: 'POST' });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'Could not generate the letter.');
        return;
      }
      setLetter({ type: json.type, body: json.body });
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate the letter.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3 rounded border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-600">
        {untriagedFailures > 0
          ? `${untriagedFailures} flagged finding(s) still need a decision before a letter can be drafted.`
          : confirmed > 0
            ? `${confirmed} confirmed deficiency(ies) — a deficiency notice will be drafted.`
            : 'No confirmed deficiencies — an approval letter will be drafted for engineer signature.'}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={generate}
          disabled={generating || untriagedFailures > 0}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {generating ? 'Generating…' : 'Generate letter'}
        </button>
        {letter && (
          <a
            href={`/api/submissions/${submissionId}/letter`}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            Download letter (.txt)
          </a>
        )}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {letter && (
        <pre className="max-h-96 overflow-auto rounded bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
          {letter.body}
        </pre>
      )}
    </div>
  );
}
