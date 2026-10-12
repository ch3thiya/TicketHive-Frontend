import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventDetail } from './EventDetail';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    apiFetch: globalThis.fetch,
  }),
}));

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function event(seatingMode: 'Seated' | 'GA') {
  return {
    id: 'evt-1',
    organizerId: 'org-1',
    name: 'Arijit Singh Live',
    description: 'A great show.',
    category: 'CONCERT',
    eventDate: '2026-12-01',
    eventTime: '19:00',
    venue: 'Madison Square Garden',
    status: 'Published',
    createdAt: '2026-01-01T00:00:00Z',
    shows: [
      {
        id: 'show-1',
        eventId: 'evt-1',
        showDate: '2026-12-01',
        showTime: '19:00',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00Z',
        seatingMode,
        ticketCategories: [
          { id: 'vip', name: 'VIP', price: 120, capacity: 2 },
          { id: 'gen', name: 'General', price: 40, capacity: 2 },
        ],
      },
    ],
  };
}

const seat = (id: string, number: number, categoryId: string, state = 'Available') => ({ id, number, categoryId, state });

const SEAT_MAP = {
  showId: 'show-1',
  version: 1,
  categories: [
    { categoryId: 'vip', unitPrice: 120, currency: 'LKR' },
    { categoryId: 'gen', unitPrice: 40, currency: 'LKR' },
  ],
  sections: [
    { name: 'Front', rows: [{ label: 'A', seats: [seat('f1', 1, 'vip'), seat('f2', 2, 'vip')] }] },
    { name: 'Hall', rows: [{ label: 'A', seats: [seat('h1', 1, 'gen'), seat('h2', 2, 'gen')] }] },
  ],
};

interface Stub {
  mode?: 'Seated' | 'GA';
  hold?: (body: { showId: string; seatIds: string[] }) => Response;
  activeHold?: unknown;
}

function stubFetch({ mode = 'Seated', hold, activeHold }: Stub = {}) {
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (url.includes('/api/catalog/events/')) return Promise.resolve(json(event(mode)));
    if (url.endsWith('/seats/states')) return Promise.resolve(json({ showId: 'show-1', unavailable: [] }));
    if (url.endsWith('/seats')) return Promise.resolve(json(SEAT_MAP));
    if (url.includes('/availability')) return Promise.resolve(json({ showId: 'show-1', categories: [{ categoryId: 'vip', capacity: 2, available: 2, unitPrice: 120, currency: 'LKR' }] }));
    if (url.includes('/api/inventory/holds/active')) return Promise.resolve(activeHold ? json(activeHold) : json({ title: 'Not found' }, 404));
    if (url.includes('/api/waiting-room/')) return Promise.resolve(json({ title: 'Not found' }, 404));
    if (url.endsWith('/api/inventory/holds') && options?.method === 'POST') {
      const body = JSON.parse(String(options.body));
      return Promise.resolve(
        hold
          ? hold(body)
          : json({ holdId: 'hold-7', showId: 'show-1', status: 'Active', expiresAt: new Date(Date.now() + 600000).toISOString(), items: [], seats: [] }, 201),
      );
    }
    return Promise.reject(new Error(`unexpected fetch url: ${url}`));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const holdCalls = (fetchMock: ReturnType<typeof stubFetch>) =>
  fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/api/inventory/holds') && (options as RequestInit | undefined)?.method === 'POST');

describe('EventDetail on a seated show', () => {
  it('shows the seat map instead of the ticket quantity picker', async () => {
    stubFetch();

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Front row A seat 1, VIP, \$120, available/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /buy now/i })).not.toBeInTheDocument();
  });

  it('holds exactly the chosen seats and opens the hold confirmation with their names', async () => {
    const fetchMock = stubFetch();
    const user = userEvent.setup();
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Front row A seat 2/ }));
    await user.click(screen.getByRole('button', { name: /Hall row A seat 1/ }));
    await user.click(screen.getByRole('button', { name: 'Hold 2 seats' }));

    expect(await screen.findByText('Ticket Hold Confirmed!')).toBeInTheDocument();
    expect(screen.getByText('Front A2, Hall A1 × 2')).toBeInTheDocument();
    expect(screen.getByText('Rs. 160.00 LKR')).toBeInTheDocument();
    const [calls] = [holdCalls(fetchMock)];
    expect(calls).toHaveLength(1);
    const init = calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ showId: 'show-1', seatIds: ['f2', 'h1'] });
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toMatch(/^seat-/);
  });

  it('tells the customer which seat was taken and holds nothing', async () => {
    stubFetch({
      hold: () =>
        json(
          {
            detail: 'Front A2 is no longer available. No seats were held; choose again.',
            code: 'SeatsUnavailable',
            unavailableSeats: [{ seatId: 'f2', categoryId: 'vip', section: 'Front', row: 'A', number: 2 }],
          },
          409,
        ),
    });
    const user = userEvent.setup();
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Front row A seat 2/ }));
    await user.click(screen.getByRole('button', { name: 'Hold 1 seat' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Front A2 is no longer available. No seats were held; choose again.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the waiting room when admission is required and holds the same seats once admitted', async () => {
    const fetchMock = stubFetch({ hold: () => json({ title: 'Admission required' }, 403) });
    const user = userEvent.setup();
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Hall row A seat 2/ }));
    await user.click(screen.getByRole('button', { name: 'Hold 1 seat' }));

    await vi.waitFor(() => expect(holdCalls(fetchMock)).toHaveLength(1));
    // The queue pop-up opens; the seats stay chosen for the retry.
    expect(await screen.findByText(/in the queue/i)).toBeInTheDocument();
  });

  it('restores a seated hold after a reload with the seat names', async () => {
    stubFetch({
      activeHold: {
        holdId: 'hold-9',
        showId: 'show-1',
        status: 'Active',
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        items: [{ categoryId: 'vip', quantity: 2, unitPrice: 120, currency: 'LKR' }],
        seats: [
          { seatId: 'f1', categoryId: 'vip', section: 'Front', row: 'A', number: 1 },
          { seatId: 'f2', categoryId: 'vip', section: 'Front', row: 'A', number: 2 },
        ],
      },
    });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByText('Front A1, Front A2 × 2')).toBeInTheDocument();
    expect(screen.getByText('Rs. 240.00 LKR')).toBeInTheDocument();
  });
});

describe('EventDetail on a general admission show', () => {
  it('keeps the ticket picker and Buy Now, with no seat map', async () => {
    const fetchMock = stubFetch({ mode: 'GA' });
    const user = userEvent.setup();
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    const buy = await screen.findByRole('button', { name: /buy now/i });
    await user.click(buy);

    expect(screen.queryByRole('group', { name: 'Seat map' })).not.toBeInTheDocument();
    const calls = holdCalls(fetchMock);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String((calls[0][1] as RequestInit).body))).toEqual({ showId: 'show-1', items: [{ categoryId: 'vip', quantity: 1 }] });
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/seats'))).toBe(false);
  });
});
