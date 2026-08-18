'use client';

import type { Finding } from '@prisma/client';
import { FindingCard } from '@/components/FindingCard';

export function FindingsList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-600">
        No findings yet — run the compliance screen.
      </p>
    );
  }

  const order = { FAIL: 0, INSUFFICIENT_DATA: 1, PASS: 2 } as const;
  const sorted = [...findings].sort((a, b) => order[a.status] - order[b.status] || a.ruleId.localeCompare(b.ruleId));

  return (
    <ul className="space-y-3">
      {sorted.map((finding) => (
        <li key={finding.id}>
          <FindingCard finding={finding} />
        </li>
      ))}
    </ul>
  );
}
