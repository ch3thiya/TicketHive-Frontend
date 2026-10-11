import { describe, it, expect, vi } from 'vitest';
import { buildCategoryRows, fetchShowSales, formatMoney, type ShowSales } from './salesApi';
import { ApiError } from './problemDetails';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const sales = (categories: ShowSales['categories'], overrides: Partial<ShowSales> = {}): ShowSales => ({
  showId: 's',
  currency: 'LKR',
  ticketsSold: categories.reduce((n, c) => n + c.sold, 0),
  revenue: categories.reduce((n, c) => n + c.revenue, 0),
  ticketsUsed: categories.reduce((n, c) => n + c.used, 0),
  categories,
  asOf: '2026-10-11T12:00:00Z',
  ...overrides,
});

describe('fetchShowSales', () => {
  it('reads the show\'s sales without caching', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json(sales([])));

    const result = await fetchShowSales(apiFetch, 'show-1');

    expect(apiFetch).toHaveBeenCalledWith('/api/booking/shows/show-1/sales', { cache: 'no-store' });
    expect(result.ticketsSold).toBe(0);
  });

  it.each([
    [403, { detail: 'You can only view sales for your own shows.' }, 'You can only view sales for your own shows.'],
    [503, {}, 'The service is temporarily unavailable. Please try again shortly.'],
    [409, { detail: 'This show has orders in more than one currency, so its sales cannot be totalled.', code: 'MixedCurrencies' }, 'more than one currency'],
  ])('turns a %i into a readable ApiError', async (status, body, message) => {
    const apiFetch = vi.fn().mockImplementation(async () => json(body, status));

    const error = await fetchShowSales(apiFetch, 's').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(status);
    expect(error.message).toContain(message);
  });
});

describe('buildCategoryRows', () => {
  const categories = [
    { id: 'vip', name: 'VIP', capacity: 50 },
    { id: 'gen', name: 'General', capacity: 200 },
  ];

  it('lists every category against its capacity, with zeros where nothing sold', () => {
    const rows = buildCategoryRows(categories, sales([{ categoryId: 'vip', sold: 12, revenue: 1440, used: 3 }]));

    expect(rows).toEqual([
      { key: 'vip', name: 'VIP', capacity: 50, sold: 12, revenue: 1440, used: 3 },
      { key: 'gen', name: 'General', capacity: 200, sold: 0, revenue: 0, used: 0 },
    ]);
  });

  it('keeps sales in a category the dashboard no longer lists', () => {
    const rows = buildCategoryRows(categories, sales([{ categoryId: 'old', sold: 4, revenue: 160, used: 0 }]));

    expect(rows.at(-1)).toEqual({ key: 'old', name: 'Other tickets', capacity: null, sold: 4, revenue: 160, used: 0 });
    expect(rows).toHaveLength(3);
  });

  it('gives categories without an id a stable key', () => {
    const rows = buildCategoryRows([{ name: 'Door', capacity: 10 }], sales([]));

    expect(rows[0].key).toBe('cat-0');
  });
});

describe('formatMoney', () => {
  it('shows the currency and two decimals', () => {
    expect(formatMoney(1440, 'LKR')).toMatch(/^LKR 1,?440\.00$/);
    expect(formatMoney(0, 'LKR')).toBe('LKR 0.00');
  });
});
