import { describe, it, expect } from 'vitest';
import { ApiError, toApiError } from './problemDetails';

function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('toApiError', () => {
  it('uses the ProblemDetails detail, the HTTP status and the machine-readable code', async () => {
    const error = await toApiError(response(403, { title: 'Organizer suspended', detail: 'This account is suspended.', code: 'OrganizerSuspended' }), 'fallback');

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('This account is suspended.');
    expect(error.status).toBe(403);
    expect(error.code).toBe('OrganizerSuspended');
  });

  it('falls back to the legacy { message } shape', async () => {
    const error = await toApiError(response(404, { message: 'Organizer not found.' }), 'fallback');

    expect(error.message).toBe('Organizer not found.');
  });

  it('gives 401 and 403 responses without a body a plain-English message', async () => {
    expect((await toApiError(response(401), 'fallback')).message).toMatch(/sign in again/i);
    expect((await toApiError(response(403), 'fallback')).message).toMatch(/do not have permission/i);
  });

  it('uses the caller fallback for other failures with no usable body', async () => {
    const error = await toApiError(new Response('<html>oops</html>', { status: 500 }), 'Something failed.');

    expect(error.message).toBe('Something failed.');
    expect(error.status).toBe(500);
  });

  it('prefers the server detail over the generic 503 wording', async () => {
    const error = await toApiError(response(503, { detail: 'Identity is down.' }), 'fallback');

    expect(error.message).toBe('Identity is down.');
  });
});