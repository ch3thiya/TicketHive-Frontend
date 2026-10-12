import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';

interface CancellationState {
  refundStatus: 'Pending' | 'NotRequired' | 'Simulated' | 'Succeeded';
  inventoryReturned: boolean;
  notificationStatus: string;
}

export function OrderCancellation({ orderId, cancelled = false, used = false, onCancelled }: {
  orderId: string; cancelled?: boolean; used?: boolean; onCancelled?: () => void;
}) {
  const { apiFetch } = useAuth();
  const [state, setState] = useState<CancellationState | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const base = `${import.meta.env.VITE_BOOKING_API_URL || ''}/api/booking/orders/${orderId}`;

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await apiFetch(`${base}/cancellation`);
        if (response.ok && active) {
          const next: CancellationState = await response.json();
          setState(next);
          if (next.refundStatus !== 'Pending' && next.inventoryReturned &&
              ['Sent', 'Simulated', 'NeedsReconciliation', 'MissingRecipient'].includes(next.notificationStatus)) {
            window.clearInterval(timer);
          }
        }
        else if (response.status !== 404 && active) setError('Unable to refresh refund progress. We will retry.');
      } catch { if (active) setError('Unable to refresh refund progress. We will retry.'); }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [apiFetch, base]);

  const cancel = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await apiFetch(`${base}/cancel`, { method: 'POST', headers: { 'Idempotency-Key': `cancel:${orderId}` } });
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.detail || 'Cancellation failed. Please retry.');
      }
      setState(await response.json());
      setConfirm(false);
      onCancelled?.();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Cancellation failed. Please retry.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="mt-3 w-full text-sm" aria-label="Order cancellation">
      {(state || cancelled) ? null : used ? (
        <div className="bg-ink-gray-10 border-2 border-ink-black rounded-20 p-3 text-xs font-body text-ink-gray-70 flex items-center gap-2 shadow-[2px_2px_0px_0px_#0A0A0F]">
          <span>ℹ️</span>
          <p>This order cannot be cancelled because a ticket has been used.</p>
        </div>
      ) : (
        <>
          <button
            type="button"
            aria-label="Cancel Order"
            onClick={() => { setError(''); setConfirm(true); }}
            className="w-full py-2.5 px-4 font-heading font-bold text-xs uppercase tracking-wider text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border-2 border-ink-black rounded-full shadow-[3px_3px_0px_0px_#0A0A0F] active:shadow-[1px_1px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Cancel Order</span>
          </button>

          {/* Normal Confirmation PopUp matching ConfirmDeletePopUp portaled to document.body */}
          {confirm &&
            createPortal(
              <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm animate-in fade-in duration-150">
                <div className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-[480px] p-8 flex flex-col items-center relative animate-in zoom-in-95 duration-200">
                  {/* Warning Emoji Badge */}
                  <div className="w-16 h-16 rounded-full border-3 border-ink-black flex items-center justify-center bg-[#FF3B3B]/10 shadow-[3px_3px_0px_0px_#0A0A0F] text-2xl select-none mb-5">
                    ⚠️
                  </div>

                  {/* Heading */}
                  <h2 className="font-heading font-bold text-[24px] text-ink-black text-center mb-2 leading-tight">
                    Cancel Order?
                  </h2>

                  {/* Warning Subtitle */}
                  <div className="font-body text-[14px] text-ink-gray-70 text-center mb-6 leading-relaxed">
                    Cancel this entire order and all its tickets? A full refund will be requested. Cancellation is allowed before the show starts if no tickets are used.
                  </div>

                  {error && (
                    <p role="alert" className="mb-4 text-xs font-bold text-red-700 bg-red-50 border border-red-300 rounded-xl p-3 w-full text-center">
                      {error}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-4 w-full">
                    <button
                      type="button"
                      onClick={() => { setConfirm(false); setError(''); }}
                      disabled={busy}
                      aria-label="Keep tickets"
                      className="flex-1 font-body font-bold text-[14px] text-ink-black bg-brand-white border-2 border-ink-black rounded-full py-3 hover:bg-brand-blue-light transition-all cursor-pointer active:translate-y-px select-none text-center outline-none shadow-[2px_2px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      Keep tickets
                    </button>
                    <button
                      type="button"
                      onClick={() => void cancel()}
                      disabled={busy}
                      aria-label="Confirm cancellation"
                      className="flex-1 font-body font-bold text-[14px] text-brand-white bg-[#FF3B3B] border-2 border-ink-black rounded-full py-3 hover:bg-[#E02424] transition-all cursor-pointer active:translate-y-[2px] shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F] outline-none disabled:opacity-50"
                    >
                      {busy ? 'Cancelling…' : 'Confirm cancellation'}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </>
      )}

      {!confirm && error && (
        <p role="alert" className="mt-2 text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
