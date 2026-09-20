// Typed client for the waiting room service. Following inventoryApi.ts, the base URL comes
// from VITE_WAITING_ROOM_API_URL directly rather than the Vite dev proxy — the proxy in
// vite.config.ts only covers catalog/identity/inventory, and inventoryApi.ts's own pattern
// (an explicit env-backed URL) is what this brief asked new clients to follow.

export type QueuePositionStatus = 'NotInQueue' | 'Waiting' | 'Admitted' | 'SoldOut';

// POST .../entries response. QueueNumber is null while the entry sits in the pre-queue,
// before the on-sale transition hands out numbers.
export interface QueueEntry {
  showId: string;
  queueNumber: number | null;
  joinedAt: string;
}

// GET .../entries/me response. Fields are populated by status:
// - NotInQueue: everything else null.
// - Waiting, no number yet: onSaleAt set, position null.
// - Waiting, with a number: position set (counts down), onSaleAt null.
// - Admitted: admissionToken and admissionExpiresAt set.
// - SoldOut: everything else null.
export interface QueuePosition {
  status: QueuePositionStatus;
  position: number | null;
  onSaleAt: string | null;
  admissionToken: string | null;
  admissionExpiresAt: string | null;
}

// The backend returns ProblemDetails ({ title, detail, status }) for failures.
interface ProblemDetailsBody {
  detail?: string;
}

const WAITING_ROOM_API_URL = import.meta.env.VITE_WAITING_ROOM_API_URL || '';

type ApiFetch = (url: string, options?: RequestInit) => Promise<Response>;

// A 404 on join means this show has no queue open right now — either it isn't a
// high-demand show, or its pre-queue window hasn't opened yet. Both are normal states
// for a caller to handle, not failures.
export class QueueNotFoundError extends Error {}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: ProblemDetailsBody = await response.json();
    if (data.detail) return data.detail;
  } catch {
    // Body wasn't JSON (or was empty) — fall back below.
  }
  return fallback;
}

// Joins the show's queue. Calling again for the same show and customer is harmless and
// returns the existing entry, so a double click, a refresh or a second tab never errors.
export async function joinQueue(showId: string, apiFetch: ApiFetch): Promise<QueueEntry> {
  const res = await apiFetch(`${WAITING_ROOM_API_URL}/api/waiting-room/queues/${showId}/entries`, {
    method: 'POST',
  });

  if (res.status === 404) {
    throw new QueueNotFoundError('This show has no waiting room queue open right now.');
  }
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Unable to join the queue.'));
  }
  return res.json();
}

// Reads the signed-in customer's current standing for the show. This never 404s — a
// customer who hasn't joined (or a show with no queue at all) comes back as NotInQueue.
export async function fetchQueueStatus(showId: string, apiFetch: ApiFetch): Promise<QueuePosition> {
  const res = await apiFetch(`${WAITING_ROOM_API_URL}/api/waiting-room/queues/${showId}/entries/me`);

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Unable to check your place in the queue.'));
  }
  return res.json();
}
