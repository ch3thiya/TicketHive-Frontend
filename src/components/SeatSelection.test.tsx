import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SeatSelection } from './SeatSelection';
import type { SeatHoldOutcome } from '../common/seatApi';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const seat = (id: string, number: number, categoryId: string, state = 'Available') => ({ id, number, categoryId, state });

const MAP = {
  showId: 'show-1',
  version: 1,
  categories: [
    { categoryId: 'vip', unitPrice: 120, currency: 'LKR' },
    { categoryId: 'gen', unitPrice: 40, currency: 'LKR' },
  ],
  sections: [
    { name: 'Front', rows: [{ label: 'A', seats: [seat('f-a1', 1, 'vip'), seat('f-a2', 2, 'vip'), seat('f-a3', 3, 'vip', 'Sold')] }] },
    { name: 'Hall', rows: [{ label: 'A', seats: [seat('h-a1', 1, 'gen'), seat('h-a2', 2, 'gen'), seat('h-a3', 3, 'gen')] }] },
  ],
};

const CATEGORIES = { vip: { name: 'VIP', price: 120 }, gen: { name: 'General', price: 40 } };

function server(states: () => { id: string; state: string }[] = () => [], mapStatus = 200) {
  const calls = { map: 0, states: 0 };
  const fetchFn = vi.fn(async (url: string) => {
    if (url.endsWith('/seats/states')) {
      calls.states += 1;
      return json({ showId: 'show-1', unavailable: states() });
    }
    calls.map += 1;
    return mapStatus === 200 ? json(MAP) : json({ detail: 'x' }, mapStatus);
  });
  return { fetchFn, calls };
}

function setup(overrides: Partial<React.ComponentProps<typeof SeatSelection>> = {}, states?: () => { id: string; state: string }[]) {
  const { fetchFn, calls } = server(states);
  const onHold = vi.fn<(seats: unknown[]) => Promise<SeatHoldOutcome>>();
  const onLogin = vi.fn();
  const view = render(
    <SeatSelection
      showId="show-1"
      categories={CATEGORIES}
      isAuthenticated
      onLogin={onLogin}
      onHold={onHold as never}
      pollIntervalMs={30}
      fetchFn={fetchFn}
      {...overrides}
    />,
  );
  return { fetchFn, calls, onHold, onLogin, user: userEvent.setup(), ...view };
}

const seatButton = (name: RegExp) => screen.findByRole('button', { name });

