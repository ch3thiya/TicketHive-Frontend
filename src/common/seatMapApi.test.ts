import { describe, it, expect, vi } from 'vitest';
import {
  createSeatLayoutDraft,
  enableSeatLayout,
  fetchAdminSeatMapRequests,
  fetchSeatMapRequests,
  rejectSeatMapRequest,
  requestSeatMap,
  rowLabel,
  sectionSeatCount,
  summarizeLayout,
  type SeatMapCategory,
} from './seatMapApi';
import { ApiError } from './problemDetails';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('seat map requests (organizer)', () => {
  it('loads the requests for a show', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json([{ id: 'r1', status: 'Pending' }]));

    const requests = await fetchSeatMapRequests(apiFetch, 'show-1');

    expect(apiFetch).toHaveBeenCalledWith('/api/catalog/shows/show-1/seat-map-requests');
    expect(requests[0].status).toBe('Pending');
  });

  it('posts the description', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ id: 'r1', status: 'Pending' }, 201));

    await requestSeatMap(apiFetch, 'show-1', 'Stalls and a balcony');

    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe('/api/catalog/shows/show-1/seat-map-requests');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ description: 'Stalls and a balcony' });
  });

  it('turns a conflict into an ApiError with the machine-readable code', async () => {
    const apiFetch = vi.fn().mockImplementation(async () => json({ detail: 'A seat map request for this show is already pending.', code: 'RequestPending' }, 409));

    await expect(requestSeatMap(apiFetch, "show-1", "x")).rejects.toMatchObject({ status: 409, code: 'RequestPending' });
    await expect(requestSeatMap(apiFetch, 'show-1', 'x')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('seat map administration', () => {
  it('filters the list by status', async () => {
    const apiFetch = vi.fn().mockImplementation(async () => json([]));

    await fetchAdminSeatMapRequests(apiFetch, 'Pending');
    await fetchAdminSeatMapRequests(apiFetch);

    expect(apiFetch.mock.calls[0][0]).toBe('/api/catalog/admin/seat-map-requests?status=Pending');
    expect(apiFetch.mock.calls[1][0]).toBe('/api/catalog/admin/seat-map-requests');
  });

  it('saves a draft with the sections as sent', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ id: 'l1', version: 1 }, 201));
    const sections = [{ name: 'Front', categoryId: 'c1', rows: 2, seatsPerRow: 3 }];

    await createSeatLayoutDraft(apiFetch, 'req-1', sections);

    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe('/api/catalog/admin/seat-map-requests/req-1/layouts');
    expect(JSON.parse(init.body)).toEqual({ sections });
  });

  it('surfaces every validation reason of a refused layout', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      json({ detail: 'The layout is not valid.', errors: [{ code: 'UnassignedSection', message: 'Section Front has no ticket category assigned.' }] }, 422),
    );

    const error = await createSeatLayoutDraft(apiFetch, 'req-1', []).catch((e) => e);

    expect(error.status).toBe(422);
    expect(error.details[0].message).toMatch(/no ticket category/i);
  });

  it('enables and rejects through their endpoints', async () => {
    const apiFetch = vi.fn().mockImplementation(async () => json({}));

    await enableSeatLayout(apiFetch, 'l1');
    await rejectSeatMapRequest(apiFetch, 'req-1', 'Venue plan missing');

    expect(apiFetch.mock.calls[0][0]).toBe('/api/catalog/admin/seat-layouts/l1/enable');
    expect(apiFetch.mock.calls[0][1].method).toBe('POST');
    expect(apiFetch.mock.calls[1][0]).toBe('/api/catalog/admin/seat-map-requests/req-1/reject');
    expect(JSON.parse(apiFetch.mock.calls[1][1].body)).toEqual({ reason: 'Venue plan missing' });
  });
});

describe('live layout feedback', () => {
  const categories: SeatMapCategory[] = [
    { id: 'vip', name: 'VIP', price: 100, capacity: 6 },
    { id: 'gen', name: 'General', price: 40, capacity: 12 },
  ];

  it('counts seats per section and ignores nonsense dimensions', () => {
    expect(sectionSeatCount({ rows: 3, seatsPerRow: 4 })).toBe(12);
    expect(sectionSeatCount({ rows: NaN, seatsPerRow: 4 })).toBe(0);
    expect(sectionSeatCount({ rows: -2, seatsPerRow: 4 })).toBe(0);
  });

  it('accepts a layout whose seats equal every category capacity', () => {
    const summary = summarizeLayout(
      [
        { name: 'Front', categoryId: 'vip', rows: 2, seatsPerRow: 3 },
        { name: 'Hall', categoryId: 'gen', rows: 3, seatsPerRow: 4 },
      ],
      categories,
    );

    expect(summary.matches).toBe(true);
    expect(summary.totalSeats).toBe(18);
    expect(summary.ticketTotal).toBe(18);
  });

  it('flags a category with too many seats, even when the total matches', () => {
    const summary = summarizeLayout(
      [
        { name: 'Front', categoryId: 'vip', rows: 3, seatsPerRow: 3 },
        { name: 'Hall', categoryId: 'gen', rows: 3, seatsPerRow: 3 },
      ],
      categories,
    );

    expect(summary.totalSeats).toBe(18);
    expect(summary.matches).toBe(false);
    expect(summary.categories.find((c) => c.categoryId === 'vip')).toMatchObject({ mapped: 9, capacity: 6, matches: false });
  });

  it('flags unassigned sections, duplicate names and an empty layout', () => {
    expect(summarizeLayout([{ name: 'Front', categoryId: '', rows: 1, seatsPerRow: 1 }], categories).hasUnassignedSection).toBe(true);
    expect(
      summarizeLayout(
        [
          { name: 'Front', categoryId: 'vip', rows: 1, seatsPerRow: 6 },
          { name: ' front ', categoryId: 'gen', rows: 1, seatsPerRow: 12 },
        ],
        categories,
      ).hasDuplicateName,
    ).toBe(true);
    expect(summarizeLayout([], categories).matches).toBe(false);
  });

  it('labels rows A to Z then AA, AB like the backend', () => {
    expect([0, 1, 25, 26, 27, 51, 52, 701, 702].map(rowLabel)).toEqual(['A', 'B', 'Z', 'AA', 'AB', 'AZ', 'BA', 'ZZ', 'AAA']);
  });
});
