import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { QrCode, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ShieldCheck, RefreshCw, History } from 'lucide-react';

const BOOKING_API_URL = import.meta.env.VITE_BOOKING_API_URL || '';

interface TicketValidationPageProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationLog {
  code: string;
  status: 'valid' | 'used' | 'invalid';
  message: string;
  timestamp: string;
  details?: {
    usedAt?: string;
    usedBy?: string;
  };
}

export const TicketValidationPage: React.FC<TicketValidationPageProps> = ({ isOpen, onClose }) => {
  const { apiFetch } = useAuth();
  const [ticketCode, setTicketCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationLog | null>(null);
  const [scanHistory, setScanHistory] = useState<ValidationLog[]>([]);

  const handleValidate = async (e?: React.FormEvent, codeToValidate?: string) => {
    if (e) e.preventDefault();

    const cleanCode = (codeToValidate || ticketCode).trim().toUpperCase();
    if (!cleanCode) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await apiFetch(`${BOOKING_API_URL}/api/booking/tickets/${encodeURIComponent(cleanCode)}/validate`, {
        method: 'POST',
      });

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (res.ok || res.status === 200) {
        const data = await res.json();
        const resultItem: ValidationLog = {
          code: cleanCode,
          status: 'valid',
          message: 'Ticket Validated & Marked as Used',
          timestamp: now,
          details: { usedAt: data.usedAt },
        };
        setValidationResult(resultItem);
        setScanHistory((prev) => [resultItem, ...prev]);
        setTicketCode('');
      } else {
        const err = await res.json().catch(() => null);
        let statusType: 'used' | 'invalid' = 'invalid';

        if (res.status === 409 || err?.title?.includes('used')) {
          statusType = 'used';
        }

        const resultItem: ValidationLog = {
          code: cleanCode,
          status: statusType,
          message: err?.detail || err?.title || (statusType === 'used' ? 'Ticket already used' : 'Ticket code not recognised'),
          timestamp: now,
        };
        setValidationResult(resultItem);
        setScanHistory((prev) => [resultItem, ...prev]);
      }
    } catch (err) {
      console.error('Ticket validation error:', err);
      const resultItem: ValidationLog = {
        code: cleanCode,
        status: 'invalid',
        message: 'Network error validating ticket code.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setValidationResult(resultItem);
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-validate and reset state when opened/closed
  React.useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(window.location.search);
      const validateParam = params.get('validate');
      if (validateParam) {
        setTicketCode(validateParam);
        setTimeout(() => {
          handleValidate(undefined, validateParam);
          // Remove query parameter without reloading
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }, 300);
      }
    } else {
      setTicketCode('');
      setValidationResult(null);
      setScanHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-brand-white border-3 border-ink-black rounded-[32px] shadow-soft-3d w-full max-w-[700px] max-h-[90vh] overflow-y-auto p-8 relative flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light transition-all"
          aria-label="Close modal"
        >
          <span className="font-body font-bold text-sm text-ink-black select-none">✕</span>
        </button>

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8 pb-6 mt-2">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-ink-black flex items-center gap-2">
              <span>Organizer Ticket Validator</span>
            </h1>
            <p className="font-body text-sm text-ink-gray-200 mt-1">
              Enter or Scan Ticket Code (e.g. TKT-XXXX-XXXX-XXXX)
            </p>
          </div>
        </div>
      </div>

      {/* Main Validation Input Card */}
      <div className="bg-brand-white mb-8">
        <form onSubmit={handleValidate} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="TKT-XXXX-XXXX-XXXX"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                className="w-full bg-[#F9F9FF] border-3 border-ink-black rounded-24 px-5 py-4 font-mono text-xl font-bold text-brand-blue uppercase tracking-wider outline-none focus:ring-3 focus:ring-brand-blue/30 shadow-inner"
                autoFocus
              />
              <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-gray-70" size={24} />
            </div>
            <button
              type="submit"
              disabled={isValidating || !ticketCode.trim()}
              className="bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-base py-4 px-8 rounded-24 border-3 border-ink-black shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {isValidating ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Validating…</span>
                </>
              ) : (
                <span>Validate & Redeem</span>
              )}
            </button>
          </div>
        </form>

        {/* Distinct Outcome Cards (SCRUM-21 AC6) */}
        {validationResult && (
          <div className="mt-8 animate-in zoom-in duration-200">
            
            {/* 🟢 VALID (AC1) */}
            {validationResult.status === 'valid' && (
              <div className="bg-emerald-50 border-3 border-emerald-600 rounded-28 p-6 text-emerald-950 flex flex-col items-center text-center shadow-brutal-s">
                <div className="w-16 h-16 rounded-full bg-emerald-500 border-2 border-ink-black flex items-center justify-center text-white mb-3 shadow-[2px_2px_0px_0px_#0A0A0F]">
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <div className="font-heading font-extrabold text-2xl text-emerald-900 tracking-wide uppercase mb-1">
                  TICKET VALID & REDEEMED!
                </div>
                <p className="font-body text-sm font-semibold text-emerald-800 mb-3">
                  Attendee is authorized for entry. Ticket marked as used.
                </p>
                <div className="font-mono font-extrabold text-base bg-white border-2 border-emerald-600 rounded-16 px-4 py-2 text-emerald-900">
                  CODE: {validationResult.code}
                </div>
              </div>
            )}

            {/* 🟡 ALREADY USED (AC2) */}
            {validationResult.status === 'used' && (
              <div className="bg-amber-50 border-3 border-amber-500 rounded-28 p-6 text-amber-950 flex flex-col items-center text-center shadow-brutal-s">
                <div className="w-16 h-16 rounded-full bg-amber-400 border-2 border-ink-black flex items-center justify-center text-amber-950 mb-3 shadow-[2px_2px_0px_0px_#0A0A0F]">
                  <AlertTriangle size={36} strokeWidth={2.5} />
                </div>
                <div className="font-heading font-extrabold text-2xl text-amber-900 tracking-wide uppercase mb-1">
                  ALREADY USED / REDEEMED
                </div>
                <p className="font-body text-sm font-semibold text-amber-800 mb-3 max-w-md">
                  {validationResult.message}
                </p>
                <div className="font-mono font-extrabold text-base bg-white border-2 border-amber-500 rounded-16 px-4 py-2 text-amber-900">
                  CODE: {validationResult.code}
                </div>
              </div>
            )}

            {/* 🔴 UNKNOWN / INVALID (AC3 & AC5) */}
            {validationResult.status === 'invalid' && (
              <div className="bg-rose-50 border-3 border-rose-600 rounded-28 p-6 text-rose-950 flex flex-col items-center text-center shadow-brutal-s">
                <div className="w-16 h-16 rounded-full bg-rose-500 border-2 border-ink-black flex items-center justify-center text-white mb-3 shadow-[2px_2px_0px_0px_#0A0A0F]">
                  <XCircle size={36} strokeWidth={2.5} />
                </div>
                <div className="font-heading font-extrabold text-2xl text-rose-900 tracking-wide uppercase mb-1">
                  NOT RECOGNISED / INVALID
                </div>
                <p className="font-body text-sm font-semibold text-rose-800 mb-3 max-w-md">
                  {validationResult.message}
                </p>
                <div className="font-mono font-extrabold text-base bg-white border-2 border-rose-600 rounded-16 px-4 py-2 text-rose-900">
                  CODE: {validationResult.code}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Live Scan Log Table */}
      {scanHistory.length > 0 && (
        <div className="bg-brand-white border-3 border-ink-black rounded-[32px] p-6 shadow-brutal-s">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-ink-black">
            <History size={20} className="text-brand-blue" />
            <h3 className="font-heading font-bold text-lg text-ink-black">Session Scan History</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {scanHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 border-2 border-ink-black rounded-16 bg-[#F9F9FF]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-ink-black">{item.code}</span>
                  <span className="font-body text-xs text-ink-gray-70">{item.timestamp}</span>
                </div>
                <div>
                  {item.status === 'valid' && (
                    <span className="bg-emerald-100 text-emerald-800 border border-ink-black font-heading font-bold text-xs px-3 py-1 rounded-full uppercase">
                      VALID
                    </span>
                  )}
                  {item.status === 'used' && (
                    <span className="bg-amber-100 text-amber-900 border border-ink-black font-heading font-bold text-xs px-3 py-1 rounded-full uppercase">
                      USED
                    </span>
                  )}
                  {item.status === 'invalid' && (
                    <span className="bg-rose-100 text-rose-800 border border-ink-black font-heading font-bold text-xs px-3 py-1 rounded-full uppercase">
                      INVALID
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
