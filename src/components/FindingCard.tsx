'use client';

import type { Finding, ReviewerDecision } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STATUS_BADGE: Record<Finding['status'], { label: string; className: string }> = {
  PASS: { label: 'Pass', className: 'bg-emerald-50 text-emerald-700 ring-emerald-300' },
  FAIL: { label: 'Flagged', className: 'bg-red-50 text-red-700 ring-red-300' },
  INSUFFICIENT_DATA: { label: 'Insufficient data', className: 'bg-slate-100 text-slate-700 ring-slate-300' },
};

const DECISION_LABEL: Record<ReviewerDecision, string> = {
  PENDING: 'Not triaged',
  CONFIRMED: 'Confirmed issue',
  FALSE_POSITIVE: 'False positive — dismissed',
  WAIVED: 'Waived — proceed anyway',
};

export function FindingCard({ finding }: { finding: Finding }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(finding.decisionNote);
  const [error, setError] = useState<string | null>(null);
  const badge = STATUS_BADGE[finding.status];

  async function decide(decision: ReviewerDecision) {
    if (decision === 'WAIVED' && note.trim().length === 0) {
      setError('A note is required when waiving a finding.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/findings/${finding.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      const json = await response.json();
      if (!response.ok) setError(json.error ?? 'Could not save decision.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save decision.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            <span className="text-slate-400">{finding.ruleId}</span> {finding.ruleTitle}
          </p>
          <p className="text-xs text-slate-500">{finding.ruleCitation}</p>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ring-1 ${badge.className}`}>{badge.label}</span>
      </div>

      <p className="mt-2 text-sm text-slate-700">{finding.explanation}</p>
      {finding.evidence && <p className="mt-1 text-xs text-slate-500">Basis: {finding.evidence}</p>}

      {finding.status === 'FAIL' && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Reviewer decision:</span>
            <span className={`text-xs font-medium ${finding.decision === 'PENDING' ? 'text-amber-700' : 'text-slate-900'}`}>
              {DECISION_LABEL[finding.decision]}
            </span>
          </div>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reviewer note (required to waive)"
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => decide('CONFIRMED')}
              disabled={saving}
              className="rounded bg-red-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              Confirmed issue
            </button>
            <button
              onClick={() => decide('FALSE_POSITIVE')}
              disabled={saving}
              className="rounded bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-300 disabled:opacity-50"
            >
              False positive — dismiss
            </button>
            <button
              onClick={() => decide('WAIVED')}
              disabled={saving}
              className="rounded bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-400 disabled:opacity-50"
            >
              Waived — proceed anyway
            </button>
            {finding.decision !== 'PENDING' && (
              <button
                onClick={() => decide('PENDING')}
                disabled={saving}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Reset
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
