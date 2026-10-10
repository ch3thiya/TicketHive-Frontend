import React, { useEffect, useRef, useState } from 'react';
import { MAX_SUSPENSION_REASON_LENGTH } from '../common/organizerAdminApi';

interface SuspendOrganizerPopUpProps {
  organizerName: string;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const SuspendOrganizerPopUp: React.FC<SuspendOrganizerPopUpProps> = ({
  organizerName,
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
      setReasonError('Enter a reason before suspending this organizer.');
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
        aria-labelledby="suspend-organizer-title"
        aria-describedby="suspend-organizer-description"
        className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-[520px] my-8 p-8 flex flex-col relative"
      >
        <h2 id="suspend-organizer-title" className="font-heading font-bold text-[24px] text-ink-black mb-2 leading-tight">
          Suspend {organizerName}?
        </h2>

        <div id="suspend-organizer-description" className="font-body text-[14px] text-ink-gray-70 mb-5 leading-relaxed">
          <p className="mb-2">While suspended, this organizer:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>cannot create, edit, publish or cancel events and shows;</li>
            <li>stops selling: new ticket holds are refused.</li>
          </ul>
          <p className="mt-2">
            Tickets already sold stay valid. Shows are not cancelled and nobody is refunded. You can
            reinstate the organizer at any time.
          </p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-16 p-3 mb-4 text-[#FF3B3B] font-medium text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="suspend-reason" className="font-body font-bold text-[13px] text-ink-black">
              Reason (required)
            </label>
            <textarea
              id="suspend-reason"
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={MAX_SUSPENSION_REASON_LENGTH}
              rows={4}
              aria-invalid={reasonError ? true : undefined}
              aria-describedby={reasonError ? 'suspend-reason-error' : undefined}
              className="font-body text-[14px] text-ink-black border-2.5 border-ink-black rounded-16 p-3 outline-none focus:border-brand-blue resize-none"
              placeholder="Why is this account being suspended? This is recorded for audit."
            />
            <div className="flex justify-between gap-2">
              {reasonError ? (
                <p id="suspend-reason-error" role="alert" className="font-body text-[12px] text-[#FF3B3B] font-medium">
                  {reasonError}
                </p>
              ) : (
                <span />
              )}
              <span className="font-body text-[12px] text-ink-gray-70">
                {reason.length}/{MAX_SUSPENSION_REASON_LENGTH}
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
              {isLoading ? 'Suspending...' : 'Suspend organizer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};