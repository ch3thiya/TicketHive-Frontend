import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventDetail } from './EventDetail';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    apiFetch: globalThis.fetch,
  }),
}));

const GATED_EVENT = {
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
      highDemandThreshold: 50,
      onSaleAt: '2026-12-01T19:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      ticketCategories: [
        { id: 'cat-a', name: 'General Admission', price: 85, capacity: 1500 },
      ]
    }
  ]
};

const AVAILABILITY = [{ categoryId: 'cat-a', capacity: 1500, available: 340, unitPrice: 85, currency: 'LKR' }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// Routes a fetch stub for the gated-show flow: catalog event, availability, active-hold
// check, and the waiting room join/status endpoints. `queueStatusResponder` answers every
// GET .../entries/me call in turn (repeating the last one once exhausted); `joinResponse`
// and `holdResponse` are single canned responses, swappable per test.
function stubGatedFetch(options: {
  queueStatusResponders: Array<Response | (() => Response)>;
  joinResponse?: Response;
  holdResponse?: Response;
  event?: unknown;
}) {
  let statusCall = 0;
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.includes('/api/catalog/events/')) {
      return Promise.resolve(jsonResponse(options.event ?? GATED_EVENT));
    }
    if (url.includes('/api/inventory/shows/') && url.includes('/availability')) {
      return Promise.resolve(jsonResponse({ showId: 'show-1', categories: AVAILABILITY }));
    }
    if (url.includes('/api/inventory/holds/active')) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (url.includes('/api/inventory/holds') && init?.method === 'POST') {
      return Promise.resolve(options.holdResponse ?? jsonResponse({ holdId: 'hold-1', expiresAt: '2099-01-01T00:00:00Z' }, 201));
    }
    if (url.includes('/api/waiting-room/queues/') && url.endsWith('/entries') && init?.method === 'POST') {
      return Promise.resolve(
        options.joinResponse ?? jsonResponse({ showId: 'show-1', queueNumber: 300, joinedAt: '2026-09-20T09:00:00Z' })
      );
    }
    if (url.includes('/api/waiting-room/queues/') && url.endsWith('/entries/me')) {
      const responder = options.queueStatusResponders[Math.min(statusCall, options.queueStatusResponders.length - 1)];
      statusCall += 1;
      return Promise.resolve(typeof responder === 'function' ? responder() : responder);
    }
    return Promise.reject(new Error(`unexpected fetch url: ${url} (${init?.method ?? 'GET'})`));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const NOT_IN_QUEUE = { status: 'NotInQueue', position: null, onSaleAt: null, admissionToken: null, admissionExpiresAt: null };
const WAITING = { status: 'Waiting', position: 42, onSaleAt: null, admissionToken: null, admissionExpiresAt: null };
const ADMITTED = {
  status: 'Admitted',
  position: null,
  onSaleAt: null,
  admissionToken: 'token-xyz',
  // Far in the future so the countdown never reaches zero during a test run.
  admissionExpiresAt: '2099-01-01T00:00:00Z'
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});

describe('EventDetail gating derivation', () => {
  // Catalog's real ShowDetailsDto has no `highDemand` boolean — only highDemandThreshold
  // (int?) — and Catalog itself derives "is this show high-demand" as threshold > 0
  // (EventService.cs). isGated must match that derivation exactly, not invent a field.
  it('is gated when highDemandThreshold is a positive number', async () => {
    stubGatedFetch({
      queueStatusResponders: [jsonResponse(NOT_IN_QUEUE)],
      event: { ...GATED_EVENT, shows: [{ ...GATED_EVENT.shows[0], highDemandThreshold: 50 }] }
    });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /join the queue/i })).toBeInTheDocument();
  });

  it('is not gated when highDemandThreshold is null or 0', async () => {
    for (const highDemandThreshold of [null, 0]) {
      stubGatedFetch({
        queueStatusResponders: [jsonResponse(NOT_IN_QUEUE)],
        event: { ...GATED_EVENT, shows: [{ ...GATED_EVENT.shows[0], highDemandThreshold }] }
      });

      const { unmount } = render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

      expect(await screen.findByRole('button', { name: /^buy now/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /join the queue/i })).not.toBeInTheDocument();

      unmount();
    }
  });
});

