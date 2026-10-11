import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Badge } from './Badge';
import { RejectSeatMapPopUp } from '../popUps/RejectSeatMapPopUp';
import { ApiError } from '../common/problemDetails';
import {
  createSeatLayoutDraft,
  enableSeatLayout,
  rejectSeatMapRequest,
  rowLabel,
  sectionSeatCount,
  summarizeLayout,
  type SeatLayout,
  type SeatLayoutSection,
  type SeatMapDetail,
} from '../common/seatMapApi';

interface SeatLayoutBuilderProps {
  detail: SeatMapDetail;
  // Called after anything changed on the server, so the parent reloads the request and the list.
  onChanged: () => void;
}

const emptySection = (): SeatLayoutSection => ({ name: '', categoryId: '', rows: 1, seatsPerRow: 1 });

function initialSections(layouts: SeatLayout[]): SeatLayoutSection[] {
  const base = layouts.find((l) => l.status === 'Draft') ?? layouts.find((l) => l.status === 'Enabled');
  return base ? base.spec.sections.map((s) => ({ ...s })) : [emptySection()];
}

interface Failure {
  message: string;
  details: string[];
}

const toFailure = (err: unknown, fallback: string): Failure =>
  err instanceof ApiError
    ? { message: err.message, details: err.details.map((d) => d.message) }
    : { message: fallback, details: [] };

const inputClass =
  'font-body text-[14px] text-ink-black border-2 border-ink-black rounded-12 px-3 py-2 outline-none focus:border-brand-blue bg-brand-white';

