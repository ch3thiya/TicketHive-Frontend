import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Venue } from '../common/venueApi';

export interface VenueSelectProps {
  label?: React.ReactNode;
  venues: Venue[];
  value: string;
  onChange: (venueId: string) => void;
  error?: string | null;
  id?: string;
  className?: string;
}

// Shared venue picker for the show pop-ups. Centralized (rather than
// duplicated per pop-up) because preselecting the current venue on edit and
// showing a non-blocking load error are non-trivial and easy to drift apart
// if copied. Note: the design guide has no defined select/dropdown
// component — this reuses Input's field tokens (3px border, radius-16,
// focus ring) rather than inventing new styling.
export const VenueSelect: React.FC<VenueSelectProps> = ({
  label = 'Venue (Optional)',
  venues,
  value,
  onChange,
  error,
  id,
  className = ''
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={`flex flex-col gap-2 w-full text-left ${className}`}>
      <label htmlFor={selectId} className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px]">
        {label}
      </label>

      <div className="relative w-full">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 pl-4 pr-12 w-full outline-none transition-all duration-150 ease-in-out appearance-none cursor-pointer focus:border-brand-blue focus:shadow-brutal-s"
        >
          <option value="">No venue</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name} — {venue.address}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-blue"
        />
      </div>

      {error && (
        <span className="font-body text-[13px] font-medium text-[#B27A00] mt-1">
          Couldn't load venues: {error}. You can still save without picking one.
        </span>
      )}
    </div>
  );
};
