import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Badge } from './Badge';
import { SeatLayoutBuilder } from './SeatLayoutBuilder';
import {
  fetchAdminSeatMapRequests,
  fetchSeatMapDetail,
  type SeatMapDetail,
  type SeatMapRequestStatus,
  type SeatMapRequestSummary,
  type SeatLayoutSection,
} from '../common/seatMapApi';
import { fetchVenue } from '../common/venueApi';

type Filter = SeatMapRequestStatus | 'All';

const FILTERS: Filter[] = ['Pending', 'Completed', 'Rejected', 'All'];

const statusVariant = (status: SeatMapRequestStatus) =>
  status === 'Pending' ? 'warning' : status === 'Completed' ? 'success' : 'error';

export const SeatMapAdminPanel: React.FC = () => {
  const { apiFetch } = useAuth();
  const [filter, setFilter] = useState<Filter>('Pending');
  const [requests, setRequests] = useState<SeatMapRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SeatMapDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [venueTemplate, setVenueTemplate] = useState<SeatLayoutSection[] | undefined>();

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await fetchAdminSeatMapRequests(apiFetch, filter === 'All' ? undefined : filter));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seat map requests.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, filter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openRequest = useCallback(
    async (requestId: string) => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const loaded = await fetchSeatMapDetail(apiFetch, requestId);
        setDetail(loaded);
        setVenueTemplate(undefined);
        if (loaded.venueId && loaded.layouts.length === 0) {
          try {
            const venue = await fetchVenue(apiFetch, loaded.venueId);
            setVenueTemplate(venue.seatMap?.spec.sections.map(section => ({ ...section, categoryId: '' })));
          } catch {
            // Venue templates are optional; admins can still build this show layout manually.
          }
        }
      } catch (err) {
        setDetail(null);
        setDetailError(err instanceof Error ? err.message : 'Failed to load the seat map request.');
      } finally {
        setDetailLoading(false);
      }
    },
    [apiFetch],
  );

  const handleChanged = useCallback(() => {
    if (detail) void openRequest(detail.request.id);
    void loadList();
  }, [detail, openRequest, loadList]);

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Filter seat map requests" className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={`font-body font-bold text-[13px] border-2 border-ink-black rounded-full px-4 py-1.5 cursor-pointer ${
              filter === option ? 'bg-brand-blue text-brand-white' : 'bg-brand-white text-ink-black hover:bg-brand-blue-light'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 flex justify-center" role="status" aria-label="Loading seat map requests">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-16 p-4 text-[#FF3B3B] font-medium text-sm">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="border-2 border-dashed border-ink-gray-30 rounded-20 py-10 text-center">
          <p className="font-body text-ink-gray-70 font-medium">
            {filter === 'Pending' ? 'No seat map requests are waiting.' : 'No seat map requests match this filter.'}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map(({ request, eventName, showDate, showTime, ticketTotal }) => (
            <li
              key={request.id}
              className="bg-[#F9F9FC] border-2 border-ink-gray-30 rounded-20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="font-body font-bold text-[15px] text-ink-black">{eventName}</h3>
                  <Badge variant={statusVariant(request.status)} uppercase>
                    {request.status}
                  </Badge>
                </div>
                <p className="font-body text-[13px] text-ink-gray-70 mb-2">
                  {showDate} · {showTime?.substring(0, 5)} · {ticketTotal} tickets
                </p>
                <p className="font-body text-[14px] text-ink-black leading-relaxed">{request.description}</p>
              </div>
              <button
                type="button"
                onClick={() => void openRequest(request.id)}
                aria-label={`${request.status === 'Pending' ? 'Build layout for' : 'View'} ${eventName}`}
                className="shrink-0 font-body font-bold text-[14px] text-ink-black bg-[#FFE94D] border-2.5 border-ink-black rounded-full px-5 py-2 hover:bg-[#F3DC3C] cursor-pointer shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                {request.status === 'Pending' ? 'Build layout' : 'View'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {(detail || detailLoading || detailError) && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div role="dialog" aria-modal="true" aria-labelledby="seat-layout-dialog-title" className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-6xl my-8 p-8 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button type="button" onClick={() => { setDetail(null); setDetailError(null); }} aria-label="Close layout builder" className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light">✕</button>
            <h2 id="seat-layout-dialog-title" className="font-heading font-bold text-[24px] text-ink-black mb-1">Build Seat Layout</h2>
            <p className="text-xs text-ink-gray-70 mb-5 border-b border-ink-gray-30 pb-3">Create and manage the layout using the same focused popup flow as adding a venue.</p>
            {detailLoading && !detail && <div className="py-8 flex justify-center" role="status" aria-label="Loading seat map request"><div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div></div>}
            {detailError && <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-16 p-4 text-[#FF3B3B] font-medium text-sm">{detailError}</div>}
            {detail && <SeatLayoutBuilder key={detail.request.id} detail={detail} initialSections={venueTemplate} onChanged={handleChanged} />}
          </div>
        </div>
      )}
    </div>
  );
};
