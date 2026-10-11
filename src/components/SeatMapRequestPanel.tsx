import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Badge } from './Badge';
import { SeatMapRequestPopUp } from '../popUps/SeatMapRequestPopUp';
import { fetchSeatMapRequests, requestSeatMap, type SeatMapRequest } from '../common/seatMapApi';
import { ApiError } from '../common/problemDetails';

interface SeatMapRequestPanelProps {
  showId: string;
  // Writes are refused for a suspended organizer; reading the status stays available.
  disabled?: boolean;
  disabledHint?: string;
}

export const SeatMapRequestPanel: React.FC<SeatMapRequestPanelProps> = ({ showId, disabled = false, disabledHint }) => {
  const { apiFetch } = useAuth();
  const [latest, setLatest] = useState<SeatMapRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const requests = await fetchSeatMapRequests(apiFetch, showId);
      setLatest(requests[0] ?? null);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (description: string) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await requestSeatMap(apiFetch, showId, description);
      setLatest(created);
      setFormOpen(false);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to submit the seat map request.');
      if (err instanceof ApiError && err.status === 409) {
        // Someone else's request (or an enabled map) already exists: show the real state.
        void load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canRequest = !latest || latest.status === 'Rejected';

  return (
    <div className="flex flex-col gap-2 border-t border-ink-gray-30 pt-2.5" aria-label="Seat map">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-ink-gray-70">Seating</span>

        {loading ? (
          <span className="text-[12px] text-ink-gray-70">Checking…</span>
        ) : loadError ? (
          <button
            type="button"
            onClick={() => void load()}
            className="text-[12px] font-bold text-brand-blue cursor-pointer underline"
          >
            Seat map status unavailable. Retry
          </button>
        ) : latest?.status === 'Pending' ? (
          <Badge variant="warning" uppercase>Seat map requested</Badge>
        ) : latest?.status === 'Completed' ? (
          <Badge variant="success" uppercase>Seated</Badge>
        ) : latest?.status === 'Rejected' ? (
          <Badge variant="error" uppercase>Request rejected</Badge>
        ) : (
          <span className="text-[12px] text-ink-gray-70">General admission</span>
        )}
      </div>

      {latest?.status === 'Rejected' && latest.rejectionReason && (
        <p className="text-[12px] text-ink-gray-70">Reason: {latest.rejectionReason}</p>
      )}
      {latest?.status === 'Pending' && (
        <p className="text-[12px] text-ink-gray-70">An admin will build the layout. You will see the result here.</p>
      )}

      {!loading && !loadError && canRequest && (
        <button
          type="button"
          onClick={() => {
            setSubmitError(null);
            setFormOpen(true);
          }}
          disabled={disabled}
          title={disabled ? disabledHint : undefined}
          className="self-start text-xs font-bold text-brand-blue hover:text-[#1a1a5b] cursor-pointer py-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {latest ? 'Request again' : 'Request seat map'}
        </button>
      )}

      {formOpen && (
        <SeatMapRequestPopUp
          isLoading={submitting}
          error={submitError}
          onClose={() => setFormOpen(false)}
          onSubmit={(description) => void handleSubmit(description)}
        />
      )}
    </div>
  );
};
