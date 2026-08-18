import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Electrical Safety Approval Assistant (POC)',
  description: 'AI-assisted first-pass review of electrical safety submissions. Proof of concept.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
          <strong>Proof of concept.</strong> Compliance rules are illustrative placeholders, not verified Canadian
          Electrical Code text. A licensed engineer makes every final determination.
        </div>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold">
              Electrical Safety Approval Assistant
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-slate-600 hover:text-slate-900">
                Submissions
              </Link>
              <Link
                href="/submissions/new"
                className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                New submission
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
