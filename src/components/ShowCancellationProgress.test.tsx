import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ShowCancellationProgress } from './ShowCancellationProgress';

const apiFetch = vi.fn();
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ apiFetch }) }));
beforeEach(() => apiFetch.mockReset());

it('separates simulated refunds from real refunds and pending work', async () => {
  apiFetch.mockResolvedValue(Response.json({ salesStopped: true, orders: { totalOrders: 5, refunded: 0, simulated: 3, processing: 2, notificationsPending: 2, notificationsNeedAction: 0 } }));
  render(<ShowCancellationProgress showId="show-1" />);
  expect(await screen.findByText('0 refunded · 3 simulated refunds · 2 orders processing')).toBeInTheDocument();
  expect(screen.getByText('Sandbox simulation: no money was moved.')).toBeInTheDocument();
});

it('surfaces notification reconciliation as actionable without claiming delivery', async () => {
  apiFetch.mockResolvedValue(Response.json({ salesStopped: true, orders: { totalOrders: 2, refunded: 0, simulated: 2, processing: 0, notificationsPending: 0, notificationsNeedAction: 1 } }));
  render(<ShowCancellationProgress showId="show-2" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('1 notifications require support reconciliation');
  expect(screen.getByRole('alert')).toHaveTextContent('will not be resent automatically');
});

it('shows a retrying error state when progress cannot be loaded', async () => {
  apiFetch.mockResolvedValue(new Response('', { status: 503 }));
  render(<ShowCancellationProgress showId="show-3" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load cancellation progress');
});
