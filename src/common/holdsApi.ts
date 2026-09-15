// Typed client for the inventory service's holds endpoints. Unlike availability, these
// require authentication, so every call takes the authenticated apiFetch from useAuth().

export interface HoldItemRequest {
  categoryId: string;
  quantity: number;
}

export interface HoldRequest {
  showId: string;
  items: HoldItemRequest[];
}

export interface HoldItem {
  categoryId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface Hold {
  holdId: string;
  showId: string;
  status: string;
  expiresAt: string;
  items: HoldItem[];
}

// The backend returns ProblemDetails ({ title, detail, status }) for 409/422, and
// { message } for other failures.
interface ProblemDetailsBody {
  detail?: string;
}

interface SimpleErrorBody {
  message?: string;
}

const INVENTORY_API_URL = import.meta.env.VITE_INVENTORY_API_URL || '';

type ApiFetch = (url: string, options?: RequestInit) => Promise<Response>;

// Carries the HTTP status so callers can tell a sold-out conflict (409) from a
// per-customer limit (422) from a rate limit (429) apart and show each its own message.
export class HoldApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HoldApiError';
    this.status = status;
  }
}

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

// A fresh Idempotency-Key per call — a customer pressing "Buy Now" again after a
// failed attempt is a new attempt, not a retry of the same request, so it gets a new key.
export async function createHold(apiFetch: ApiFetch, request: HoldRequest): Promise<Hold> {
  const res = await apiFetch(`${INVENTORY_API_URL}/api/inventory/holds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify(request)
  });

  if (!res.ok) {
    throw new HoldApiError(await extractErrorMessage(res, 'Failed to hold tickets.'), res.status);
  }
  return res.json();
}

export async function fetchHold(apiFetch: ApiFetch, holdId: string): Promise<Hold> {
  const res = await apiFetch(`${INVENTORY_API_URL}/api/inventory/holds/${holdId}`);

  if (!res.ok) {
    throw new HoldApiError(await extractErrorMessage(res, 'Failed to load hold.'), res.status);
  }
  return res.json();
}
