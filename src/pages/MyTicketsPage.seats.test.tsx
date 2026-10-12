import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyTicketsPage } from './MyTicketsPage';

const { mockApiFetch, AUTH } = vi.hoisted(() => {
  const mockApiFetch = vi.fn();
  return { mockApiFetch, AUTH: { apiFetch: mockApiFetch, isAuthenticated: true } };
});

vi.mock('../auth/AuthContext', () => ({ useAuth: () => AUTH }));

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const EVENT = {
  id: 'evt-1',
  name: 'Arijit Singh Live',
  status: 'Published',
  shows: [
    {
      id: 'show-1',
      showDate: '2026-12-01',
      showTime: '19:00',
      ticketCategories: [
        { id: 'vip', name: 'VIP', price: 120, capacity: 2 },
        { id: 'gen', name: 'General', price: 40, capacity: 2 },
      ],
    },
  ],
};

const ticket = (id: string, categoryId: string, seat: { section: string; row: string; number: number } | null, voidedAt: string | null = null) => ({
  id,
  orderId: `order-${id}`,
  showId: 'show-1',
  categoryId,
  customerSub: 'buyer',
  uniqueCode: `TKT-${id}`,
  price: categoryId === 'vip' ? 120 : 40,
  issuedAt: '2026-10-11T10:00:00Z',
  usedAt: null,
  usedBy: null,
  voidedAt,
  seat,
});

function stub(tickets: unknown[]) {
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation(async (url: string) => (url.endsWith('/api/booking/tickets') ? json(tickets) : json({}, 404)));
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.endsWith('/api/catalog/events') ? json([EVENT]) : json({}, 404))));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MyTicketsPage with seated tickets', () => {
  it('shows each ticket\'s seat on its card and no seat line on a general admission ticket', async () => {
    stub([ticket('a', 'vip', { section: 'Front', row: 'A', number: 3 }), ticket('b', 'gen', null)]);

    render(<MyTicketsPage onNavigateHome={vi.fn()} />);

    const seatRow = await screen.findByText('Front · Row A · Seat 3');
    expect(seatRow).toBeInTheDocument();
    expect(screen.getAllByText(/· Row /)).toHaveLength(1);
  });

  it('opens the ticket with its real category name and seat, not "General Admission"', async () => {
    const user = userEvent.setup();
    stub([ticket('a', 'vip', { section: 'Front', row: 'A', number: 3 })]);
    render(<MyTicketsPage onNavigateHome={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /show ticket/i }));

    const seat = await screen.findByLabelText('Seat');
    expect(seat).toHaveTextContent('Section Front · Row A · Seat 3');
    expect(screen.queryByText('General Admission')).not.toBeInTheDocument();
    expect(within(seat.parentElement as HTMLElement).getByText('VIP')).toBeInTheDocument();
  });

  it('lists a cancelled seated ticket with its seat under Cancelled', async () => {
    const user = userEvent.setup();
    stub([ticket('a', 'vip', { section: 'Front', row: 'B', number: 1 }, '2026-10-12T10:00:00Z')]);
    render(<MyTicketsPage onNavigateHome={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /cancelled \(1\)/i }));

    expect(await screen.findByText('Front · Row B · Seat 1')).toBeInTheDocument();
    expect(screen.getAllByText('CANCELLED').length).toBeGreaterThan(0);
  });
});
