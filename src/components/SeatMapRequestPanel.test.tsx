import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeatMapRequestPanel } from './SeatMapRequestPanel';

const apiFetch = vi.fn();
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ apiFetch }) }));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const request = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  showId: 'show-1',
  organizerId: 'org-1',
  description: 'Stalls',
  status: 'Pending',
  rejectionReason: null,
  requestedAt: '2026-10-11T10:00:00Z',
  decidedAt: null,
  decidedBy: null,
  ...overrides,
});

beforeEach(() => apiFetch.mockReset());

describe('SeatMapRequestPanel', () => {
  it('offers a request on a general admission show with no history', async () => {
    apiFetch.mockImplementation(async () => json([]));
    render(<SeatMapRequestPanel showId="show-1" />);

    expect(await screen.findByText('General admission')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request seat map/i })).toBeEnabled();
  });

  it('shows a pending request and hides the request action', async () => {
    apiFetch.mockImplementation(async () => json([request()]));
    render(<SeatMapRequestPanel showId="show-1" />);

    expect(await screen.findByText(/seat map requested/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request/i })).not.toBeInTheDocument();
  });

  it('shows the completed outcome as seated', async () => {
    apiFetch.mockImplementation(async () => json([request({ status: 'Completed', decidedAt: '2026-10-12T10:00:00Z' })]));
    render(<SeatMapRequestPanel showId="show-1" />);

    expect(await screen.findByText('Seated')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request/i })).not.toBeInTheDocument();
  });

  it('shows why a request was rejected and allows asking again', async () => {
    apiFetch.mockImplementation(async () => json([request({ status: 'Rejected', rejectionReason: 'Venue plan missing' })]));
    render(<SeatMapRequestPanel showId="show-1" />);

    expect(await screen.findByText(/request rejected/i)).toBeInTheDocument();
    expect(screen.getByText(/reason: venue plan missing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request again/i })).toBeEnabled();
  });

  it('disables the request for a suspended organizer but still shows the status', async () => {
    apiFetch.mockImplementation(async () => json([]));
    render(<SeatMapRequestPanel showId="show-1" disabled disabledHint="Unavailable while your account is suspended" />);

    const button = await screen.findByRole('button', { name: /request seat map/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Unavailable while your account is suspended');
  });

  it('refuses an empty description without calling the backend', async () => {
    apiFetch.mockImplementation(async () => json([]));
    const user = userEvent.setup();
    render(<SeatMapRequestPanel showId="show-1" />);

    await user.click(await screen.findByRole('button', { name: /request seat map/i }));
    await user.click(screen.getByRole('button', { name: /send request/i }));

    expect(await screen.findByText(/describe the seating/i)).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('submits the trimmed description and then shows the pending status', async () => {
    apiFetch.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST' ? json(request(), 201) : json([]),
    );
    const user = userEvent.setup();
    render(<SeatMapRequestPanel showId="show-1" />);

    await user.click(await screen.findByRole('button', { name: /request seat map/i }));
    await user.type(screen.getByLabelText(/seating description/i), '  Stalls and a balcony  ');
    await user.click(screen.getByRole('button', { name: /send request/i }));

    expect(await screen.findByText(/seat map requested/i)).toBeInTheDocument();
    const post = apiFetch.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(post[0]).toBe('/api/catalog/shows/show-1/seat-map-requests');
    expect(JSON.parse(post[1].body)).toEqual({ description: 'Stalls and a balcony' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the form open and explains a conflict, then reloads the real state', async () => {
    let loads = 0;
    apiFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return json({ detail: 'A seat map request for this show is already pending.', code: 'RequestPending' }, 409);
      }
      loads += 1;
      return json(loads === 1 ? [] : [request()]);
    });
    const user = userEvent.setup();
    render(<SeatMapRequestPanel showId="show-1" />);

    await user.click(await screen.findByRole('button', { name: /request seat map/i }));
    await user.type(screen.getByLabelText(/seating description/i), 'Stalls');
    await user.click(screen.getByRole('button', { name: /send request/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A seat map request for this show is already pending.');
    await waitFor(() => expect(loads).toBe(2));
  });

  it('shows a retry when the status cannot be loaded', async () => {
    apiFetch.mockImplementationOnce(async () => new Response('', { status: 503 })).mockImplementation(async () => json([]));
    const user = userEvent.setup();
    render(<SeatMapRequestPanel showId="show-1" />);

    await user.click(await screen.findByRole('button', { name: /status unavailable/i }));

    expect(await screen.findByText('General admission')).toBeInTheDocument();
  });
});
