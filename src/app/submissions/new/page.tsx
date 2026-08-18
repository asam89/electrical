import { NewSubmissionForm } from '@/components/NewSubmissionForm';

export default function NewSubmissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New submission</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload a panel schedule, single-line diagram or load calculation (PDF or image, max 12 MB). Extraction runs
          immediately and usually takes 10–30 seconds.
        </p>
      </div>
      <NewSubmissionForm />
    </div>
  );
}
