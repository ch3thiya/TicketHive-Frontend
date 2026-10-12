import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventDetail } from './EventDetail';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, login: vi.fn(), apiFetch: globalThis.fetch }),
}));

// The queue itself is covered elsewhere; here it only admits the customer on demand.
vi.mock('../popUps/WaitingRoomPopUp', () => ({
  WaitingRoomPopUp: ({ isOpen, onAdmitted }: { isOpen: boolean; onAdmitted: (token: string) => void }) =>
    isOpen ? <button onClick={() => onAdmitted('admission-token-1')}>Admit me</button> : null,
}));

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const seat = (id: string, number: number) => ({ id, number, categoryId: 'vip', state: 'Available' });

function stubFetch(holdResponses: Response[]) {
  const queue = [...holdResponses];
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (url.includes('/api/catalog/events/')) {
      return Promise.resolve(json({
        id: 'evt-1', organizerId: 'o', name: 'Arijit Singh Live', description: '', category: 'CONCERT', status: 'Published', createdAt: '2026-01-01T00:00:00Z',
        shows: [{ id: 'show-1', eventId: 'evt-1', showDate: '2026-12-01', showTime: '19:00', status: 'Active', createdAt: '2026-01-01T00:00:00Z', seatingMode: 'Seated', ticketCategories: [{ id: 'vip', name: 'VIP', price: 120, capacity: 2 }] }],
      }));
    }
    if (url.endsWith('/seats/states')) return Promise.resolve(json({ unavailable: [] }));
    if (url.endsWith('/seats')) return Promise.resolve(json({ showId: 'show-1', version: 1, categories: [{ categoryId: 'vip', unitPrice: 120, currency: 'LKR' }], sections: [{ name: 'Front', rows: [{ label: 'A', seats: [seat('f1', 1), seat('f2', 2)] }] }] }));
    if (url.includes('/availability')) return Promise.resolve(json({ showId: 'show-1', categories: [] }));
    if (url.includes('/api/inventory/holds/active')) return Promise.resolve(json({ title: 'Not found' }, 404));
    if (url.includes('/api/waiting-room/')) return Promise.resolve(json({ title: 'Not found' }, 404));
    if (url.endsWith('/api/inventory/holds') && options?.method === 'POST') return Promise.resolve(queue.shift() ?? json({}, 500));
    return Promise.reject(new Error(`unexpected fetch url: ${url}`));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const holdCalls = (fetchMock: ReturnType<typeof stubFetch>) =>
  fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/api/inventory/holds') && (options as RequestInit | undefined)?.method === 'POST');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const created = () => json({ holdId: 'hold-1', showId: 'show-1', status: 'Active', expiresAt: new Date(Date.now() + 600000).toISOString(), items: [], seats: [] }, 201);

describe('EventDetail seat holds through the waiting room', () => {
  it('holds the same seats with the admission token once the customer is admitted', async () => {
    const fetchMock = stubFetch([json({ title: 'Admission required' }, 403), created()]);
    const user = userEvent.setup();
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Front row A seat 1/ }));
    await user.click(screen.getByRole('button', { name: /Front row A seat 2/ }));
    await user.click(screen.getByRole('button', { name: 'Hold 2 seats' }));
    await user.click(await screen.findByRole('button', { name: 'Admit me' }));

    expect(await screen.findByText('Ticket Hold Confirmed!')).toBeInTheDocument();
    const [first, second] = holdCalls(fetchMock);
    expect(JSON.parse(String((first[1] as RequestInit).body))).toEqual({ showId: 'show-1', seatIds: ['f1', 'f2'] });
    expect((first[1] as RequestInit).headers as Record<string, string>).not.toHaveProperty('Admission-Token');
    expect(JSON.parse(String((second[1] as RequestInit).body))).toEqual({ showId: 'show-1', seatIds: ['f1', 'f2'] });
    expect(((second[1] as RequestInit).headers as Record<string, string>)['Admission-Token']).toBe('admission-token-1');
    expect(holdCalls(fetchMock)).toHaveLength(2);
  });

  it('never falls back to a quantity hold for a seated show after admission', async () => {
    const fetchMock = stubFetch([json({ title: 'Admission required' }, 403), created()]);
    const user = userEvent.setup();
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Front row A seat 2/ }));
    await user.click(screen.getByRole('button', { name: 'Hold 1 seat' }));
    await user.click(await screen.findByRole('button', { name: 'Admit me' }));
    await screen.findByText('Ticket Hold Confirmed!');

    for (const [, options] of holdCalls(fetchMock)) {
      expect(JSON.parse(String((options as RequestInit).body))).not.toHaveProperty('items');
    }
  });

  it('tells the customer which seat was taken while they queued, and holds nothing', async () => {
    stubFetch([
      json({ title: 'Admission required' }, 403),
      json({ detail: 'Front A2 is no longer available. No seats were held; choose again.', code: 'SeatsUnavailable', unavailableSeats: [{ seatId: 'f2', categoryId: 'vip', section: 'Front', row: 'A', number: 2 }] }, 409),
    ]);
    const user = userEvent.setup();
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Front row A seat 2/ }));
    await user.click(screen.getByRole('button', { name: 'Hold 1 seat' }));
    await user.click(await screen.findByRole('button', { name: 'Admit me' }));

    expect(await screen.findByText('Front A2 is no longer available. No seats were held; choose again.')).toBeInTheDocument();
    expect(screen.queryByText('Ticket Hold Confirmed!')).not.toBeInTheDocument();
  });
});
