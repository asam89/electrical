'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NewSubmissionForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: new FormData(event.currentTarget),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'Upload failed.');
        return;
      }
      router.push(`/submissions/${json.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded border border-slate-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Project name</span>
          <input
            name="projectName"
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="123 Maple St — service upgrade"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Submitter name</span>
          <input
            name="submitterName"
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Contractor or designer"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Submission date</span>
          <input
            type="date"
            name="submissionDate"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Submission file (PDF or image)</span>
          <input
            type="file"
            name="file"
            required
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium">Short project description</span>
        <textarea
          name="description"
          rows={4}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          placeholder="200 A residential service upgrade, new 40-space panel, existing knob-and-tube branch circuits replaced."
        />
      </label>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? 'Extracting submission…' : 'Upload and extract'}
      </button>
      {submitting && (
        <p className="text-xs text-slate-500">
          Reading the document with Claude — this can take up to 30 seconds for a scanned drawing.
        </p>
      )}
    </form>
  );
}
