import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { SeatMapCategory } from '../common/seatMapApi';

interface TicketCategorySelectProps {
  categories: SeatMapCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  ariaLabel: string;
}

export const TicketCategorySelect: React.FC<TicketCategorySelectProps> = ({
  categories,
  value,
  onChange,
  ariaLabel,
}) => {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = categories.find(category => category.id === value);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className={`font-body text-[14px] text-ink-black border-2 border-ink-black rounded-12 px-3 py-2 pr-10 w-full min-h-[40px] bg-brand-white text-left outline-none transition-all cursor-pointer ${open ? 'border-brand-blue shadow-brutal-s' : 'hover:border-brand-blue'}`}
      >
        <span className={selected ? 'font-semibold text-ink-black' : 'text-ink-gray-70'}>
          {selected ? `${selected.name} (${selected.capacity})` : 'Choose a category'}
        </span>
        <ChevronDown
          size={17}
          strokeWidth={2.5}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-brand-blue transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div role="listbox" aria-labelledby={id} className="absolute left-0 top-full mt-2 z-[300] w-full min-w-[220px] max-h-56 overflow-y-auto bg-brand-white border-2 border-ink-black rounded-16 p-2 shadow-soft-3d">
          {categories.map(category => {
            const isSelected = category.id === value;
            return (
              <button
                key={category.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(category.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-12 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors ${isSelected ? 'bg-brand-blue text-brand-white shadow-[2px_2px_0px_0px_#0A0A0F]' : 'text-ink-black hover:bg-[#FFE94D]'}`}
              >
                <span className="font-body text-[13px] font-bold truncate">{category.name}</span>
                <span className="flex items-center gap-2 shrink-0 font-body text-[11px] font-semibold">
                  {category.capacity.toLocaleString()} seats
                  {isSelected && <Check size={15} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
