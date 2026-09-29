import { GATEWAY_URL } from '../config';
import React, { useEffect, useState } from 'react';

interface QueueStatusData {
  showId: string;
  customerSub: string;
  status: 'Waiting' | 'Admitted' | 'Expired';
  position: number;
  totalWaiting: number;
  admissionToken?: string | null;
  tokenExpiresAt?: string | null;
}

interface WaitingRoomPopUpProps {
  isOpen: boolean;
  showId: string;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onAdmitted: (token: string) => void;
  onClose?: () => void;
}

const INVENTORY_API_URL = import.meta.env.VITE_INVENTORY_API_URL || '';

export const WaitingRoomPopUp: React.FC<WaitingRoomPopUpProps> = ({
  isOpen,
  showId,
  apiFetch,
  onAdmitted,
  onClose,
}) => {
  const [queueStatus, setQueueStatus] = useState<QueueStatusData | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !showId) return;

    let cancelled = false;

    const joinAndPoll = async () => {
      setIsJoining(true);
      setErrorMsg(null);

      try {
        await apiFetch(`${GATEWAY_URL}/api/waiting-room/queues/${showId}/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const statusRes = await apiFetch(`${GATEWAY_URL}/api/waiting-room/queues/${showId}/entries/me`);
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (!cancelled) {
            setQueueStatus({
              showId,
              customerSub: '',
              status: data.status === 'Admitted' ? 'Admitted' : 'Waiting',
              position: data.position ?? 1,
              totalWaiting: data.position ?? 1,
              admissionToken: data.admissionToken,
            });
            if (data.status === 'Admitted' && data.admissionToken) {
              onAdmitted(data.admissionToken);
            }
          }
        } else if (!cancelled) {
          setErrorMsg('Unable to join the waiting room line. Please try again.');
        }
      } catch (err) {
        console.error('Waiting room error:', err);
        if (!cancelled) {
          setErrorMsg('Connection error. Retrying...');
        }
      } finally {
        if (!cancelled) setIsJoining(false);
      }
    };

    const pollStatus = async () => {
      try {
        const res = await apiFetch(`${GATEWAY_URL}/api/waiting-room/queues/${showId}/entries/me`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setQueueStatus({
              showId,
              customerSub: '',
              status: data.status === 'Admitted' ? 'Admitted' : 'Waiting',
              position: data.position ?? 1,
              totalWaiting: data.position ?? 1,
              admissionToken: data.admissionToken,
            });
            if (data.status === 'Admitted' && data.admissionToken) {
              onAdmitted(data.admissionToken);
            }
          }
        }
      } catch (err) {
        console.error('Error polling queue status:', err);
      }
    };

    joinAndPoll();

    const intervalId = setInterval(pollStatus, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isOpen, showId, apiFetch, onAdmitted]);

  if (!isOpen) return null;

  const isAdmitted = queueStatus?.status === 'Admitted' && queueStatus.admissionToken;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm transition-all duration-300">
      
      {/* PopUp Card */}
      <div className="bg-white border-2 border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-[32px] w-full max-w-[420px] p-8 flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full border border-black/10 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-all"
            aria-label="Close modal"
          >
            <span className="font-body font-bold text-sm text-ink-black select-none">✕</span>
          </button>
        )}

        {/* Top Waiting Clock / Progress Vector Graphic */}
        <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
          <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none">
            <path d="M 50 50 L 50 10 A 40 40 0 0 0 20 70 Z" fill="#E2E6FF" />
            <circle cx="50" cy="50" r="40" stroke="#003BFF" strokeWidth="7" fill="none" />
            <path d="M 50 50 L 50 10" stroke="#003BFF" strokeWidth="7" strokeLinecap="round" />
            <path d="M 50 50 L 20 70" stroke="#003BFF" strokeWidth="7" strokeLinecap="round" />
          </svg>
        </div>

        {/* Badge */}
        <div className="bg-[#FFE54C] border-2 border-black rounded-full px-5 py-1 mb-4 flex items-center justify-center shadow-sm">
          <span className="font-heading font-extrabold text-[12px] tracking-wide text-black uppercase">
            HIGH DEMAND
          </span>
        </div>

        {/* Title */}
        <h2 className="font-heading font-extrabold text-[28px] text-ink-black text-center mb-2 tracking-tight leading-snug">
          {isAdmitted ? "You're admitted!" : "You're in the queue!"}
        </h2>

        {/* Subtitle */}
        <p className="font-body text-[14px] text-ink-gray-50 text-center mb-4">
          {isAdmitted
            ? "Your turn has arrived. Select your tickets now."
            : "Position in line"}
        </p>

        {/* Dynamic Position Display or Admitted Access Action */}
        {isAdmitted ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="bg-emerald-50 border border-emerald-300 rounded-20 p-4 w-full text-center">
              <span className="text-emerald-700 font-body font-bold text-sm">
                Admission Token Secured
              </span>
            </div>
            <button
              onClick={() => {
                if (queueStatus?.admissionToken) {
                  onAdmitted(queueStatus.admissionToken);
                }
              }}
              className="w-full font-body font-bold text-base text-white bg-[#003BFF] hover:bg-[#002ed4] rounded-full py-3 px-6 shadow-md transition-all cursor-pointer"
            >
              Continue to Ticket Selection
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full">
            {isJoining && !queueStatus ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-6 h-6 border-3 border-[#003BFF] border-t-transparent rounded-full animate-spin"></div>
                <span className="font-body text-sm font-semibold text-ink-gray-70">
                  Joining queue...
                </span>
              </div>
            ) : (
              <>
                <div className="font-heading font-extrabold text-[52px] text-[#003BFF] text-center tracking-tight leading-none mb-4">
                  #{queueStatus?.position ?? '...'}
                </div>

                <button
                  onClick={async () => {
                    setIsLeaving(true);
                    try {
                      await apiFetch(`${INVENTORY_API_URL}/api/inventory/shows/${showId}/waiting-room/leave`, {
                        method: 'POST',
                      });
                    } catch (err) {
                      console.error('Leave queue error:', err);
                    } finally {
                      setIsLeaving(false);
                      if (onClose) onClose();
                    }
                  }}
                  disabled={isLeaving}
                  className="w-full mt-2 font-body font-bold text-sm text-[#FF3B3B] bg-brand-white border-2 border-ink-black hover:bg-rose-50 rounded-full py-2.5 px-6 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 disabled:opacity-50"
                >
                  {isLeaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#FF3B3B] border-t-transparent rounded-full animate-spin"></div>
                      <span>Leaving Queue…</span>
                    </div>
                  ) : (
                    <span>Leave Queue</span>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Error message fallback */}
        {errorMsg && (
          <p className="font-body text-xs text-state-error text-center mt-3">
            {errorMsg}
          </p>
        )}

      </div>
    </div>
  );
};
