import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchAvailability, AvailabilityNotFoundError, type AvailabilityEntry } from './inventoryApi';

const ENTRIES: AvailabilityEntry[] = [
  { categoryId: 'cat-1', capacity: 1500, available: 1240, unitPrice: 85, currency: 'LKR' },
  { categoryId: 'cat-2', capacity: 100, available: 0, unitPrice: 180, currency: 'LKR' }
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchAvailability', () => {
  it('requests the show availability endpoint and returns the parsed body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify(ENTRIES), { status: 200 }));

    const result = await fetchAvailability('show-1', fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(expect.stringMatching(/\/api\/inventory\/shows\/show-1\/availability$/));
    expect(result).toEqual(ENTRIES);
  });

  it('throws an AvailabilityNotFoundError on a 404, distinct from other failures', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

    await expect(fetchAvailability('show-1', fetchFn)).rejects.toBeInstanceOf(AvailabilityNotFoundError);
  });

  it('throws a plain Error (not AvailabilityNotFoundError) with the ProblemDetails detail on a server error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ title: 'Server Error', detail: 'The inventory service is unavailable.', status: 500 }), {
        status: 500
      })
    );

    const rejection = fetchAvailability('show-1', fetchFn);
    await expect(rejection).rejects.toThrow('The inventory service is unavailable.');
    await expect(rejection).rejects.not.toBeInstanceOf(AvailabilityNotFoundError);
  });

  it('throws the { message } body on a non-ok response', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Bad request.' }), { status: 400 }));

    await expect(fetchAvailability('show-1', fetchFn)).rejects.toThrow('Bad request.');
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('not json', { status: 500 }));

    await expect(fetchAvailability('show-1', fetchFn)).rejects.toThrow('Failed to load availability.');
  });

  it('propagates a network failure as a plain Error', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const rejection = fetchAvailability('show-1', fetchFn);
    await expect(rejection).rejects.toThrow('Failed to fetch');
    await expect(rejection).rejects.not.toBeInstanceOf(AvailabilityNotFoundError);
  });
});
