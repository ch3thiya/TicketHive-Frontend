import React, { useEffect, useRef, useState } from 'react';
import { MAX_SEAT_MAP_DESCRIPTION_LENGTH } from '../common/seatMapApi';

interface SeatMapRequestPopUpProps {
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (description: string) => void;
}

export const SeatMapRequestPopUp: React.FC<SeatMapRequestPopUpProps> = ({
  isLoading = false,
  error = null,
  onClose,
  onSubmit,
}) => {
  const [description, setDescription] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    descriptionRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isLoading, onClose]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setFieldError('Describe the seating for your venue before sending the request.');
      return;
    }
    setFieldError(null);
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="seat-map-request-title"
        className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-[520px] my-8 p-8 flex flex-col relative"
      >
        <h2 id="seat-map-request-title" className="font-heading font-bold text-[24px] text-ink-black mb-2 leading-tight">
          Request a seat map
        </h2>
        <p className="font-body text-[14px] text-ink-gray-70 mb-5 leading-relaxed">
          Tell us how your venue is laid out: sections, rows and roughly how many seats each has. An admin builds the
          layout and enables it. Once seats are held or sold, the layout can no longer change.
        </p>

        {error && (
          <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-16 p-3 mb-4 text-[#FF3B3B] font-medium text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="seat-map-description" className="font-body font-bold text-[13px] text-ink-black">
              Seating description (required)
            </label>
            <textarea
              id="seat-map-description"
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_SEAT_MAP_DESCRIPTION_LENGTH}
              rows={5}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? 'seat-map-description-error' : undefined}
              className="font-body text-[14px] text-ink-black border-2.5 border-ink-black rounded-16 p-3 outline-none focus:border-brand-blue resize-none"
              placeholder="For example: Stalls with 10 rows of 20 seats, and a balcony with 5 rows of 16 seats."
            />
            <div className="flex justify-between gap-2">
              {fieldError ? (
                <p id="seat-map-description-error" role="alert" className="font-body text-[12px] text-[#FF3B3B] font-medium">
                  {fieldError}
                </p>
              ) : (
                <span />
              )}
              <span className="font-body text-[12px] text-ink-gray-70">
                {description.length}/{MAX_SEAT_MAP_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 font-body font-bold text-[14px] text-ink-black bg-brand-white border-2.5 border-ink-black rounded-full py-3 hover:bg-brand-blue-light transition-all cursor-pointer active:translate-y-px select-none text-center outline-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 font-body font-bold text-[14px] text-brand-white bg-brand-blue border-2.5 border-ink-black rounded-full py-3 hover:bg-[#1a1a5b] transition-all cursor-pointer active:translate-y-[2px] shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 outline-none disabled:opacity-50"
            >
              {isLoading ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
