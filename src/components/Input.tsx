import React, { useId, useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: React.ReactNode;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'textarea' | 'checkbox' | 'date' | 'time' | 'datetime-local';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];


export const Input: React.FC<InputProps> = ({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (props.value) {
      const parsed = new Date(props.value as string);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Custom checkbox layout
  if (type === 'checkbox') {
    const { ...checkboxProps } = props as React.InputHTMLAttributes<HTMLInputElement>;
    return (
      <div className={`flex flex-col ${className}`}>
        <label className="group inline-flex items-center gap-3 cursor-pointer select-none font-body text-sm font-medium text-ink-black leading-relaxed">
          <input
            type="checkbox"
            className="peer absolute opacity-0 cursor-pointer h-0 w-0"
            id={inputId}
            {...checkboxProps}
          />
          <span className="h-6 w-6 bg-brand-white border-2 border-ink-black rounded-8 flex items-center justify-center transition-all duration-150 ease-in-out shrink-0 peer-checked:bg-brand-blue peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand-blue peer-focus-visible:outline-offset-2 group-hover:-translate-x-px group-hover:-translate-y-px group-hover:shadow-[2px_2px_0px_0px_#0A0A0F]">
            <svg
              className="w-3.5 h-3.5 stroke-brand-white stroke-[4] fill-none hidden peer-checked:block"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span>{label}</span>
        </label>
        {error && (
          <span className="font-body text-[13px] font-medium text-state-error mt-1.5 ml-9 text-left">
            {error}
          </span>
        )}
      </div>
    );
  }

  // Textarea layout
  if (type === 'textarea') {
    const textareaProps = props as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    return (
      <div className={`flex flex-col gap-2 w-full text-left ${className}`}>
        <label htmlFor={inputId} className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px]">
          {label}
        </label>
        <textarea
          id={inputId}
          className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 px-4 w-full min-h-[120px] resize-vertical outline-none transition-all duration-150 ease-in-out placeholder-ink-gray-70 focus:border-brand-blue focus:shadow-brutal-s"
          {...textareaProps}
        />
        {error && (
          <span className="font-body text-[13px] font-medium text-state-error mt-1">
            {error}
          </span>
        )}
      </div>
    );
  }

  const inputProps = props as React.InputHTMLAttributes<HTMLInputElement>;

  // Calendar Calculation Helpers
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleSelectDate = (dayNum: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    const formatted = `${year}-${m}-${d}`;
    if (inputProps.onChange) {
      inputProps.onChange({
        target: { value: formatted, name: inputProps.name || '' }
      } as React.ChangeEvent<HTMLInputElement>);
    }
    setIsPickerOpen(false);
  };

  return (
    <div ref={containerRef} className={`flex flex-col gap-2 w-full text-left relative ${className}`}>
      <label htmlFor={inputId} className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px]">
        {label}
      </label>

      {type === 'password' ? (
        <div className="relative w-full">
          <input
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 pl-4 pr-12 w-full outline-none transition-all duration-150 ease-in-out placeholder-ink-gray-70 focus:border-brand-blue focus:shadow-brutal-s"
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-gray-70 hover:text-ink-black transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
          >
            {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
          </button>
        </div>
      ) : type === 'time' ? (
        <div className="relative w-full">
          <input
            id={inputId}
            type="time"
            onClick={(e) => {
              try {
                e.currentTarget.showPicker?.();
              } catch {
                // Ignore if already open
              }
            }}
            className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 pl-4 pr-12 w-full outline-none transition-all duration-150 ease-in-out placeholder-ink-gray-70 focus:border-brand-blue focus:shadow-brutal-s cursor-pointer"
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById(inputId) as HTMLInputElement;
              if (el?.showPicker) {
                el.showPicker();
              } else {
                el?.focus();
              }
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-blue hover:text-ink-black transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
          >
            <ClockIcon size={20} strokeWidth={2.5} />
          </button>
        </div>
      ) : type === 'date' || type === 'datetime-local' ? (
        <div className="relative w-full">
          <input
            id={inputId}
            type="text"
            readOnly
            value={inputProps.value || ''}
            placeholder="YYYY-MM-DD"
            onClick={() => setIsPickerOpen((prev) => !prev)}
            className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 pl-4 pr-12 w-full outline-none transition-all duration-150 ease-in-out placeholder-ink-gray-70 focus:border-brand-blue focus:shadow-brutal-s cursor-pointer select-none"
          />
          <button
            type="button"
            onClick={() => setIsPickerOpen((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-blue hover:text-ink-black transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
          >
            <CalendarIcon size={20} strokeWidth={2.5} />
          </button>

          {/* Custom Neo-Brutalist Calendar Popover */}
          {isPickerOpen && (
            <div className="absolute left-0 top-full mt-2 z-[300] bg-brand-white border-3 border-ink-black rounded-24 p-5 shadow-soft-3d w-[320px] animate-in fade-in zoom-in-95 duration-150 select-none">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewDate(new Date(year, month - 1, 1));
                  }}
                  className="w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center font-bold hover:bg-[#FFE94D] active:translate-y-px transition-all shadow-[2px_2px_0px_0px_#0A0A0F] cursor-pointer"
                >
                  <span className="text-lg font-bold">−</span>
                </button>
                <span className="font-heading font-bold text-[15px] text-ink-black">
                  {MONTH_NAMES[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewDate(new Date(year, month + 1, 1));
                  }}
                  className="w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center font-bold hover:bg-[#FFE94D] active:translate-y-px transition-all shadow-[2px_2px_0px_0px_#0A0A0F] cursor-pointer"
                >
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEK_DAYS.map((day) => (
                  <span key={day} className="font-body font-bold text-[12px] text-ink-gray-70 uppercase">
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const m = String(month + 1).padStart(2, '0');
                  const d = String(dayNum).padStart(2, '0');
                  const dateStr = `${year}-${m}-${d}`;
                  const isSelected = inputProps.value === dateStr;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectDate(dayNum)}
                      className={`h-9 w-9 rounded-12 font-body font-bold text-[13px] border-2 border-ink-black flex items-center justify-center transition-all cursor-pointer ${
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

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-ink-gray-30">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const m = String(today.getMonth() + 1).padStart(2, '0');
                    const d = String(today.getDate()).padStart(2, '0');
                    const formatted = `${today.getFullYear()}-${m}-${d}`;
                    if (inputProps.onChange) {
                      inputProps.onChange({ target: { value: formatted } } as any);
                    }
                    setIsPickerOpen(false);
                  }}
                  className="font-body font-bold text-xs text-brand-blue hover:underline cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="font-body font-bold text-xs text-ink-gray-70 hover:text-ink-black cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <input
          id={inputId}
          type={type}
          className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 px-4 w-full outline-none transition-all duration-150 ease-in-out placeholder-ink-gray-70 focus:border-brand-blue focus:shadow-brutal-s"
          {...inputProps}
        />
      )}

      {error && (
        <span className="font-body text-[13px] font-medium text-state-error mt-1">
          {error}
        </span>
      )}
    </div>
  );
};
