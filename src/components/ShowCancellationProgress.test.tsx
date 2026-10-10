import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ShowCancellationProgress } from './ShowCancellationProgress';

const apiFetch = vi.fn();
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ apiFetch }) }));

it('separates simulated refunds from real refunds and pending work', async () => {
  apiFetch.mockResolvedValue(Response.json({ salesStopped: true, orders: { totalOrders: 5, refunded: 0, simulated: 3, processing: 2, notificationsPending: 2 } }));
  render(<ShowCancellationProgress showId="show-1" />);
  expect(await screen.findByText('0 refunded · 3 simulated refunds · 2 orders processing')).toBeInTheDocument();
  expect(screen.getByText('Sandbox simulation: no money was moved.')).toBeInTheDocument();
});
