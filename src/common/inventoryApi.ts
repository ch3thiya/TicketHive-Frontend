// Typed client for the inventory service's live availability endpoint. This endpoint is
// deliberately anonymous, so callers pass the browser's plain fetch, never apiFetch — the
// event page must work signed out.

export interface AvailabilityEntry {
  categoryId: string;
  capacity: number;
  available: number;
  unitPrice: number;
  currency: string;
}

interface AvailabilityResponse {
  showId: string;
  categories: AvailabilityEntry[];
}

// The backend returns ProblemDetails ({ title, detail, status }) for failures.
interface ProblemDetailsBody {
  detail?: string;
}

interface SimpleErrorBody {
  message?: string;
}

const INVENTORY_API_URL = import.meta.env.VITE_INVENTORY_API_URL || '';

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

// A 404 means the show has no stock recorded yet — distinct from a network or server
// failure so callers can treat it as "availability unknown" rather than an error.
export class AvailabilityNotFoundError extends Error {}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: ProblemDetailsBody & SimpleErrorBody = await response.json();
    if (data.detail) return data.detail;
    if (data.message) return data.message;
  } catch {
    // Body wasn't JSON (or was empty) — fall back below.
  }
  return fallback;
}

export async function fetchAvailability(showId: string, fetchFn: FetchFn = fetch): Promise<AvailabilityEntry[]> {
  const res = await fetchFn(`${INVENTORY_API_URL}/api/inventory/shows/${showId}/availability`);

  if (res.status === 404) {
    throw new AvailabilityNotFoundError('No availability recorded for this show.');
  }
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Failed to load availability.'));
  }

  const body: AvailabilityResponse = await res.json();
  return body.categories;
}
