// Typed client for the catalog service's venue endpoints. Shared by the admin
// dashboard (full CRUD) and the organizer dashboard (read-only, for the venue picker).

export interface Venue {
  id: string;
  name: string;
  address: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface VenueInput {
  name: string;
  address: string;
  capacity: number;
}

// The backend returns ProblemDetails ({ title, detail, status }) for 409s and
// { message } for 400/404s. Normalize both into a single plain-English string.
interface ProblemDetailsBody {
  detail?: string;
}

interface SimpleErrorBody {
  message?: string;
}

const CATALOG_API_URL = import.meta.env.VITE_CATALOG_API_URL || '';

type ApiFetch = (url: string, options?: RequestInit) => Promise<Response>;

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

export async function fetchVenues(apiFetch: ApiFetch): Promise<Venue[]> {
  const res = await apiFetch(`${CATALOG_API_URL}/api/catalog/venues`);
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Failed to load venues.'));
  }
  return res.json();
}

export async function createVenue(apiFetch: ApiFetch, input: VenueInput): Promise<Venue> {
  const res = await apiFetch(`${CATALOG_API_URL}/api/catalog/venues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Failed to create venue.'));
  }
  return res.json();
}

export async function updateVenue(apiFetch: ApiFetch, id: string, input: VenueInput): Promise<Venue> {
  const res = await apiFetch(`${CATALOG_API_URL}/api/catalog/venues/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Failed to update venue.'));
  }
  return res.json();
}

export async function deleteVenue(apiFetch: ApiFetch, id: string): Promise<void> {
  const res = await apiFetch(`${CATALOG_API_URL}/api/catalog/venues/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Failed to delete venue.'));
  }
}
