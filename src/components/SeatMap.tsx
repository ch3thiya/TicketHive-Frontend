import React from 'react';
import type { SeatMapData, SeatMapSeat, SeatState } from '../common/seatApi';

export interface SeatCategoryInfo {
  name: string;
  price: number;
}

interface SeatMapProps {
  map: SeatMapData;
  // Seats that are not available right now, from the live poll. Anything not listed is available.
  unavailable: ReadonlyMap<string, SeatState>;
  selected: ReadonlySet<string>;
  // Keyed by category id: the name comes from the event, the price from the seat map.
  categories: Readonly<Record<string, SeatCategoryInfo>>;
  disabled?: boolean;
  onToggle: (seat: SeatMapSeat, section: string, row: string) => void;
}

const money = (value: number) => `$${value.toFixed(0)}`;

// Colour is never the only signal: every state also has its own mark and an accessible name.
const STATE_STYLES: Record<SeatState | 'Selected', { className: string; mark: string; text: string }> = {
  Available: {
    className: 'bg-brand-white border-ink-black text-ink-black hover:bg-brand-blue-light cursor-pointer',
    mark: '',
    text: 'available',
  },
  Selected: {
    className: 'bg-brand-blue border-ink-black text-brand-white cursor-pointer',
    mark: '✓',
    text: 'selected',
  },
  Held: {
    className: 'bg-surface-yellow border-ink-gray-70 text-ink-black cursor-not-allowed',
    mark: '•',
    text: 'held by someone else',
  },
  Sold: {
    className: 'bg-ink-gray-30 border-ink-gray-70 text-ink-gray-70 cursor-not-allowed',
    mark: '×',
    text: 'sold',
  },
};

export const SeatMap: React.FC<SeatMapProps> = ({ map, unavailable, selected, categories, disabled = false, onToggle }) => {
  const priceOf = (categoryId: string) =>
    map.categories.find((c) => c.categoryId === categoryId)?.unitPrice ?? categories[categoryId]?.price ?? 0;

  return (
    <div className="flex flex-col gap-4 w-full">
      <ul aria-label="Seat key" className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-body text-[12px] text-ink-black">
        {(['Available', 'Selected', 'Held', 'Sold'] as const).map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`inline-flex items-center justify-center w-5 h-5 rounded-md border-2 text-[11px] font-bold ${STATE_STYLES[key].className.replace(/cursor-\S+/g, '')}`}
            >
              {STATE_STYLES[key].mark}
            </span>
            <span>{key === 'Held' ? 'Held by someone else' : key}</span>
          </li>
        ))}
      </ul>

      <ul aria-label="Prices" className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-body text-[12px] text-ink-black">
        {map.categories.map((c) => (
          <li key={c.categoryId}>
            <span className="font-bold">{categories[c.categoryId]?.name ?? 'Tickets'}</span> {money(c.unitPrice)}
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto w-full flex justify-center py-2" role="group" aria-label="Seat map">
        <div className="flex flex-col items-center gap-5 min-w-max pb-1">
          {map.sections.map((section) => (
            <section key={section.name} aria-label={`Section ${section.name}`} className="flex flex-col gap-1.5">
              <h4 className="font-heading font-bold text-[13px] text-ink-black">{section.name}</h4>
              {section.rows.map((row) => (
                <div key={row.label} role="group" aria-label={`${section.name} row ${row.label}`} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="w-6 text-right font-body text-[11px] font-bold text-ink-gray-70">
                    {row.label}
                  </span>
                  {row.seats.map((seat) => {
                    const liveState: SeatState = unavailable.get(seat.id) ?? 'Available';
                    const isSelected = selected.has(seat.id);
                    const styleKey = isSelected ? 'Selected' : liveState;
                    const style = STATE_STYLES[styleKey];
                    const blocked = liveState !== 'Available';
                    const categoryName = categories[seat.categoryId]?.name ?? 'Ticket';
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        aria-label={`${section.name} row ${row.label} seat ${seat.number}, ${categoryName}, ${money(priceOf(seat.categoryId))}, ${style.text}`}
                        aria-pressed={blocked ? undefined : isSelected}
                        disabled={disabled || blocked}
                        onClick={() => onToggle(seat, section.name, row.label)}
                        className={`w-8 h-8 shrink-0 rounded-md border-2 font-body text-[11px] font-bold leading-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-100 ${style.className}`}
                      >
                        {style.mark || seat.number}
                      </button>
                    );
                  })}
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
