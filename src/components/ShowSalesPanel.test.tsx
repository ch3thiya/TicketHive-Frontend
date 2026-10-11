import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShowSalesPanel } from './ShowSalesPanel';

const apiFetch = vi.fn();
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ apiFetch }) }));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const CATEGORIES = [
  { id: 'vip', name: 'VIP', capacity: 50 },
  { id: 'gen', name: 'General', capacity: 200 },
];

const sales = (overrides: Record<string, unknown> = {}) => ({
  showId: 'show-1',
  currency: 'LKR',
  ticketsSold: 15,
  revenue: 1920,
  ticketsUsed: 4,
  categories: [
    { categoryId: 'vip', sold: 12, revenue: 1440, used: 3 },
    { categoryId: 'gen', sold: 3, revenue: 480, used: 1 },
  ],
  asOf: '2026-10-11T12:00:00Z',
  ...overrides,
});

beforeEach(() => apiFetch.mockReset());

async function open(user: ReturnType<typeof userEvent.setup>) {
  render(<ShowSalesPanel showId="show-1" categories={CATEGORIES} />);
  await user.click(screen.getByRole('button', { name: 'View sales' }));
}

describe('ShowSalesPanel', () => {
  it('stays closed and loads nothing until the organizer asks', () => {
    render(<ShowSalesPanel showId="show-1" categories={CATEGORIES} />);

    expect(screen.getByRole('button', { name: 'View sales' })).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('shows tickets sold, revenue and entry progress (AC1, AC2)', async () => {
    apiFetch.mockImplementation(async () => json(sales()));
    const user = userEvent.setup();
    await open(user);

    expect(await screen.findByText('Tickets sold')).toBeInTheDocument();
    expect(screen.getByText('Tickets sold').nextSibling).toHaveTextContent('15 of 250');
    expect(screen.getByText('Revenue', { selector: 'dt' }).nextSibling).toHaveTextContent(/LKR 1,?920\.00/);
    expect(screen.getByText('Entered', { selector: 'dt' }).nextSibling).toHaveTextContent('4 of 15');
    expect(apiFetch).toHaveBeenCalledWith('/api/booking/shows/show-1/sales', { cache: 'no-store' });
  });

  it('lists each category as sold against capacity with its revenue (AC1)', async () => {
    apiFetch.mockImplementation(async () => json(sales()));
    const user = userEvent.setup();
    await open(user);

    const table = await screen.findByRole('table', { name: 'Sales by ticket category' });
    const vip = within(table).getByRole('row', { name: /VIP/ });
    expect(vip).toHaveTextContent('12 / 50');
    expect(vip).toHaveTextContent(/LKR 1,?440\.00/);
    expect(within(table).getByRole('row', { name: /General/ })).toHaveTextContent('3 / 200');
  });

  it('shows zeros and a clear message when nothing has sold, not an error (AC5)', async () => {
    apiFetch.mockImplementation(async () => json(sales({ ticketsSold: 0, revenue: 0, ticketsUsed: 0, categories: [] })));
    const user = userEvent.setup();
    await open(user);

    expect(await screen.findByText(/no tickets have been sold for this show yet/i)).toBeInTheDocument();
    expect(screen.getByText('Tickets sold').nextSibling).toHaveTextContent('0 of 250');
    expect(screen.getByText('Revenue', { selector: 'dt' }).nextSibling).toHaveTextContent('LKR 0.00');
    expect(screen.getByRole('row', { name: /VIP/ })).toHaveTextContent('0 / 50');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('picks up a new sale when refreshed (AC6)', async () => {
    let call = 0;
    apiFetch.mockImplementation(async () => json(call++ === 0 ? sales({ ticketsSold: 0, revenue: 0, ticketsUsed: 0, categories: [] }) : sales({ ticketsSold: 1, revenue: 120, ticketsUsed: 0, categories: [{ categoryId: 'vip', sold: 1, revenue: 120, used: 0 }] })));
    const user = userEvent.setup();
    await open(user);
    await screen.findByText(/no tickets have been sold/i);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(await screen.findByText('Tickets sold')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.getByText('Tickets sold').nextSibling).toHaveTextContent('1 of 250'));
    expect(screen.queryByText(/no tickets have been sold/i)).not.toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('reads fresh figures every time it is reopened', async () => {
    apiFetch.mockImplementation(async () => json(sales()));
    const user = userEvent.setup();
    await open(user);
    await screen.findByText('Tickets sold');

    await user.click(screen.getByRole('button', { name: 'Hide sales' }));
    await user.click(screen.getByRole('button', { name: 'View sales' }));

    await vi.waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
  });

  it('keeps sales in a category the dashboard no longer lists', async () => {
    apiFetch.mockImplementation(async () => json(sales({ categories: [{ categoryId: 'old', sold: 2, revenue: 80, used: 0 }], ticketsSold: 2, revenue: 80 })));
    const user = userEvent.setup();
    await open(user);

    expect(await screen.findByRole('row', { name: /Other tickets/ })).toHaveTextContent('2');
  });

  it.each([
    [403, { detail: 'You can only view sales for your own shows.' }, /only view sales for your own shows/],
    [503, { detail: 'Sales could not be authorised right now. Please try again shortly.' }, /could not be authorised/],
    [409, { detail: 'This show has orders in more than one currency, so its sales cannot be totalled.' }, /more than one currency/],
  ])('explains a %i in words and offers to try again', async (status, body, message) => {
    apiFetch.mockImplementation(async () => json(body, status));
    const user = userEvent.setup();
    await open(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(message);
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('Tickets sold')).not.toBeInTheDocument();
  });

  it('recovers after an error when tried again', async () => {
    apiFetch.mockImplementationOnce(async () => json({}, 503)).mockImplementation(async () => json(sales()));
    const user = userEvent.setup();
    await open(user);

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Tickets sold')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a plain message when the reply cannot be read', async () => {
    apiFetch.mockImplementation(async () => new Response('<html>gateway error</html>', { status: 200 }));
    const user = userEvent.setup();
    await open(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(/sales could not be loaded/i);
  });
});
