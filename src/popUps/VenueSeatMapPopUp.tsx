import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Venue, VenueSeatMapSection } from '../common/venueApi';
import { rowLabel, sectionSeatCount } from '../common/seatMapApi';

interface Props {
  venue: Venue;
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (sections: VenueSeatMapSection[]) => void;
  onDelete: () => void;
}

const emptySection = (): VenueSeatMapSection => ({ name: '', rows: 1, seatsPerRow: 1 });
const inputClass = 'font-body text-[14px] text-ink-black border-2 border-ink-black rounded-12 px-3 py-2 outline-none focus:border-brand-blue bg-brand-white';

export const VenueSeatMapPopUp: React.FC<Props> = ({ venue, isLoading, error, onClose, onSubmit, onDelete }) => {
  const [sections, setSections] = useState<VenueSeatMapSection[]>([emptySection()]);

  useEffect(() => {
    setSections(venue.seatMap?.spec.sections.map(section => ({ ...section })) ?? [emptySection()]);
  }, [venue]);

  const summary = useMemo(() => {
    const names = sections.map(section => section.name.trim().toLowerCase()).filter(Boolean);
    const total = sections.reduce((sum, section) => sum + sectionSeatCount(section), 0);
    const valid = sections.length > 0 && sections.every(section => section.name.trim() && section.rows > 0 && section.seatsPerRow > 0)
      && new Set(names).size === names.length && total <= venue.capacity;
    return { total, valid, duplicate: new Set(names).size !== names.length };
  }, [sections, venue.capacity]);

  const update = (index: number, patch: Partial<VenueSeatMapSection>) =>
    setSections(current => current.map((section, i) => i === index ? { ...section, ...patch } : section));

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-labelledby="venue-seat-map-title" className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-4xl my-8 p-8 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
        <button type="button" onClick={onClose} aria-label="Close seat map" className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light">✕</button>
        <h2 id="venue-seat-map-title" className="font-heading font-bold text-[24px] text-ink-black mb-1">
          {venue.seatMap ? 'Edit Seat Map' : 'Add Seat Map'}
        </h2>
        <p className="text-xs text-ink-gray-70 mb-5 border-b border-ink-gray-30 pb-3">
          {venue.name} · Capacity {venue.capacity.toLocaleString()}. Define reusable sections, rows and seats for this venue.
        </p>

        {error && <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-16 p-3 mb-4 text-[#FF3B3B] font-medium text-sm">{error}</div>}

        <form onSubmit={event => { event.preventDefault(); if (summary.valid) onSubmit(sections.map(section => ({ ...section, name: section.name.trim() }))); }} className="flex flex-col gap-4">
          {sections.map((section, index) => (
            <div key={index} className="grid grid-cols-2 md:grid-cols-[1.5fr_0.7fr_0.8fr_auto] gap-3 items-end bg-[#F9F9FC] border-2 border-ink-gray-30 rounded-16 p-4">
              <label className="flex flex-col gap-1 font-body text-[12px] font-bold text-ink-black col-span-2 md:col-span-1">
                Section name
                <input aria-label={`Venue section ${index + 1} name`} value={section.name} maxLength={50} className={inputClass} onChange={event => update(index, { name: event.target.value })} />
              </label>
              <label className="flex flex-col gap-1 font-body text-[12px] font-bold text-ink-black">
                Rows
                <input aria-label={`Venue section ${index + 1} rows`} type="number" min={1} max={200} value={section.rows || ''} className={inputClass} onChange={event => update(index, { rows: Number(event.target.value) })} />
              </label>
              <label className="flex flex-col gap-1 font-body text-[12px] font-bold text-ink-black">
                Seats per row
                <input aria-label={`Venue section ${index + 1} seats per row`} type="number" min={1} max={500} value={section.seatsPerRow || ''} className={inputClass} onChange={event => update(index, { seatsPerRow: Number(event.target.value) })} />
              </label>
              <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                <span className="font-body text-[12px] text-ink-gray-70 whitespace-nowrap">
                  {sectionSeatCount(section)} seats{section.rows > 0 && section.seatsPerRow > 0 ? ` · A–${rowLabel(section.rows - 1)}` : ''}
                </span>
                <button type="button" onClick={() => setSections(current => current.filter((_, i) => i !== index))} disabled={sections.length === 1} aria-label={`Remove venue section ${index + 1}`} className="text-state-error disabled:opacity-40"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setSections(current => [...current, emptySection()])} className="self-start inline-flex items-center gap-1 font-body font-bold text-[13px] text-brand-blue cursor-pointer"><Plus size={14} /> Add section</button>
          <p className={`font-body text-[13px] font-bold ${summary.total <= venue.capacity ? 'text-[#00854E]' : 'text-[#D32F2F]'}`}>
            Total: {summary.total.toLocaleString()} of {venue.capacity.toLocaleString()} venue capacity
          </p>
          {summary.duplicate && <p className="font-body text-[13px] text-[#D32F2F]">Section names must be different.</p>}

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button type="submit" disabled={isLoading || !summary.valid} className="flex-1 font-body font-bold text-[15px] text-brand-white bg-brand-blue border-3 border-ink-black rounded-full py-3.5 hover:bg-[#1a1a5b] transition-all cursor-pointer shadow-brutal-s disabled:opacity-50">
              {isLoading ? 'Saving...' : venue.seatMap ? 'Save Changes' : 'Add Seat Map'}
            </button>
            {venue.seatMap && <button type="button" onClick={onDelete} disabled={isLoading} className="font-body font-bold text-[14px] text-[#FF3B3B] bg-brand-white border-3 border-ink-black rounded-full px-6 py-3 hover:bg-red-50 shadow-brutal-s disabled:opacity-50">Delete Seat Map</button>}
          </div>
        </form>
      </div>
    </div>
  );
};
