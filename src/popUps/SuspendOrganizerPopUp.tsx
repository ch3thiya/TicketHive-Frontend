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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspend-organizer-title"
        aria-describedby="suspend-organizer-description"
        className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-[520px] my-8 p-8 flex flex-col items-center relative animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light transition-all disabled:opacity-50"
          aria-label="Close modal"
        >
          <span className="font-body font-bold text-sm text-ink-black select-none">✕</span>
        </button>

        {/* Warning Emoji Badge */}
        <div className="w-16 h-16 rounded-full border-3 border-ink-black flex items-center justify-center bg-[#FF3B3B]/10 shadow-[3px_3px_0px_0px_#0A0A0F] text-2xl select-none mb-4">
          ⚠️
        </div>

        <h2 id="suspend-organizer-title" className="font-heading font-extrabold text-[24px] sm:text-[26px] text-ink-black text-center mb-2 leading-tight">
          Suspend {organizerName}?
        </h2>

        {/* Warning Callout Box */}
        <div id="suspend-organizer-description" className="w-full bg-[#F9F9FF] border-2 border-ink-black rounded-24 p-4 mb-5 text-left shadow-brutal-s">
          <p className="font-body font-bold text-[13px] text-ink-black mb-1.5">While suspended, this organizer:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 font-body text-[13px] text-ink-gray-70 mb-3 leading-relaxed">
            <li>cannot create, edit, publish or cancel events and shows;</li>
            <li>stops selling: new ticket holds are refused.</li>
          </ul>
          <p className="font-body text-[12px] text-ink-gray-70 border-t border-ink-gray-30 pt-2.5 leading-relaxed">
            Tickets already sold stay valid. Shows are not cancelled and nobody is refunded. You can reinstate the organizer at any time.
          </p>
        </div>

        {error && (
          <div role="alert" className="w-full bg-red-50 border-2 border-red-500 rounded-16 p-3 mb-4 text-[#FF3B3B] font-body font-bold text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_#0A0A0F]">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="suspend-reason" className="font-heading font-bold text-[13px] text-ink-black uppercase tracking-wider">
              Reason (required)
            </label>
            <textarea
              id="suspend-reason"
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={MAX_SUSPENSION_REASON_LENGTH}
              rows={3}
              aria-invalid={reasonError ? true : undefined}
              aria-describedby={reasonError ? 'suspend-reason-error' : undefined}
              className="w-full font-body text-[14px] text-ink-black bg-[#F9F9FF] border-2.5 border-ink-black rounded-20 p-3.5 outline-none focus:border-brand-blue focus:bg-brand-white focus:shadow-[2px_2px_0px_0px_#0A0A0F] resize-none transition-all placeholder:text-ink-gray-40"
              placeholder="Why is this account being suspended? This is recorded for audit."
            />
            <div className="flex justify-between gap-2 px-1">
              {reasonError ? (
                <p id="suspend-reason-error" role="alert" className="font-body text-[12px] text-[#FF3B3B] font-bold">
                  {reasonError}
                </p>
              ) : (
                <span />
              )}
              <span className="font-mono text-[12px] font-bold text-ink-gray-70">
                {reason.length}/{MAX_SUSPENSION_REASON_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex gap-4 w-full pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 font-heading font-bold text-[14px] text-ink-black bg-brand-white border-2.5 border-ink-black rounded-full py-3 hover:bg-brand-blue-light transition-all cursor-pointer active:translate-y-px select-none text-center outline-none shadow-[2px_2px_0px_0px_#0A0A0F] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 font-heading font-bold text-[14px] text-brand-white bg-[#FF3B3B] hover:bg-[#E02424] border-2.5 border-ink-black rounded-full py-3 transition-all cursor-pointer active:translate-y-[2px] shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 outline-none disabled:opacity-50"
            >
              {isLoading ? 'Suspending...' : 'Suspend organizer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};