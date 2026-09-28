import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, CreditCard, Lock } from 'lucide-react';

interface HoldConfirmationPopUpProps {
  isOpen: boolean;
  holdId: string;
  categoryName: string;
  quantity: number;
  totalPrice: number;
  currency?: string;
  expiresAt: string;
  onProceedToPayment: () => void | Promise<void>;
  onCancelHold?: () => void;
  onClose: () => void;
}

export const HoldConfirmationPopUp: React.FC<HoldConfirmationPopUpProps> = ({
  isOpen,
  categoryName,
  quantity,
  totalPrice,
  currency = 'LKR',
  expiresAt,
  onProceedToPayment,
  onCancelHold,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);

  useEffect(() => {
    if (!isOpen || !expiresAt) return;

    const updateTimer = () => {
      const target = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));

      if (diff <= 0) {
        onClose();
        return;
      }

      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, expiresAt, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm transition-all duration-300">
      
      {/* PopUp Card */}
      <div className="bg-brand-white border-3 border-ink-black rounded-[32px] shadow-soft-3d w-full max-w-[460px] p-8 flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light transition-all"
          aria-label="Close modal"
        >
          <span className="font-body font-bold text-sm text-ink-black select-none">✕</span>
        </button>

        {/* Top Success Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-ink-black flex items-center justify-center mb-4 text-emerald-600 shadow-[2px_2px_0px_0px_#0A0A0F]">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>

        {/* Title */}
        <h2 className="font-heading font-extrabold text-[26px] text-ink-black text-center mb-1 leading-snug">
          Ticket Hold Confirmed!
        </h2>

        {/* Subtitle */}
        <p className="font-body text-[14px] text-ink-gray-70 text-center mb-5 leading-relaxed max-w-[360px]">
          You are holding this ticket! Proceed to payment before your hold expires.
        </p>

        {/* Details Box */}
        <div className="w-full bg-[#F9F9FF] border-2 border-ink-black rounded-24 p-5 flex flex-col gap-3 mb-6 shadow-brutal-s">
          
          <div className="flex justify-between items-center pb-3 border-b border-ink-gray-30">
            <span className="font-body text-xs font-bold text-ink-gray-70 uppercase tracking-wider">
              TICKET TIER
            </span>
            <span className="font-body font-bold text-sm text-ink-black">
              {categoryName} × {quantity}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-ink-gray-30">
            <span className="font-body text-xs font-bold text-ink-gray-70 uppercase tracking-wider">
              TOTAL AMOUNT
            </span>
            <span className="font-heading font-extrabold text-lg text-brand-blue">
              Rs. {totalPrice.toFixed(2)} {currency}
            </span>
          </div>

          {/* Expiration Timer Box */}
          <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-16 p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock size={18} className="animate-pulse text-amber-600" />
              <span className="font-body text-xs font-bold">Hold Expires In:</span>
            </div>
            <span className="font-heading font-extrabold text-base text-amber-900 tracking-wider">
              {timeLeft || '10:00'}
            </span>
          </div>

        </div>

        {/* Primary Action Button */}
        <button
          onClick={async () => {
            setIsProceeding(true);
            try {
              await onProceedToPayment();
            } finally {
              setIsProceeding(false);
            }
          }}
          disabled={isProceeding || isCanceling}
          className="w-full bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-base py-3.5 px-6 rounded-full border-3 border-ink-black shadow-[4px_4px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#0A0A0F] active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
        >
          {isProceeding ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing…</span>
            </div>
          ) : (
            <>
              <CreditCard size={20} />
              <span>Proceed to Payment</span>
            </>
          )}
        </button>

        {/* Cancel Hold Secondary Button */}
        <button
          onClick={async () => {
            if (onCancelHold) {
              setIsCanceling(true);
              try {
                await onCancelHold();
              } finally {
                setIsCanceling(false);
              }
            } else {
              onClose();
            }
          }}
          disabled={isCanceling}
          className="w-full mt-3 bg-brand-white hover:bg-rose-50 text-state-error font-heading font-bold text-sm py-3 px-6 rounded-full border-2 border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isCanceling ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-state-error border-t-transparent rounded-full animate-spin"></div>
              <span>Canceling Hold…</span>
            </div>
          ) : (
            <span>Cancel Hold</span>
          )}
        </button>

        {/* Secure Note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-ink-gray-70 font-body font-medium mt-4">
          <Lock size={13} className="text-ink-gray-70" />
          <span>Stock locked for you · 100% Secure Checkout</span>
        </div>

      </div>
    </div>
  );
};
