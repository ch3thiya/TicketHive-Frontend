import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SeatMap, type SeatCategoryInfo } from './SeatMap';
import {
  fetchSeatMap,
  fetchSeatStates,
  seatLabel,
  SeatMapNotFoundError,
  type SeatHoldOutcome,
  type SeatMapData,
  type SeatMapSeat,
  type SeatState,
} from '../common/seatApi';

export interface SelectedSeat {
  id: string;
  categoryId: string;
  section: string;
  row: string;
  number: number;
  price: number;
}

interface SeatSelectionProps {
  showId: string;
  categories: Readonly<Record<string, SeatCategoryInfo>>;
  // The show's per-customer limit; the server enforces it too.
  maxSeats?: number;
  isAuthenticated: boolean;
  onLogin: () => void;
  onHold: (seats: SelectedSeat[]) => Promise<SeatHoldOutcome>;
  disabled?: boolean;
  pollIntervalMs?: number;
  fetchFn?: (url: string, options?: RequestInit) => Promise<Response>;
}

const DEFAULT_POLL_MS = 3000;
// Spread polls out so many open tabs do not refresh in lockstep.
const withJitter = (ms: number) => Math.round(ms * (0.85 + Math.random() * 0.3));

export const SeatSelection: React.FC<SeatSelectionProps> = ({
  showId,
  categories,
  maxSeats = 6,
  isAuthenticated,
  onLogin,
  onHold,
  disabled = false,
  pollIntervalMs = DEFAULT_POLL_MS,
  fetchFn = fetch,
}) => {
  const [map, setMap] = useState<SeatMapData | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'none' | 'error'>('loading');
  const [unavailable, setUnavailable] = useState<ReadonlyMap<string, SeatState>>(new Map());
  const [selected, setSelected] = useState<SelectedSeat[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [updatesPaused, setUpdatesPaused] = useState(false);
  const selectedRef = useRef<SelectedSeat[]>([]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await fetchSeatMap(showId, fetchFn);
      const taken = new Map<string, SeatState>();
      data.sections.forEach((s) => s.rows.forEach((r) => r.seats.forEach((seat) => seat.state !== 'Available' && taken.set(seat.id, seat.state))));
      setMap(data);
      setUnavailable(taken);
      setLoadState('ready');
    } catch (err) {
      setLoadState(err instanceof SeatMapNotFoundError ? 'none' : 'error');
    }
  }, [showId, fetchFn]);

  useEffect(() => {
    void load();
  }, [load]);

  // Drop selected seats that someone else took, and say so.
  const applyStates = useCallback((states: { id: string; state: SeatState }[]) => {
    const next = new Map<string, SeatState>(states.map((s) => [s.id, s.state]));
    setUnavailable(next);
    const lost = selectedRef.current.filter((seat) => next.has(seat.id));
    if (lost.length > 0) {
      setSelected((current) => current.filter((seat) => !next.has(seat.id)));
      setNotice(`${lost.map(seatLabel).join(', ')} ${lost.length === 1 ? 'was' : 'were'} just taken and removed from your selection.`);
    }
  }, []);

  // Live updates without a page refresh (AC5): poll the small states endpoint while the tab is visible.
  useEffect(() => {
    if (loadState !== 'ready') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        applyStates(await fetchSeatStates(showId, fetchFn));
        failures = 0;
        setUpdatesPaused(false);
      } catch {
        failures += 1;
        if (failures >= 2) setUpdatesPaused(true);
      }
      if (!cancelled && document.visibilityState === 'visible') timer = setTimeout(poll, withJitter(pollIntervalMs));
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (timer) clearTimeout(timer);
        void poll();
      } else if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    timer = setTimeout(poll, withJitter(pollIntervalMs));
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadState, showId, fetchFn, pollIntervalMs, applyStates]);

  const toggle = (seat: SeatMapSeat, section: string, row: string) => {
    setNotice(null);
    setError(null);
    setSelected((current) => {
      if (current.some((s) => s.id === seat.id)) return current.filter((s) => s.id !== seat.id);
      if (current.length >= maxSeats) {
        setNotice(`You can select up to ${maxSeats} seats.`);
        return current;
      }
      const price = map?.categories.find((c) => c.categoryId === seat.categoryId)?.unitPrice ?? categories[seat.categoryId]?.price ?? 0;
      return [...current, { id: seat.id, categoryId: seat.categoryId, section, row, number: seat.number, price }];
    });
  };

  const total = useMemo(() => selected.reduce((sum, seat) => sum + seat.price, 0), [selected]);
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const hold = async () => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    setHolding(true);
    setNotice(null);
    setError(null);
    try {
      const outcome = await onHold(selected);
      if (outcome.kind === 'created') {
        setSelected([]);
      } else if (outcome.kind === 'seats-unavailable') {
        // Nothing was held. Take the named seats out of the selection and show their real state.
        const taken = new Set(outcome.seats.map((s) => s.seatId));
        setSelected((current) => current.filter((seat) => !taken.has(seat.id)));
        setUnavailable((current) => {
          const next = new Map(current);
          taken.forEach((id) => next.set(id, 'Held'));
          return next;
        });
        setError(outcome.message);
        void fetchSeatStates(showId, fetchFn).then(applyStates).catch(() => undefined);
      } else if (outcome.kind === 'failed') {
        setError(outcome.message);
      }
      // 'admission-required' and 'sales-unavailable' are handled by the page (waiting room, notice).
    } finally {
      setHolding(false);
    }
  };

  if (loadState === 'loading') {
    return <p role="status" className="font-body text-sm text-ink-gray-70">Loading the seat map…</p>;
  }
  if (loadState === 'none') {
    return <p className="font-body text-sm text-ink-gray-70">Seat selection is not available for this show yet.</p>;
  }
  if (loadState === 'error' || !map) {
    return (
      <div role="alert" className="flex flex-col gap-2 bg-red-50 border-2 border-red-500 rounded-2xl p-3 text-[#FF3B3B] font-body font-medium text-sm">
        <span>The seat map could not be loaded.</span>
        <button type="button" onClick={() => void load()} className="self-start font-bold underline cursor-pointer">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SeatMap map={map} unavailable={unavailable} selected={selectedIds} categories={categories} disabled={disabled || holding} onToggle={toggle} />

      {updatesPaused && (
        <p role="status" className="font-body text-xs font-medium text-ink-gray-70">
          Live updates are paused. Seats may have changed; this will resume on its own.
        </p>
      )}
      {notice && <p role="status" className="font-body text-sm font-medium text-ink-black">{notice}</p>}
      {error && (
        <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-2xl p-3 text-[#FF3B3B] font-body font-medium text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t-2 border-ink-gray-30 pt-3">
        <h4 className="font-heading font-bold text-sm text-ink-black">Your seats</h4>
        {selected.length === 0 ? (
          <p className="font-body text-xs text-ink-gray-70">Choose up to {maxSeats} seats on the map.</p>
        ) : (
          <ul aria-label="Selected seats" className="flex flex-col gap-1">
            {selected.map((seat) => (
              <li key={seat.id} className="flex items-center justify-between font-body text-sm text-ink-black">
                <span>
                  {seatLabel(seat)} · {categories[seat.categoryId]?.name ?? 'Ticket'}
                </span>
                <span className="font-bold">${seat.price.toFixed(0)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between font-heading font-extrabold text-base text-ink-black">
          <span>Total</span>
          <span>${total.toFixed(0)}</span>
        </div>
        <button
          type="button"
          onClick={() => void hold()}
          disabled={disabled || holding || (isAuthenticated && selected.length === 0)}
          className="w-full bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-base py-3.5 px-6 rounded-full border-3 border-ink-black shadow-[4px_4px_0px_0px_#0A0A0F] transition-all cursor-pointer disabled:bg-ink-gray-30 disabled:text-ink-gray-70 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {holding
            ? 'Holding seats…'
            : !isAuthenticated
              ? 'Sign in to hold seats'
              : selected.length === 0
                ? 'Hold seats'
                : `Hold ${selected.length} ${selected.length === 1 ? 'seat' : 'seats'}`}
        </button>
      </div>
    </div>
  );
};
