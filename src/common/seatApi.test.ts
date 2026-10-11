import { describe, it, expect, vi } from 'vitest';
import { createSeatHold, fetchSeatMap, fetchSeatStates, seatLabel, SeatMapNotFoundError } from './seatApi';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('seat map reads', () => {
  it('loads the map without caching it', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({ showId: 's', version: 1, categories: [], sections: [] }));

    const map = await fetchSeatMap('show-1', fetchFn);

    expect(fetchFn).toHaveBeenCalledWith('/api/inventory/shows/show-1/seats', { cache: 'no-store' });
    expect(map.version).toBe(1);
  });

  it('treats a 404 as "no seat map", not a failure', async () => {
    const fetchFn = vi.fn().mockImplementation(async () => json({ detail: 'x' }, 404));

    await expect(fetchSeatMap('s', fetchFn)).rejects.toBeInstanceOf(SeatMapNotFoundError);
    await expect(fetchSeatStates('s', fetchFn)).rejects.toBeInstanceOf(SeatMapNotFoundError);
  });

  it('fails readably on server errors', async () => {
    const fetchFn = vi.fn().mockImplementation(async () => new Response('', { status: 500 }));

    await expect(fetchSeatMap('s', fetchFn)).rejects.toThrow(/seat map/i);
    await expect(fetchSeatStates('s', fetchFn)).rejects.toThrow(/refresh/i);
  });

  it('reads only the unavailable seats when polling', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({ showId: 's', unavailable: [{ id: 'a', state: 'Held' }] }));

    expect(await fetchSeatStates('s', fetchFn)).toEqual([{ id: 'a', state: 'Held' }]);
    expect(fetchFn.mock.calls[0][0]).toBe('/api/inventory/shows/s/seats/states');
  });
});

describe('createSeatHold', () => {
  const hold = { holdId: 'h1', showId: 's', status: 'Active', expiresAt: '2026-10-11T10:10:00Z', items: [], seats: [] };

  it('posts the seat ids with an idempotency key and the admission token', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json(hold, 201));

    const outcome = await createSeatHold(apiFetch, 's', ['a', 'b'], 'token-1');

    expect(outcome).toEqual({ kind: 'created', hold });
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe('/api/inventory/holds');
    expect(JSON.parse(init.body)).toEqual({ showId: 's', seatIds: ['a', 'b'] });
    expect(init.headers['Idempotency-Key']).toMatch(/^seat-/);
    expect(init.headers['Admission-Token']).toBe('token-1');
  });

  it('omits the admission token when there is none', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json(hold, 201));

    await createSeatHold(apiFetch, 's', ['a']);

    expect(apiFetch.mock.calls[0][1].headers['Admission-Token']).toBeUndefined();
  });

  it('names the unavailable seats when a selection is refused', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      json(
        {
          detail: 'Hall B4 is no longer available. No seats were held; choose again.',
          code: 'SeatsUnavailable',
          unavailableSeats: [{ seatId: 'x', categoryId: 'c', section: 'Hall', row: 'B', number: 4 }],
        },
        409,
      ),
    );

    const outcome = await createSeatHold(apiFetch, 's', ['a', 'x']);

    expect(outcome.kind).toBe('seats-unavailable');
    if (outcome.kind === 'seats-unavailable') {
      expect(outcome.seats.map(seatLabel)).toEqual(['Hall B4']);
      expect(outcome.message).toMatch(/no longer available/i);
    }
  });

  it.each([
    [403, {}, 'admission-required'],
    [409, { title: 'Sales unavailable' }, 'sales-unavailable'],
  ])('maps %i to %s', async (status, body, kind) => {
    const apiFetch = vi.fn().mockResolvedValue(json(body, status));

    expect((await createSeatHold(apiFetch, 's', ['a'])).kind).toBe(kind);
  });

  it('explains the other failures in plain words', async () => {
    const quota = vi.fn().mockResolvedValue(json({ detail: 'This request would exceed the per-customer limit of 6 tickets for this show.' }, 422));
    const expired = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    const down = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
    const offline = vi.fn().mockRejectedValue(new Error('offline'));

    expect(await createSeatHold(quota, 's', ['a'])).toEqual({ kind: 'failed', message: 'This request would exceed the per-customer limit of 6 tickets for this show.' });
    expect(await createSeatHold(expired, 's', ['a'])).toMatchObject({ kind: 'failed', message: expect.stringMatching(/sign in/i) });
    expect(await createSeatHold(down, 's', ['a'])).toMatchObject({ kind: 'failed', message: expect.stringMatching(/try again/i) });
    expect(await createSeatHold(offline, 's', ['a'])).toMatchObject({ kind: 'failed', message: expect.stringMatching(/network/i) });
  });
});
