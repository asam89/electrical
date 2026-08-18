'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ApproveButton({
  submissionId,
  disabled,
  approved,
}: {
  submissionId: string;
  disabled: boolean;
  approved: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/approve`, { method: 'POST' });
      const json = await response.json();
      if (!response.ok) setError(json.error ?? 'Could not approve.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not approve.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-600">
        Marking a submission approved is a human action. The tool never approves on its own, and this record is not a
        substitute for the signed letter.
      </p>
      <button
        onClick={approve}
        disabled={disabled || saving}
        className="mt-3 rounded bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        {approved ? 'Approved by engineer' : saving ? 'Saving…' : 'Mark approved (engineer sign-off)'}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
