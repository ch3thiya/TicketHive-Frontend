import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHold, fetchHold, HoldApiError, type HoldRequest, type Hold } from './holdsApi';

const REQUEST: HoldRequest = { showId: 'show-1', items: [{ categoryId: 'cat-a', quantity: 2 }] };

const HOLD: Hold = {
  holdId: 'hold-1',
  showId: 'show-1',
  status: 'Active',
  expiresAt: '2026-01-01T00:05:00.000Z',
  items: [{ categoryId: 'cat-a', quantity: 2, unitPrice: 50, currency: 'LKR' }]
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createHold', () => {
  it('POSTs the request body to the holds endpoint with a v4 Idempotency-Key and returns the created hold', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(HOLD), { status: 201 }));

    const hold = await createHold(apiFetch, REQUEST);

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/inventory\/holds$/),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(REQUEST) })
    );
    const [, options] = apiFetch.mock.calls[0];
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Idempotency-Key']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(hold).toEqual(HOLD);
  });

  it('sends a fresh Idempotency-Key on each call — a new attempt is not a retry of the old one', async () => {
    // A fresh Response per call — a Response body can only be read once, and reusing
    // one object across both calls would fail on the second .json() for reasons
    // unrelated to what this test checks.
    const apiFetch = vi.fn((_url: string, _options?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify(HOLD), { status: 201 }))
    );

    await createHold(apiFetch, REQUEST);
    await createHold(apiFetch, REQUEST);

    const firstHeaders = (apiFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    const secondHeaders = (apiFetch.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(firstHeaders['Idempotency-Key']).not.toBe(secondHeaders['Idempotency-Key']);
  });

  it('throws a HoldApiError carrying status 409 and the ProblemDetails detail when the tickets are gone', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ title: 'Conflict', detail: 'Those tickets are no longer available.', status: 409 }),
        { status: 409 }
      )
    );

    const rejection = createHold(apiFetch, REQUEST);
    await expect(rejection).rejects.toBeInstanceOf(HoldApiError);
    await expect(rejection).rejects.toThrow('Those tickets are no longer available.');
    await expect(rejection).rejects.toMatchObject({ status: 409 });
  });

  it('throws a HoldApiError carrying status 422 and the per-customer limit message', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'You may hold at most 4 tickets for this show.' }), { status: 422 })
    );

    const rejection = createHold(apiFetch, REQUEST);
    await expect(rejection).rejects.toThrow('You may hold at most 4 tickets for this show.');
    await expect(rejection).rejects.toMatchObject({ status: 422 });
  });

  it('throws a HoldApiError carrying status 429 on a rate limit, even without a detail body', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));

    const rejection = createHold(apiFetch, REQUEST);
    await expect(rejection).rejects.toBeInstanceOf(HoldApiError);
    await expect(rejection).rejects.toMatchObject({ status: 429 });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response('not json', { status: 500 }));

    await expect(createHold(apiFetch, REQUEST)).rejects.toThrow('Failed to hold tickets.');
  });
});

describe('fetchHold', () => {
  it('requests the hold by id and returns the parsed body', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(HOLD), { status: 200 }));

    const hold = await fetchHold(apiFetch, 'hold-1');

    expect(apiFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/inventory\/holds\/hold-1$/));
    expect(hold).toEqual(HOLD);
  });

  it('throws a HoldApiError carrying status 404 when the hold belongs to someone else', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Hold not found.' }), { status: 404 })
    );

    const rejection = fetchHold(apiFetch, 'hold-1');
    await expect(rejection).rejects.toBeInstanceOf(HoldApiError);
    await expect(rejection).rejects.toThrow('Hold not found.');
    await expect(rejection).rejects.toMatchObject({ status: 404 });
  });
});
