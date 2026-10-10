import { useEffect, useState } from 'react';
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

  return <section className="mt-4 rounded-xl border border-slate-300 p-4 text-sm" aria-label="Order cancellation">
    {(state || cancelled) ? <div role="status">
      <strong>Order cancelled — tickets are no longer valid.</strong>
      <p>{state?.refundStatus === 'Simulated' ? 'Full refund simulated in sandbox. No money was moved.'
        : state?.refundStatus === 'Succeeded' ? 'Full refund processed.'
        : state?.refundStatus === 'NotRequired' ? 'No payment was taken; no refund is required.' : 'Full refund processing. You do not need to submit again.'}</p>
      {state && !state.inventoryReturned && <p>Ticket availability is being restored.</p>}
      {state?.notificationStatus === 'Simulated' && <p>Email simulated; no email was sent.</p>}
      {state?.notificationStatus === 'Sent' && <p>Confirmation email sent.</p>}
      {['NeedsReconciliation', 'MissingRecipient'].includes(state?.notificationStatus || '') && <p>Email delivery needs support review.</p>}
    </div> : used ? <p>This order cannot be cancelled because a ticket has been used.</p>
      : confirm ? <div>
        <p>Cancel this entire order and all its tickets? A full refund will be requested. Cancellation is allowed before the show starts if no tickets are used.</p>
        <button type="button" disabled={busy} onClick={() => void cancel()} className="mt-3 mr-4 font-bold text-red-700">{busy ? 'Cancelling…' : 'Confirm cancellation'}</button>
        <button type="button" disabled={busy} onClick={() => setConfirm(false)}>Keep tickets</button>
      </div> : <button type="button" onClick={() => setConfirm(true)} className="font-bold text-red-700">Cancel entire order</button>}
    {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
  </section>;
}
