import React, { useEffect, useState } from 'react';
import { joinQueue, fetchQueueStatus, QueueNotFoundError, type QueuePosition } from '../common/waitingRoomApi';

interface WaitingRoomPopUpProps {
  isOpen: boolean;
  showId: string;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  // The show's on-sale time from the catalog event data already on screen — used only to
  // explain a 404 on join (the pre-queue window hasn't opened yet). The join failure itself
  // carries no machine-readable time, just a human message.
  saleOpensAt?: string | null;
  onAdmitted: (token: string, expiresAt: string) => void;
  onClose?: () => void;
}

type Phase = 'joining' | 'not-open' | 'waiting' | 'admitted' | 'sold-out' | 'error';

// Everyone in a queue polls at once, so a fixed tick produces a spike on every server at
// the same moment. Jittering each interval independently spreads that load out instead.
const POLL_MIN_MS = 3000;
const POLL_MAX_MS = 6000;

function jitterDelay(): number {
  return POLL_MIN_MS + Math.random() * (POLL_MAX_MS - POLL_MIN_MS);
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return 'soon';
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'soon';
  }
}

export const WaitingRoomPopUp: React.FC<WaitingRoomPopUpProps> = ({
  isOpen,
  showId,
  apiFetch,
  saleOpensAt,
  onAdmitted,
  onClose,
}) => {
  const [phase, setPhase] = useState<Phase>('joining');
  const [queueStatus, setQueueStatus] = useState<QueuePosition | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !showId) return;

    let cancelled = false;
    let joined = false;
    // Turns false the moment a terminal status (admitted, sold out) or a hard failure is
    // reached — polling has nothing left to check after that.
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const clearScheduled = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const applyStatus = (status: QueuePosition) => {
      setQueueStatus(status);
      if (status.status === 'Admitted' && status.admissionToken && status.admissionExpiresAt) {
        active = false;
        setPhase('admitted');
        onAdmitted(status.admissionToken, status.admissionExpiresAt);
        return;
      }
      if (status.status === 'SoldOut') {
        active = false;
        setPhase('sold-out');
        return;
      }
      setPhase('waiting');
    };

    const poll = async () => {
      if (cancelled || !active || document.visibilityState !== 'visible') return;
      try {
        const status = await fetchQueueStatus(showId, apiFetch);
        if (cancelled) return;
        applyStatus(status);
      } catch {
        // A single failed poll keeps the last known position on screen; the next
        // jittered tick tries again rather than surfacing a transient error.
      } finally {
        if (!cancelled && active) {
          timeoutId = setTimeout(poll, jitterDelay());
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (joined && active && !timeoutId) poll();
      } else {
        clearScheduled();
      }
    };

    const start = async () => {
      setPhase('joining');
      setErrorMsg(null);

      try {
        await joinQueue(showId, apiFetch);
        if (cancelled) return;
        joined = true;

        const status = await fetchQueueStatus(showId, apiFetch);
        if (cancelled) return;
        applyStatus(status);

        if (!cancelled && active && document.visibilityState === 'visible') {
          timeoutId = setTimeout(poll, jitterDelay());
        }
      } catch (err) {
        if (cancelled) return;
        active = false;
        if (err instanceof QueueNotFoundError) {
          setPhase('not-open');
        } else {
          setPhase('error');
          setErrorMsg(err instanceof Error ? err.message : 'Unable to join the queue.');
        }
      }
    };

    start();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      clearScheduled();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, showId, apiFetch, onAdmitted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-ink-black/60 backdrop-blur-sm transition-all duration-300">
      <div
        className="bg-brand-white border-3 border-ink-black shadow-soft-3d rounded-[32px] w-full max-w-[420px] p-8 flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light transition-all"
            aria-label="Close modal"
          >
            <span className="font-body font-bold text-sm text-ink-black select-none">✕</span>
          </button>
        )}

        <div className="bg-surface-yellow border-2 border-ink-black rounded-full px-5 py-1 mb-4 flex items-center justify-center">
          <span className="font-body font-bold text-[12px] tracking-[0.4px] text-ink-black uppercase">
            High Demand
          </span>
        </div>

        {phase === 'joining' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-8 h-8 border-3 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="font-body text-sm font-semibold text-ink-gray-70">Joining the queue…</p>
          </div>
        )}

        {phase === 'not-open' && (
          <>
            <h2 className="font-heading font-extrabold text-[26px] text-ink-black text-center mb-2 leading-snug">
              Not open yet
            </h2>
            <p className="font-body text-sm text-ink-gray-70 text-center mb-6">
              This show's queue opens when sales start, at{' '}
              <span className="font-bold text-ink-black">{formatDateTime(saleOpensAt)}</span>. Come back
              then to join.
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full font-body font-bold text-base text-brand-white bg-brand-blue rounded-full py-3 px-6 border-3 border-ink-black shadow-brutal-m hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
              >
                Got it
              </button>
            )}
          </>
        )}

        {phase === 'waiting' && (
          <div className="flex flex-col items-center justify-center w-full">
            <h2 className="font-heading font-extrabold text-[26px] text-ink-black text-center mb-2 leading-snug">
              You're in the queue
            </h2>

            {queueStatus?.position !== null && queueStatus?.position !== undefined ? (
              <>
                <p className="font-body text-sm text-ink-gray-70 text-center mb-4">Your position in line</p>
                <div className="font-heading font-extrabold text-[52px] text-brand-blue text-center tracking-tight leading-none mb-2">
                  #{queueStatus.position}
                </div>
              </>
            ) : (
              <p className="font-body text-sm text-ink-gray-70 text-center mb-2">
                You're in the pre-queue. Sales start at{' '}
                <span className="font-bold text-ink-black">{formatDateTime(queueStatus?.onSaleAt)}</span> —
                numbers are handed out once they do.
              </p>
            )}
          </div>
        )}

        {phase === 'admitted' && (
          <div className="flex flex-col items-center gap-3 w-full">
            <h2 className="font-heading font-extrabold text-[26px] text-ink-black text-center mb-1 leading-snug">
              You're in!
            </h2>
            <p className="font-body text-sm text-ink-gray-70 text-center mb-2">
              Your turn has arrived. Select your tickets now.
            </p>
            <button
              onClick={onClose}
              className="w-full font-body font-bold text-base text-brand-white bg-brand-blue rounded-full py-3 px-6 border-3 border-ink-black shadow-brutal-m hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
            >
              Continue to ticket selection
            </button>
          </div>
        )}

        {phase === 'sold-out' && (
          <>
            <h2 className="font-heading font-extrabold text-[26px] text-ink-black text-center mb-2 leading-snug">
              This show sold out
            </h2>
            <p className="font-body text-sm text-ink-gray-70 text-center mb-6">
              Every ticket was claimed while you were waiting, and the queue has closed.
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full font-body font-bold text-base text-ink-black bg-brand-white rounded-full py-3 px-6 border-3 border-ink-black shadow-brutal-m hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </>
        )}

        {phase === 'error' && (
          <>
            <h2 className="font-heading font-extrabold text-xl text-ink-black text-center mb-2">
              Something went wrong
            </h2>
            <p className="font-body text-sm text-state-error text-center mb-4">{errorMsg}</p>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full font-body font-bold text-base text-ink-black bg-brand-white rounded-full py-3 px-6 border-3 border-ink-black shadow-brutal-m hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
