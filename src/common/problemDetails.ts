// Shared handling for backend errors. Services answer with ProblemDetails
// ({ title, detail, status, code? }) or, on older endpoints, { message }. Both are
// turned into one plain-English message that is safe to show to the user.

export interface ProblemDetailsBody {
  title?: string;
  detail?: string;
  message?: string;
  status?: number;
  code?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const STATUS_FALLBACKS: Record<number, string> = {
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do this.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
};

export async function toApiError(response: Response, fallback: string): Promise<ApiError> {
  let body: ProblemDetailsBody | null = null;
  try {
    body = (await response.json()) as ProblemDetailsBody;
  } catch {
    // Body wasn't JSON (or was empty) — use the fallbacks below.
  }

  const message = body?.detail || body?.message || STATUS_FALLBACKS[response.status] || fallback;
  return new ApiError(message, response.status, body?.code);
}