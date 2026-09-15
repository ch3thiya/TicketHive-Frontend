import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchVenues, createVenue, updateVenue, deleteVenue, type Venue } from './venueApi';

const VENUE: Venue = {
  id: 'v1',
  name: 'Madison Square Garden',
  address: 'New York, NY',
  capacity: 20789,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchVenues', () => {
  it('requests the venues list and returns the parsed body', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([VENUE]), { status: 200 }));

    const venues = await fetchVenues(apiFetch);

    expect(apiFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/catalog\/venues$/));
    expect(venues).toEqual([VENUE]);
  });

  it('throws the ProblemDetails detail on a non-ok response', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ title: 'Server Error', detail: 'The catalog service is unavailable.', status: 500 }), {
        status: 500
      })
    );

    await expect(fetchVenues(apiFetch)).rejects.toThrow('The catalog service is unavailable.');
  });

  it('throws the { message } body on a non-ok response', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized.' }), { status: 401 })
    );

    await expect(fetchVenues(apiFetch)).rejects.toThrow('Unauthorized.');
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response('not json', { status: 500 }));

    await expect(fetchVenues(apiFetch)).rejects.toThrow('Failed to load venues.');
  });
});

describe('createVenue', () => {
  it('POSTs the venue input as JSON and returns the created venue', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(VENUE), { status: 201 }));
    const input = { name: 'Madison Square Garden', address: 'New York, NY', capacity: 20789 };

    const created = await createVenue(apiFetch, input);

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/catalog\/venues$/),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
    );
    expect(created).toEqual(VENUE);
  });

  it('surfaces the { message } validation error from a 400 response', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Name is required.' }), { status: 400 })
    );

    await expect(
      createVenue(apiFetch, { name: '', address: '', capacity: 0 })
    ).rejects.toThrow('Name is required.');
  });
});

describe('updateVenue', () => {
  it('PUTs to the venue-specific URL with the input body', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(VENUE), { status: 200 }));
    const input = { name: 'Updated Name', address: 'Updated Address', capacity: 100 };

    const updated = await updateVenue(apiFetch, 'v1', input);

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/catalog\/venues\/v1$/),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(input) })
    );
    expect(updated).toEqual(VENUE);
  });

  it('throws the ProblemDetails detail on failure', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Venue not found.' }), { status: 404 })
    );

    await expect(
      updateVenue(apiFetch, 'missing', { name: 'x', address: 'y', capacity: 1 })
    ).rejects.toThrow('Venue not found.');
  });
});

describe('deleteVenue', () => {
  it('DELETEs the venue-specific URL and resolves with no value', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteVenue(apiFetch, 'v1')).resolves.toBeUndefined();

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/catalog\/venues\/v1$/),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('throws the server\'s ProblemDetails message when the venue is in use (409)', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ title: 'Conflict', detail: '3 shows still use this venue.', status: 409 }),
        { status: 409 }
      )
    );

    await expect(deleteVenue(apiFetch, 'v1')).rejects.toThrow('3 shows still use this venue.');
  });
});
