import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, MapPin } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedVenue = venues.find((v) => v.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVenues = venues.filter((venue) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      venue.name.toLowerCase().includes(query) ||
      venue.address.toLowerCase().includes(query)
    );
  });

  return (
    <div ref={containerRef} className={`flex flex-col gap-2 w-full text-left relative ${className}`}>
      <label htmlFor={selectId} className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px]">
        {label}
      </label>

      <div className="relative w-full">
        {/* Custom Input Trigger Box */}
        <button
          id={selectId}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 pl-4 pr-12 w-full text-left outline-none transition-all duration-150 ease-in-out cursor-pointer flex items-center justify-between ${
            isOpen ? 'border-brand-blue shadow-brutal-s' : 'hover:border-brand-blue'
          }`}
        >
          {selectedVenue ? (
            <div className="flex items-center gap-2 truncate">
              <MapPin size={16} className="text-brand-blue shrink-0" />
              <span className="font-semibold text-ink-black truncate">{selectedVenue.name}</span>
              <span className="text-ink-gray-70 text-xs truncate">— {selectedVenue.address}</span>
            </div>
          ) : (
            <span className="text-ink-gray-70">No venue selected</span>
          )}

          <ChevronDown
            size={18}
            strokeWidth={2.5}
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-brand-blue transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Custom Popover Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-full z-[300] bg-brand-white border-3 border-ink-black rounded-20 p-2 shadow-soft-3d animate-in fade-in zoom-in-95 duration-150 max-h-[320px] flex flex-col">
            
            {/* Search Input Filter if many venues exist */}
            {venues.length > 4 && (
              <div className="p-2 border-b border-ink-gray-30 mb-1 relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-gray-70" />
                <input
                  type="text"
                  placeholder="Search venue name or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-ink-gray-30/40 font-body text-xs font-medium text-ink-black rounded-12 py-2 pl-9 pr-3 outline-none focus:bg-brand-white focus:border border-ink-black"
                />
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto max-h-[240px] flex flex-col gap-1 pr-1 custom-scrollbar">
              
              {/* Clear/No Venue Option */}
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-12 font-body text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  !value
                    ? 'bg-[#FFE94D] text-ink-black font-bold border border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F]'
                    : 'hover:bg-[#F3F4F6] text-ink-gray-70'
                }`}
              >
                <span>No venue (Unspecified)</span>
                {!value && <Check size={16} strokeWidth={3} className="text-ink-black" />}
              </button>

              {filteredVenues.length === 0 ? (
                <div className="py-4 text-center text-xs text-ink-gray-70 font-medium">
                  No matching venues found
                </div>
              ) : (
                filteredVenues.map((venue) => {
                  const isSelected = venue.id === value;
                  return (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => {
                        onChange(venue.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-12 font-body text-sm flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-blue text-brand-white font-bold shadow-[2px_2px_0px_0px_#0A0A0F]'
                          : 'hover:bg-[#FFE94D] text-ink-black hover:font-semibold'
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className={`font-bold text-xs md:text-sm ${isSelected ? 'text-brand-white' : 'text-ink-black'}`}>
                          {venue.name}
                        </span>
                        <span className={`text-xs ${isSelected ? 'text-brand-white/80' : 'text-ink-gray-70'}`}>
                          {venue.address}
                        </span>
                      </div>
                      {isSelected && <Check size={16} strokeWidth={3} className="text-brand-white shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <span className="font-body text-[13px] font-medium text-[#B27A00] mt-1">
          Couldn't load venues: {error}. You can still save without picking one.
        </span>
      )}
    </div>
  );
};