describe('SeatSelection', () => {
  it('shows every seat with its category, price and state', async () => {
    setup();

    expect(await seatButton(/Front row A seat 1, VIP, Rs\. 120\.00 LKR, available/)).toBeEnabled();
    expect(screen.getByRole('button', { name: /Hall row A seat 2, General, Rs\. 40\.00 LKR, available/ })).toBeEnabled();
    const sold = screen.getByRole('button', { name: /Front row A seat 3, VIP, Rs\. 120\.00 LKR, sold/ });
    expect(sold).toBeDisabled();
    expect(screen.getByRole('list', { name: 'Seat key' })).toHaveTextContent('Held by someone else');
    expect(screen.getByRole('list', { name: 'Prices' })).toHaveTextContent('VIP Rs. 120.00 LKR');
  });

  it('adds selected seats to a summary with a running total and lets them be removed', async () => {
    const { user } = setup();

    await user.click(await seatButton(/Front row A seat 1/));
    await user.click(screen.getByRole('button', { name: /Hall row A seat 2/ }));

    const list = screen.getByRole('list', { name: 'Selected seats' });
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Front A1 · VIPRs. 120.00 LKR', 'Hall A2 · GeneralRs. 40.00 LKR']);
    expect(screen.getByText('Total').parentElement).toHaveTextContent('Rs. 160.00 LKR');
    expect(screen.getByRole('button', { name: 'Hold 2 seats' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /Front row A seat 1, VIP, Rs\. 120\.00 LKR, selected/ }));
    expect(screen.getByRole('button', { name: 'Hold 1 seat' })).toBeEnabled();
  });

  it('stops at the per-customer limit and says so', async () => {
    const { user } = setup({ maxSeats: 2 });

    await user.click(await seatButton(/Front row A seat 1/));
    await user.click(screen.getByRole('button', { name: /Front row A seat 2/ }));
    await user.click(screen.getByRole('button', { name: /Hall row A seat 1/ }));

    expect(screen.getByText(/up to 2 seats/i)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Selected seats' }).children).toHaveLength(2);
  });

  it('updates other customers\' holds without a page refresh', async () => {
    let taken: { id: string; state: string }[] = [];
    setup({}, () => taken);
    const target = await seatButton(/Hall row A seat 1, General, Rs\. 40\.00 LKR, available/);
    expect(target).toBeEnabled();

    taken = [{ id: 'h-a1', state: 'Held' }];

    await waitFor(() => expect(screen.getByRole('button', { name: /Hall row A seat 1, General, Rs\. 40\.00 LKR, held by someone else/ })).toBeDisabled());
  });

  it('frees a seat again when its hold goes away', async () => {
    let taken: { id: string; state: string }[] = [{ id: 'h-a1', state: 'Held' }];
    setup({}, () => taken);
    await screen.findByRole('button', { name: /Hall row A seat 1, General, Rs\. 40\.00 LKR, held by someone else/ });

    taken = [];

    await waitFor(() => expect(screen.getByRole('button', { name: /Hall row A seat 1, General, Rs\. 40\.00 LKR, available/ })).toBeEnabled());
  });

  it('removes a selected seat that someone else just took and tells the customer', async () => {
    let taken: { id: string; state: string }[] = [];
    const { user } = setup({}, () => taken);
    await user.click(await seatButton(/Front row A seat 1/));
    await user.click(screen.getByRole('button', { name: /Front row A seat 2/ }));

    taken = [{ id: 'f-a2', state: 'Sold' }];

    await waitFor(() => expect(screen.getByText(/Front A2 was just taken and removed from your selection/)).toBeInTheDocument());
    expect(screen.getByRole('list', { name: 'Selected seats' }).children).toHaveLength(1);
  });

  it('hands the chosen seats to the page and clears the selection when they are held', async () => {
    const { user, onHold } = setup();
    onHold.mockResolvedValue({ kind: 'created', hold: { holdId: 'h', showId: 's', status: 'Active', expiresAt: '', items: [], seats: [] } });
    await user.click(await seatButton(/Front row A seat 2/));
    await user.click(screen.getByRole('button', { name: /Hall row A seat 3/ }));

    await user.click(screen.getByRole('button', { name: 'Hold 2 seats' }));

    expect(onHold).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'f-a2', section: 'Front', row: 'A', number: 2, price: 120 }),
      expect.objectContaining({ id: 'h-a3', section: 'Hall', row: 'A', number: 3, price: 40 }),
    ]);
    await waitFor(() => expect(screen.getByText(/choose up to 6 seats/i)).toBeInTheDocument());
  });

  it('names the seat that was taken, holds nothing, and keeps the rest of the selection', async () => {
    // The server agrees the seat is now taken, so the next refresh keeps it marked.
    let taken: { id: string; state: string }[] = [];
    const { user, onHold } = setup({}, () => taken);
    onHold.mockImplementation(async () => {
      taken = [{ id: 'f-a2', state: 'Held' }];
      return {
      kind: 'seats-unavailable',
      seats: [{ seatId: 'f-a2', categoryId: 'vip', section: 'Front', row: 'A', number: 2 }],
      message: 'Front A2 is no longer available. No seats were held; choose again.',
      };
    });
    await user.click(await seatButton(/Front row A seat 1/));
    await user.click(screen.getByRole('button', { name: /Front row A seat 2/ }));

    await user.click(screen.getByRole('button', { name: 'Hold 2 seats' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Front A2 is no longer available. No seats were held; choose again.');
    expect(screen.getByRole('list', { name: 'Selected seats' })).toHaveTextContent('Front A1');
    expect(screen.getByRole('list', { name: 'Selected seats' })).not.toHaveTextContent('Front A2');
    expect(screen.getByRole('button', { name: /Front row A seat 2, VIP, Rs\. 120\.00 LKR, held by someone else/ })).toBeDisabled();
  });

  it('shows a failure message and keeps the selection', async () => {
    const { user, onHold } = setup();
    onHold.mockResolvedValue({ kind: 'failed', message: 'This request would exceed the per-customer limit of 6 tickets for this show.' });
    await user.click(await seatButton(/Front row A seat 1/));

    await user.click(screen.getByRole('button', { name: 'Hold 1 seat' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/per-customer limit/);
    expect(screen.getByRole('list', { name: 'Selected seats' }).children).toHaveLength(1);
  });

  it('asks a signed-out customer to sign in instead of holding', async () => {
    const { user, onHold, onLogin } = setup({ isAuthenticated: false });
    await user.click(await seatButton(/Front row A seat 1/));

    await user.click(screen.getByRole('button', { name: 'Sign in to hold seats' }));

    expect(onLogin).toHaveBeenCalledOnce();
    expect(onHold).not.toHaveBeenCalled();
  });

  it('says so when the show has no seat map', async () => {
    const fetchFn = vi.fn(async () => json({ detail: 'none' }, 404));
    render(<SeatSelection showId="s" categories={CATEGORIES} isAuthenticated onLogin={vi.fn()} onHold={vi.fn()} fetchFn={fetchFn} />);

    expect(await screen.findByText(/not available for this show yet/i)).toBeInTheDocument();
  });

  it('offers a retry when the map cannot be loaded', async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementation(async (url: string) => (url.endsWith('/states') ? json({ unavailable: [] }) : json(MAP)));
    const user = userEvent.setup();
    render(<SeatSelection showId="s" categories={CATEGORIES} isAuthenticated onLogin={vi.fn()} onHold={vi.fn()} fetchFn={fetchFn} />);

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: /Front row A seat 1/ })).toBeInTheDocument();
  });

  it('stops polling when the page is left', async () => {
    const { calls, unmount } = setup();
    await seatButton(/Front row A seat 1/);
    await waitFor(() => expect(calls.states).toBeGreaterThan(0));

    unmount();
    const after = calls.states;
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(calls.states).toBe(after);
  });

  it('keeps showing the last known seats and says updates are paused when polling keeps failing', async () => {
    const fetchFn = vi.fn(async (url: string) => (url.endsWith('/seats/states') ? new Response('', { status: 500 }) : json(MAP)));
    render(<SeatSelection showId="s" categories={CATEGORIES} isAuthenticated onLogin={vi.fn()} onHold={vi.fn()} fetchFn={fetchFn} pollIntervalMs={20} />);

    expect(await screen.findByText(/live updates are paused/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Front row A seat 1/ })).toBeEnabled();
  });

  it('does not let seats be chosen while sales are blocked', async () => {
    setup({ disabled: true });

    expect(await seatButton(/Front row A seat 1/)).toBeDisabled();
  });
});
