import type { Finding, SubmissionStatus } from '@prisma/client';

export type Triage = {
  total: number;
  failures: number;
  untriagedFailures: number;
  confirmed: number;
  waived: number;
  dismissed: number;
  insufficient: number;
  passes: number;
};

export function summarize(findings: Finding[]): Triage {
  const failures = findings.filter((f) => f.status === 'FAIL');
  return {
    total: findings.length,
    failures: failures.length,
    untriagedFailures: failures.filter((f) => f.decision === 'PENDING').length,
    confirmed: failures.filter((f) => f.decision === 'CONFIRMED').length,
    waived: failures.filter((f) => f.decision === 'WAIVED').length,
    dismissed: failures.filter((f) => f.decision === 'FALSE_POSITIVE').length,
    insufficient: findings.filter((f) => f.status === 'INSUFFICIENT_DATA').length,
    passes: findings.filter((f) => f.status === 'PASS').length,
  };
}

/**
 * Recomputes the workflow status from the reviewer's triage decisions. APPROVED is
 * never derived here: only an explicit human action sets it.
 */
export function derivedStatus(findings: Finding[], current: SubmissionStatus): SubmissionStatus {
  if (current === 'APPROVED') return current;
  const t = summarize(findings);
  if (t.confirmed > 0 && t.untriagedFailures === 0) return 'RESUBMISSION_REQUESTED';
  if (t.failures > 0 && t.untriagedFailures > 0) return 'DEFICIENCIES_FOUND';
  return 'PENDING_REVIEW';
}

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  PENDING_REVIEW: 'Pending Review',
  DEFICIENCIES_FOUND: 'Deficiencies Found',
  RESUBMISSION_REQUESTED: 'Resubmission Requested',
  APPROVED: 'Approved',
};

export const STATUS_CLASSES: Record<SubmissionStatus, string> = {
  PENDING_REVIEW: 'bg-slate-100 text-slate-700 ring-slate-300',
  DEFICIENCIES_FOUND: 'bg-amber-50 text-amber-800 ring-amber-300',
  RESUBMISSION_REQUESTED: 'bg-red-50 text-red-700 ring-red-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
};
