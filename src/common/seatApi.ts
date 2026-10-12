import { GATEWAY_URL } from '../config';

// Typed client for Inventory's seat map: the public (anonymous, uncached) seat structure and live
// seat states, plus creating a hold for specific seats. The public calls take the browser's plain
// fetch, like availability, so the event page works signed out.

export type SeatState = 'Available' | 'Held' | 'Sold';

export interface SeatMapSeat {
  id: string;
  number: number;
  categoryId: string;
  state: SeatState;
}

export interface SeatMapRow {
  label: string;
  seats: SeatMapSeat[];
}

export interface SeatMapSection {
  name: string;
  rows: SeatMapRow[];
}

export interface SeatMapCategory {
  categoryId: string;
  unitPrice: number;
  currency: string;
}

export interface SeatMapData {
  showId: string;
  version: number;
  categories: SeatMapCategory[];
  sections: SeatMapSection[];
}

export interface UnavailableSeat {
  id: string;
  state: SeatState;
}

export interface SeatRef {
  seatId: string;
  categoryId: string;
  section: string;
  row: string;
  number: number;
}

export interface SeatHold {
  holdId: string;
  showId: string;
  status: string;
  expiresAt: string;
  items: { categoryId: string; quantity: number; unitPrice: number; currency: string }[];
  seats: SeatRef[];
}

export type SeatHoldOutcome =
  | { kind: 'created'; hold: SeatHold }
  | { kind: 'seats-unavailable'; seats: SeatRef[]; message: string }
  | { kind: 'admission-required' }
  | { kind: 'sales-unavailable' }
  | { kind: 'failed'; message: string };

const INVENTORY_API_URL = import.meta.env.VITE_INVENTORY_API_URL || '';

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

// A 404 means the show has no seat map: it is general admission, or the map is not enabled yet.
export class SeatMapNotFoundError extends Error {}

export async function fetchSeatMap(showId: string, fetchFn: FetchFn = fetch): Promise<SeatMapData> {
  const res = await fetchFn(`${INVENTORY_API_URL}/api/inventory/shows/${showId}/seats`, { cache: 'no-store' });
  if (res.status === 404) throw new SeatMapNotFoundError('This show has no seat map.');
  if (!res.ok) throw new Error('Failed to load the seat map.');
  return (await res.json()) as SeatMapData;
}

// Only the seats that are not available, so a poll stays small while a show is mostly open.
export async function fetchSeatStates(showId: string, fetchFn: FetchFn = fetch): Promise<UnavailableSeat[]> {
  const res = await fetchFn(`${INVENTORY_API_URL}/api/inventory/shows/${showId}/seats/states`, { cache: 'no-store' });
  if (res.status === 404) throw new SeatMapNotFoundError('This show has no seat map.');
  if (!res.ok) throw new Error('Failed to refresh the seat map.');
  const body = (await res.json()) as { unavailable: UnavailableSeat[] };
  return body.unavailable;
}

export function seatLabel(seat: Pick<SeatRef, 'section' | 'row' | 'number'>): string {
  return `${seat.section} ${seat.row}${seat.number}`;
}

interface HoldProblem {
  detail?: string;
  title?: string;
  code?: string;
  unavailableSeats?: SeatRef[];
}

export async function createSeatHold(
  apiFetch: FetchFn,
  showId: string,
  seatIds: string[],
  admissionToken?: string | null,
): Promise<SeatHoldOutcome> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Idempotency-Key': `seat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
  if (admissionToken) headers['Admission-Token'] = admissionToken;

  let res: Response;
  try {
    res = await apiFetch(`${GATEWAY_URL}/api/inventory/holds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ showId, seatIds }),
    });
  } catch {
    return { kind: 'failed', message: 'Network error while holding your seats. Please try again.' };
  }

  if (res.status === 201 || res.status === 200) {
    return { kind: 'created', hold: (await res.json()) as SeatHold };
  }

  const problem: HoldProblem | null = await res.json().catch(() => null);

  if (res.status === 403) return { kind: 'admission-required' };
  if (res.status === 409 && problem?.code === 'SeatsUnavailable') {
    return {
      kind: 'seats-unavailable',
      seats: problem.unavailableSeats ?? [],
      message: problem.detail ?? 'A selected seat is no longer available. No seats were held; choose again.',
    };
  }
  if (res.status === 409 && problem?.title === 'Sales unavailable') return { kind: 'sales-unavailable' };
  if (res.status === 401) return { kind: 'failed', message: 'Your session has expired. Please sign in again.' };
  if (res.status === 503) return { kind: 'failed', message: 'Ticket sales could not be verified right now. Please try again shortly.' };

  return { kind: 'failed', message: problem?.detail || problem?.title || 'Unable to hold these seats.' };
}