describe('EventDetail gated shows', () => {
  it('offers to join the queue instead of buying directly (AC1)', async () => {
    stubGatedFetch({ queueStatusResponders: [jsonResponse(NOT_IN_QUEUE)] });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /join the queue/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^buy now/i })).not.toBeInTheDocument();
  });

  it('joins and shows the waiting popup when Join the Queue is pressed (AC2)', async () => {
    const user = userEvent.setup();
    stubGatedFetch({ queueStatusResponders: [jsonResponse(NOT_IN_QUEUE), jsonResponse(WAITING)] });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    const joinButton = await screen.findByRole('button', { name: /join the queue/i });
    await user.click(joinButton);

    expect(await screen.findByText('#42')).toBeInTheDocument();
  });

  it('restores an already-admitted state on mount without reopening the popup (AC5)', async () => {
    stubGatedFetch({ queueStatusResponders: [jsonResponse(ADMITTED)] });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByText(/grab your tickets now/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^buy now/i })).toBeInTheDocument();
  });

  it('sends the Admission-Token header on the hold request once admitted (AC6)', async () => {
    const user = userEvent.setup();
    const fetchMock = stubGatedFetch({ queueStatusResponders: [jsonResponse(ADMITTED)] });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    const buyButton = await screen.findByRole('button', { name: /^buy now/i });
    await user.click(buyButton);

    await act(async () => {
      await Promise.resolve();
    });

    const holdCall = fetchMock.mock.calls.find(
      ([url, init]) => (url as string).includes('/api/inventory/holds') && (init as RequestInit)?.method === 'POST'
    );
    expect(holdCall).toBeDefined();
    const headers = new Headers((holdCall?.[1] as RequestInit).headers);
    expect(headers.get('Admission-Token')).toBe('token-xyz');
  });

  it('explains an expired turn and returns to the join step on a 403 (AC7)', async () => {
    const user = userEvent.setup();
    stubGatedFetch({
      queueStatusResponders: [jsonResponse(ADMITTED)],
      holdResponse: jsonResponse({ title: 'Admission required', detail: 'This show requires a valid admission token before holding tickets.' }, 403)
    });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    const buyButton = await screen.findByRole('button', { name: /^buy now/i });
    await user.click(buyButton);

    expect(await screen.findByText(/turn expired/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /join the queue/i })).toBeInTheDocument();
  });

  it('tells the customer plainly when the show has sold out (AC8)', async () => {
    // The live mid-wait transition (polling picks up SoldOut and stops) is covered by
    // WaitingRoomPopUp.test.tsx; this checks EventDetail reflects that status once known —
    // here, via the same status the popup would have reported, restored on mount.
    stubGatedFetch({
      queueStatusResponders: [jsonResponse({ status: 'SoldOut', position: null, onSaleAt: null, admissionToken: null, admissionExpiresAt: null })]
    });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    const soldOutButton = await screen.findByRole('button', { name: /sold out/i });
    expect(soldOutButton).toBeDisabled();
  });

  it('treats a 404 on join as the queue not being open yet, not an error', async () => {
    const user = userEvent.setup();
    stubGatedFetch({
      queueStatusResponders: [jsonResponse(NOT_IN_QUEUE)],
      joinResponse: jsonResponse({ detail: "Show 'show-1' has no waiting room queue open yet." }, 404)
    });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    const joinButton = await screen.findByRole('button', { name: /join the queue/i });
    await user.click(joinButton);

    expect(await screen.findByText('Not open yet')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('never writes the admission token to localStorage or sessionStorage (AC10)', async () => {
    const user = userEvent.setup();
    stubGatedFetch({ queueStatusResponders: [jsonResponse(ADMITTED)] });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await screen.findByText(/grab your tickets now/i);
    const buyButton = screen.getByRole('button', { name: /^buy now/i });
    await user.click(buyButton);

    await act(async () => {
      await Promise.resolve();
    });

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

function holdPostCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter(
    ([url, init]) => (url as string).includes('/api/inventory/holds') && (init as RequestInit | undefined)?.method === 'POST'
  );
}

describe('EventDetail duplicate hold prevention', () => {
  // Reported: three Active holds (quota 3) from what should have been one, each with a
  // distinct Idempotency-Key — genuinely separate requests, not retries of one click.

  it('the button is already correctly disabled for a second click while the first hold request is in flight', async () => {
    const user = userEvent.setup();
    let resolveHold!: (res: Response) => void;
    const pendingHold = new Promise<Response>((resolve) => {
      resolveHold = resolve;
    });
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('/api/catalog/events/')) return Promise.resolve(jsonResponse(GATED_EVENT));
      if (url.includes('/api/inventory/shows/') && url.includes('/availability')) {
        return Promise.resolve(jsonResponse({ showId: 'show-1', categories: AVAILABILITY }));
      }
      if (url.includes('/api/inventory/holds/active')) return Promise.resolve(new Response(null, { status: 204 }));
      if (url.includes('/api/inventory/holds') && init?.method === 'POST') return pendingHold;
      if (url.includes('/api/waiting-room/queues/') && url.endsWith('/entries/me')) return Promise.resolve(jsonResponse(ADMITTED));
      return Promise.reject(new Error(`unexpected fetch url: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    const buyButton = await screen.findByRole('button', { name: /^buy now/i });
    await user.click(buyButton);
    expect(buyButton).toBeDisabled();

    // A second click while the request is still pending must not be possible — the
    // button is a real DOM `disabled` element by this point, so this click is a no-op.
    await user.click(buyButton);

    resolveHold(jsonResponse({ holdId: 'hold-1', expiresAt: '2099-01-01T00:00:00Z' }, 201));
    await screen.findByText('Ticket Hold Confirmed!');

    expect(holdPostCalls(fetchMock)).toHaveLength(1);
  });

  it('dismissing the confirmation via the X button, then pressing Buy Now again, creates a second, separate hold', async () => {
    // This is the reported mechanism, reproduced: it is not a disabled-while-in-flight
    // gap (that part already works, per the test above) — each click is its own fully
    // completed, correctly-disabled request. The X close button clears the known hold
    // locally without cancelling it server-side, so Buy Now reappears with no memory
    // that a hold already exists, and a second click creates a genuinely separate one.
    const user = userEvent.setup();
    const fetchMock = stubGatedFetch({ queueStatusResponders: [jsonResponse(ADMITTED)] });

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    const buyButton = await screen.findByRole('button', { name: /^buy now/i });
    await user.click(buyButton);
    await screen.findByText('Ticket Hold Confirmed!');

    await user.click(screen.getByRole('button', { name: /close modal/i }));
    expect(screen.queryByText('Ticket Hold Confirmed!')).not.toBeInTheDocument();

    const buyButtonAgain = await screen.findByRole('button', { name: /^buy now/i });
    await user.click(buyButtonAgain);

    expect(holdPostCalls(fetchMock)).toHaveLength(1);
  });
});
