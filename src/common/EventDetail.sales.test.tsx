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

function event(salesSuspended?: boolean) {
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
    salesSuspended,
    shows: [
      {
        id: 'show-1',
        eventId: 'evt-1',
        showDate: '2026-12-01',
        showTime: '19:00',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00Z',
        ticketCategories: [{ id: 'cat-a', name: 'General Admission', price: 85, capacity: 1500 }],
      },
    ],
  };
}

interface Stub {
  salesSuspended?: boolean;
  activeHold?: boolean;
  holdResponse?: () => Response;
}

function stubFetch({ salesSuspended, activeHold = false, holdResponse }: Stub = {}) {
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (url.includes('/api/catalog/events/')) return Promise.resolve(json(event(salesSuspended)));
    if (url.includes('/api/inventory/shows/')) {
      return Promise.resolve(json({ showId: 'show-1', categories: [{ categoryId: 'cat-a', capacity: 1500, available: 340, unitPrice: 85, currency: 'LKR' }] }));
    }
    if (url.includes('/api/inventory/holds/active')) {
      return Promise.resolve(
        activeHold
          ? json({ holdId: 'hold-1', showId: 'show-1', status: 'Active', expiresAt: new Date(Date.now() + 600000).toISOString(), items: [{ categoryId: 'cat-a', quantity: 1, unitPrice: 85, currency: 'LKR' }] })
          : json({ title: 'Not found' }, 404),
      );
    }
    if (url.includes('/api/waiting-room/')) return Promise.resolve(json({ title: 'Not found' }, 404));
    if (url.endsWith('/api/inventory/holds') && options?.method === 'POST') {
      return Promise.resolve(holdResponse ? holdResponse() : json({ holdId: 'hold-2', expiresAt: new Date(Date.now() + 600000).toISOString() }, 201));
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

describe('EventDetail when ticket sales are unavailable', () => {
  it('shows the notice, keeps the event visible and disables Buy Now while the organizer is suspended', async () => {
    stubFetch({ salesSuspended: true });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByRole('status')).toHaveTextContent(/ticket sales are unavailable/i);
    expect(screen.getByRole('status')).toHaveTextContent(/tickets they already own|already have tickets, they are still valid/i);
    expect(screen.getAllByText('Arijit Singh Live').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /buy now/i })).toBeDisabled();
  });

  it('shows no notice and allows buying when sales are open', async () => {
    stubFetch({ salesSuspended: false });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByText('340 left')).toBeInTheDocument();
    expect(screen.queryByText(/ticket sales are unavailable/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buy now/i })).toBeEnabled();
  });

  it('lets a customer who already holds tickets resume checkout even though new holds are blocked', async () => {
    stubFetch({ salesSuspended: true, activeHold: true });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await screen.findByText('340 left');
    expect(screen.queryByText(/ticket sales are unavailable/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buy now/i })).toBeEnabled();
  });

  it('turns a refused hold (409 sales unavailable) into an inline message and pauses buying', async () => {
    const user = userEvent.setup();
    stubFetch({
      holdResponse: () => json({ title: 'Sales unavailable', detail: 'Ticket sales for this show are currently unavailable.' }, 409),
    });
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /buy now/i }));

    expect(await screen.findByText('Ticket sales for this show are currently unavailable.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buy now/i })).toBeDisabled();
    expect(screen.getByText(/ticket sales are unavailable/i)).toBeInTheDocument();
  });

  it('shows the 503 ProblemDetails message when sales cannot be verified, without pausing buying', async () => {
    const user = userEvent.setup();
    stubFetch({
      holdResponse: () => json({ title: 'Sales check unavailable', detail: 'Ticket sales could not be verified right now. Please try again shortly.' }, 503),
    });
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /buy now/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ticket sales could not be verified right now.');
    expect(screen.getByRole('button', { name: /buy now/i })).toBeEnabled();
  });

  it('tells the customer to sign in again when the session expired (401 without a body)', async () => {
    const user = userEvent.setup();
    stubFetch({ holdResponse: () => new Response(null, { status: 401 }) });
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /buy now/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/sign in again/i);
  });

  it('shows a network failure inline instead of an alert dialog', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    stubFetch({
      holdResponse: () => {
        throw new Error('offline');
      },
    });
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /buy now/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/network error/i);
    expect(alertSpy).not.toHaveBeenCalled();
  });
});