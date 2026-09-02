import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CustomDatePickerProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'YYYY-MM-DD'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleSelectDate = (dayNum: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    const formatted = `${year}-${m}-${d}`;
    onChange(formatted);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-2">
      {label && (
        <label htmlFor={id} className="text-xs font-body font-bold text-ink-gray-70 select-none cursor-pointer">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="bg-brand-white border-2 border-ink-black rounded-full px-3.5 py-1.5 text-xs font-body font-bold text-ink-black outline-none hover:bg-brand-blue-light/50 focus:border-brand-blue transition-all cursor-pointer shadow-brutal-s flex items-center justify-between gap-2 min-w-[130px] select-none"
        >
          <span>{value || placeholder}</span>
          <CalendarIcon size={14} className="text-brand-blue shrink-0" />
        </button>

        {/* Custom Neo-Brutalist Calendar Popover */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 z-[300] bg-brand-white border-3 border-ink-black rounded-24 p-4 shadow-soft-3d w-[300px] animate-in fade-in zoom-in-95 duration-150 select-none">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewDate(new Date(year, month - 1, 1));
                }}
                className="w-7 h-7 rounded-full border-2 border-ink-black flex items-center justify-center font-bold hover:bg-[#FFE94D] active:translate-y-px transition-all shadow-[2px_2px_0px_0px_#0A0A0F] cursor-pointer"
              >
                <span className="text-xl font-bold">−</span>
              </button>
              <span className="font-heading font-bold text-[14px] text-ink-black">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewDate(new Date(year, month + 1, 1));
                }}
                className="w-7 h-7 rounded-full border-2 border-ink-black flex items-center justify-center font-bold hover:bg-[#FFE94D] active:translate-y-px transition-all shadow-[2px_2px_0px_0px_#0A0A0F] cursor-pointer"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {WEEK_DAYS.map((day) => (
                <span key={day} className="font-body font-bold text-[11px] text-ink-gray-70 uppercase">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const m = String(month + 1).padStart(2, '0');
                const d = String(dayNum).padStart(2, '0');
                const dateStr = `${year}-${m}-${d}`;
                const isSelected = value === dateStr;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDate(dayNum)}
                    className={`h-8 w-8 rounded-10 font-body font-bold text-[12px] border-2 border-ink-black flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-blue text-brand-white shadow-[2px_2px_0px_0px_#0A0A0F] scale-105'
                        : 'bg-brand-white text-ink-black hover:bg-[#FFE94D] hover:shadow-[2px_2px_0px_0px_#0A0A0F]'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-ink-gray-30">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const m = String(today.getMonth() + 1).padStart(2, '0');
                  const d = String(today.getDate()).padStart(2, '0');
                  const formatted = `${today.getFullYear()}-${m}-${d}`;
                  onChange(formatted);
                  setIsOpen(false);
                }}
                className="font-body font-bold text-xs text-brand-blue hover:underline cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-body font-bold text-xs text-ink-gray-70 hover:text-ink-black cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
