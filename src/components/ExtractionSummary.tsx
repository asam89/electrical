import type { Extraction } from '@/lib/schemas';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-40 shrink-0 text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value || <span className="text-slate-400">not found</span>}</dd>
    </div>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone: 'ok' | 'warn' }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-medium">{title}</h4>
      <ul className={`mt-1 list-inside list-disc text-sm ${tone === 'warn' ? 'text-amber-800' : 'text-slate-700'}`}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ExtractionSummary({ extraction, description }: { extraction: Extraction; description: string }) {
  const { projectDetails: p, loadCalculations: l } = extraction;
  return (
    <div className="space-y-6 rounded border border-slate-200 bg-white p-5">
      {extraction.summary && <p className="text-sm text-slate-700">{extraction.summary}</p>}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Project details</h3>
          <dl className="space-y-1">
            <Row label="Project" value={p.projectName} />
            <Row label="Address" value={p.address} />
            <Row label="Occupancy" value={p.occupancyType} />
            <Row label="Designer" value={p.designer} />
            <Row label="Date on document" value={p.submissionDate} />
          </dl>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Load calculations</h3>
          <dl className="space-y-1">
            <Row label="Calculated load" value={l.calculatedLoad} />
            <Row label="Service size" value={l.serviceSize} />
            <Row label="Method" value={l.method} />
            <Row label="Notes" value={l.notes} />
          </dl>
        </div>
      </div>

      {extraction.panels.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Panels</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1 pr-3">Panel</th>
                  <th className="py-1 pr-3">Voltage</th>
                  <th className="py-1 pr-3">Phase</th>
                  <th className="py-1 pr-3">Main</th>
                  <th className="py-1 pr-3">Bus</th>
                  <th className="py-1 pr-3">Spaces</th>
                  <th className="py-1">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extraction.panels.map((panel, index) => (
                  <tr key={`${panel.designation}-${index}`}>
                    <td className="py-1 pr-3">{panel.designation || '—'}</td>
                    <td className="py-1 pr-3">{panel.voltage || '—'}</td>
                    <td className="py-1 pr-3">{panel.phase || '—'}</td>
                    <td className="py-1 pr-3">{panel.mainBreakerAmps || '—'}</td>
                    <td className="py-1 pr-3">{panel.busRatingAmps || '—'}</td>
                    <td className="py-1 pr-3">{panel.spaces || '—'}</td>
                    <td className="py-1">{panel.location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {extraction.circuits.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Circuits ({extraction.circuits.length})
          </h3>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1 pr-3">Ckt</th>
                  <th className="py-1 pr-3">Description</th>
                  <th className="py-1 pr-3">Breaker</th>
                  <th className="py-1 pr-3">Conductor</th>
                  <th className="py-1">Protection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extraction.circuits.map((circuit, index) => (
                  <tr key={`${circuit.circuit}-${index}`}>
                    <td className="py-1 pr-3">{circuit.circuit || '—'}</td>
                    <td className="py-1 pr-3">{circuit.description || '—'}</td>
                    <td className="py-1 pr-3">{circuit.breakerAmps || '—'}</td>
                    <td className="py-1 pr-3">{circuit.conductorSize || '—'}</td>
                    <td className="py-1">{circuit.protection || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <List title="Documents found" items={extraction.documentsPresent} tone="ok" />
        <List title="Missing documents" items={extraction.missingDocuments} tone="warn" />
        <List title="Could not read" items={extraction.unreadableItems} tone="warn" />
      </div>

      {description && (
        <div>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Submitter description</h3>
          <p className="text-sm text-slate-700">{description}</p>
        </div>
      )}
    </div>
  );
}
