import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutPage } from './CheckoutPage';

// A stable object: the page re-runs effects when the auth values change identity.
const { mockApiFetch, AUTH } = vi.hoisted(() => {
  const mockApiFetch = vi.fn();
  return { mockApiFetch, AUTH: { apiFetch: mockApiFetch, email: 'buyer@example.com', fullName: 'Bea Buyer', profile: {} } };
});

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => AUTH,
}));

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

const ticket = (id: string, categoryId: string, price: number, seat?: { section: string; row: string; number: number }) => ({
  id,
  orderId: 'order-1',
  showId: 'show-1',
  categoryId,
  customerSub: 'buyer',
  uniqueCode: `TKT-${id}`,
  price,
  issuedAt: '2026-10-11T10:00:00Z',
  usedAt: null,
  usedBy: null,
  voidedAt: null,
  seat: seat ?? null,
});

function stub(tickets: unknown[], totalAmount: number) {
  const route = (url: string): Response => {
    if (url.endsWith('/orders/order-1/status')) return json({ orderId: 'order-1', status: 'Confirmed', totalAmount, currency: 'LKR', updatedAt: '2026-10-11T10:00:00Z' });
    if (url.includes('/api/payment/checkout')) return json({ merchantId: 'm', orderId: 'order-1', items: 'x', amount: totalAmount, currency: 'LKR', hash: 'h', returnUrl: '', cancelUrl: '', notifyUrl: '' });
    if (url.endsWith('/api/booking/orders/order-1')) return json({ orderId: 'order-1', showId: 'show-1', items: [{ categoryId: 'vip' }] });
    if (url.endsWith('/api/booking/tickets')) return json(tickets);
    if (url.endsWith('/api/catalog/events')) return json([EVENT]);
    return json({}, 404);
  };
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation(async (url: string) => route(url));
  vi.stubGlobal('fetch', vi.fn(async (url: string) => route(url)));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CheckoutPage confirmation for seated orders', () => {
  it('shows every ticket of the order with its own seat and category', async () => {
    stub(
      [
        ticket('t1', 'vip', 120, { section: 'Front', row: 'A', number: 1 }),
        ticket('t2', 'vip', 120, { section: 'Front', row: 'A', number: 2 }),
        ticket('t3', 'gen', 40, { section: 'Hall', row: 'C', number: 4 }),
        { ...ticket('other', 'gen', 40), orderId: 'someone-elses-order' },
      ],
      280,
    );

    render(<CheckoutPage orderId="order-1" onNavigateHome={vi.fn()} />);

    const seats = await screen.findAllByLabelText('Seat');
    expect(seats.map((s) => s.textContent)).toEqual([
      'Section Front · Row A · Seat 1',
      'Section Front · Row A · Seat 2',
      'Section Hall · Row C · Seat 4',
    ]);
    expect(screen.getAllByText('VIP')).toHaveLength(2);
    expect(screen.getAllByText('General')).toHaveLength(1);
    expect(screen.queryByText('General Admission')).not.toBeInTheDocument();
    expect(screen.getByText('TKT-t3')).toBeInTheDocument();
    expect(screen.queryByText('TKT-other')).not.toBeInTheDocument();
  });

  it('keeps a single general admission ticket exactly as before, showing the order total and no seat', async () => {
    stub([ticket('t1', 'gen', 40)], 85);

    render(<CheckoutPage orderId="order-1" onNavigateHome={vi.fn()} />);

    expect(await screen.findByText('TKT-t1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Seat')).not.toBeInTheDocument();
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
  });
});
