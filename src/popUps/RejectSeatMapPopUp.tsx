import React, { useEffect, useRef, useState } from 'react';
import { MAX_SEAT_MAP_REJECTION_LENGTH } from '../common/seatMapApi';

interface RejectSeatMapPopUpProps {
  eventName: string;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const RejectSeatMapPopUp: React.FC<RejectSeatMapPopUpProps> = ({
  eventName,
  isLoading = false,
  error = null,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    reasonRef.current?.focus();
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
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError('Enter a reason. The organizer will see it.');
      return;
    }
    setReasonError(null);
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-seat-map-title"
        className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-[520px] my-8 p-8 flex flex-col relative"
      >
        <h2 id="reject-seat-map-title" className="font-heading font-bold text-[24px] text-ink-black mb-2 leading-tight">
          Reject the seat map request for {eventName}?
        </h2>
        <p className="font-body text-[14px] text-ink-gray-70 mb-5 leading-relaxed">
          The show stays general admission. The organizer sees your reason and can send a new request.
        </p>

        {error && (
          <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-16 p-3 mb-4 text-[#FF3B3B] font-medium text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reject-seat-map-reason" className="font-body font-bold text-[13px] text-ink-black">
              Reason (required)
            </label>
            <textarea
              id="reject-seat-map-reason"
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={MAX_SEAT_MAP_REJECTION_LENGTH}
              rows={4}
              aria-invalid={reasonError ? true : undefined}
              aria-describedby={reasonError ? 'reject-seat-map-reason-error' : undefined}
              className="font-body text-[14px] text-ink-black border-2.5 border-ink-black rounded-16 p-3 outline-none focus:border-brand-blue resize-none"
            />
            <div className="flex justify-between gap-2">
              {reasonError ? (
                <p id="reject-seat-map-reason-error" role="alert" className="font-body text-[12px] text-[#FF3B3B] font-medium">
                  {reasonError}
                </p>
              ) : (
                <span />
              )}
              <span className="font-body text-[12px] text-ink-gray-70">
                {reason.length}/{MAX_SEAT_MAP_REJECTION_LENGTH}
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
              className="flex-1 font-body font-bold text-[14px] text-brand-white bg-[#FF3B3B] border-2.5 border-ink-black rounded-full py-3 hover:bg-[#E02424] transition-all cursor-pointer active:translate-y-[2px] shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 outline-none disabled:opacity-50"
            >
              {isLoading ? 'Rejecting…' : 'Reject request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