export const SeatLayoutBuilder: React.FC<SeatLayoutBuilderProps> = ({ detail, onChanged }) => {
  const { apiFetch } = useAuth();
  const { request, categories, layouts } = detail;
  const [sections, setSections] = useState<SeatLayoutSection[]>(() => initialSections(layouts));
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const summary = useMemo(() => summarizeLayout(sections, categories), [sections, categories]);
  const open = request.status !== 'Rejected';

  const update = (index: number, patch: Partial<SeatLayoutSection>) =>
    setSections((current) => current.map((section, i) => (i === index ? { ...section, ...patch } : section)));

  const toNumber = (value: string) => (value === '' ? 0 : Number(value));

  const run = async (action: () => Promise<string>, fallback: string) => {
    setBusy(true);
    setFailure(null);
    setNotice(null);
    try {
      setNotice(await action());
      onChanged();
    } catch (err) {
      setFailure(toFailure(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = () =>
    run(async () => {
      const layout = await createSeatLayoutDraft(apiFetch, request.id, sections.map((s) => ({ ...s, name: s.name.trim() })));
      return `Draft version ${layout.version} saved. Enable it when you are ready.`;
    }, 'Failed to save the layout.');

  const enable = (layout: SeatLayout) =>
    run(async () => {
      await enableSeatLayout(apiFetch, layout.id);
      return `Version ${layout.version} is enabled and the seats are ready in Inventory.`;
    }, 'Failed to enable the layout.');

  const reject = async (reason: string) => {
    setBusy(true);
    setRejectError(null);
    try {
      await rejectSeatMapRequest(apiFetch, request.id, reason);
      setRejectOpen(false);
      onChanged();
    } catch (err) {
      setRejectError(toFailure(err, 'Failed to reject the request.').message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-[#F9F9FC] border-2 border-ink-gray-30 rounded-20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="font-body font-bold text-[16px] text-ink-black">
            {detail.eventName} · {detail.showDate} {detail.showTime?.substring(0, 5)}
          </h3>
          <Badge variant={request.status === 'Pending' ? 'warning' : request.status === 'Completed' ? 'success' : 'error'} uppercase>
            {request.status}
          </Badge>
        </div>
        <p className="font-body text-[14px] text-ink-black leading-relaxed">{request.description}</p>
        {request.status === 'Rejected' && request.rejectionReason && (
          <p className="font-body text-[13px] text-ink-gray-70 mt-2">Rejected: {request.rejectionReason}</p>
        )}
      </div>

      {failure && (
        <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-16 p-4 text-[#FF3B3B] font-medium text-sm">
          <p>{failure.message}</p>
          {failure.details.length > 0 && (
            <ul className="list-disc pl-5 mt-2">
              {failure.details.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {notice && (
        <div role="status" className="bg-[#E5F9F0] border-2 border-[#00854E] rounded-16 p-4 text-[#00854E] font-medium text-sm">
          {notice}
        </div>
      )}

      {open && (
        <section aria-label="Layout" className="flex flex-col gap-3">
          <h4 className="font-heading font-bold text-[18px] text-ink-black">Layout</h4>
          <p className="font-body text-[13px] text-ink-gray-70">
            Each section is rows × seats per row for one ticket category. Rows are labelled A, B, C… and seats are
            numbered from 1.
          </p>

          {sections.map((section, index) => (
            <div key={index} className="grid grid-cols-2 md:grid-cols-[1.4fr_1.4fr_0.7fr_0.8fr_auto] gap-3 items-end">
              <label className="flex flex-col gap-1 font-body text-[12px] font-bold text-ink-black col-span-2 md:col-span-1">
                Section name
                <input
                  aria-label={`Section ${index + 1} name`}
                  className={inputClass}
                  value={section.name}
                  maxLength={50}
                  onChange={(e) => update(index, { name: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 font-body text-[12px] font-bold text-ink-black col-span-2 md:col-span-1">
                Ticket category
                <select
                  aria-label={`Section ${index + 1} category`}
                  className={inputClass}
                  value={section.categoryId}
                  onChange={(e) => update(index, { categoryId: e.target.value })}
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.capacity})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 font-body text-[12px] font-bold text-ink-black">
                Rows
                <input
                  aria-label={`Section ${index + 1} rows`}
                  type="number"
                  min={1}
                  max={200}
                  className={inputClass}
                  value={section.rows || ''}
                  onChange={(e) => update(index, { rows: toNumber(e.target.value) })}
                />
              </label>
              <label className="flex flex-col gap-1 font-body text-[12px] font-bold text-ink-black">
                Seats per row
                <input
                  aria-label={`Section ${index + 1} seats per row`}
                  type="number"
                  min={1}
                  max={500}
                  className={inputClass}
                  value={section.seatsPerRow || ''}
                  onChange={(e) => update(index, { seatsPerRow: toNumber(e.target.value) })}
                />
              </label>
              <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                <span className="font-body text-[12px] text-ink-gray-70 whitespace-nowrap">
                  {sectionSeatCount(section)} seats
                  {section.rows > 0 && section.seatsPerRow > 0 && (
                    <> · rows A–{rowLabel(Math.max(0, Math.min(section.rows, 200) - 1))}</>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setSections((current) => current.filter((_, i) => i !== index))}
                  disabled={sections.length === 1}
                  aria-label={`Remove section ${index + 1}`}
                  className="text-state-error cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setSections((current) => [...current, emptySection()])}
            className="self-start inline-flex items-center gap-1 font-body font-bold text-[13px] text-brand-blue cursor-pointer"
          >
            <Plus size={14} /> Add section
          </button>

          <ul aria-label="Seats per category" className="flex flex-col gap-1">
            {summary.categories.map((category) => (
              <li
                key={category.categoryId}
                className={`font-body text-[13px] ${category.matches ? 'text-[#00854E]' : 'text-[#D32F2F]'}`}
              >
                {category.name}: {category.mapped} of {category.capacity} seats{category.matches ? ' ✓' : ''}
              </li>
            ))}
            <li className={`font-body text-[13px] font-bold ${summary.totalSeats === summary.ticketTotal ? 'text-[#00854E]' : 'text-[#D32F2F]'}`}>
              Total: {summary.totalSeats} of {summary.ticketTotal} tickets
            </li>
          </ul>
          {summary.hasUnassignedSection && <p className="font-body text-[13px] text-[#D32F2F]">Every section needs a ticket category.</p>}
          {summary.hasDuplicateName && <p className="font-body text-[13px] text-[#D32F2F]">Section names must be different.</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={busy || !summary.matches}
              className="font-body font-bold text-[14px] text-brand-white bg-brand-blue border-2.5 border-ink-black rounded-full px-6 py-2.5 hover:bg-[#1a1a5b] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Working…' : 'Save draft'}
            </button>
            {request.status === 'Pending' && (
              <button
                type="button"
                onClick={() => {
                  setRejectError(null);
                  setRejectOpen(true);
                }}
                disabled={busy}
                className="font-body font-bold text-[14px] text-[#FF3B3B] bg-brand-white border-2.5 border-ink-black rounded-full px-6 py-2.5 hover:bg-[#FF3B3B]/5 cursor-pointer disabled:opacity-50"
              >
                Reject request
              </button>
            )}
          </div>
          {!summary.matches && (
            <p className="font-body text-[12px] text-ink-gray-70">
              Save is available once every category has exactly as many seats as its capacity.
            </p>
          )}
        </section>
      )}

      <section aria-label="Versions" className="flex flex-col gap-2">
        <h4 className="font-heading font-bold text-[18px] text-ink-black">Versions</h4>
        {layouts.length === 0 ? (
          <p className="font-body text-[13px] text-ink-gray-70">No layout has been saved yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {layouts.map((layout) => (
              <li key={layout.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink-gray-30 rounded-16 px-4 py-3">
                <span className="font-body text-[14px] text-ink-black">
                  Version {layout.version} · {layout.seatCount} seats ·{' '}
                  <Badge variant={layout.status === 'Enabled' ? 'success' : layout.status === 'Draft' ? 'warning' : 'default'}>
                    {layout.status}
                  </Badge>
                </span>
                <span className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSections(layout.spec.sections.map((s) => ({ ...s })))}
                    className="font-body font-bold text-[13px] text-brand-blue cursor-pointer"
                  >
                    Load version {layout.version}
                  </button>
                  {layout.status === 'Draft' && open && (
                    <button
                      type="button"
                      onClick={() => void enable(layout)}
                      disabled={busy}
                      className="font-body font-bold text-[13px] text-brand-white bg-brand-blue border-2 border-ink-black rounded-full px-4 py-1 cursor-pointer disabled:opacity-50"
                    >
                      Enable version {layout.version}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {rejectOpen && (
        <RejectSeatMapPopUp
          eventName={detail.eventName}
          isLoading={busy}
          error={rejectError}
          onClose={() => setRejectOpen(false)}
          onConfirm={(reason) => void reject(reason)}
        />
      )}
    </div>
  );
};
