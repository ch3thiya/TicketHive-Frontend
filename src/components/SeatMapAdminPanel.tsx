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
} from '../common/seatMapApi';

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
        setDetail(await fetchSeatMapDetail(apiFetch, requestId));
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

  if (detail || detailLoading || detailError) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => {
            setDetail(null);
            setDetailError(null);
          }}
          className="self-start font-body font-bold text-[14px] text-brand-blue cursor-pointer"
        >
          ← Back to seat map requests
        </button>
        {detailLoading && !detail && (
          <div className="py-8 flex justify-center" role="status" aria-label="Loading seat map request">
            <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {detailError && (
          <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-16 p-4 text-[#FF3B3B] font-medium text-sm">
            {detailError}
          </div>
        )}
        {detail && <SeatLayoutBuilder key={detail.request.id} detail={detail} onChanged={handleChanged} />}
      </div>
    );
  }

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
                className="shrink-0 font-body font-bold text-[14px] text-brand-white bg-brand-blue border-2.5 border-ink-black rounded-full px-5 py-2 hover:bg-[#1a1a5b] cursor-pointer"
              >
                {request.status === 'Pending' ? 'Build layout' : 'View'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
