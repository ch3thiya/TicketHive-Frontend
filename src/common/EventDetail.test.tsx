import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AvailabilityEntry } from './inventoryApi';
import type { Hold } from './holdsApi';

// EventDetail now calls useAuth() for the holds flow — mock the module rather than
// wrapping every render in a real AuthProvider, following the pattern already used in
// src/dashboards/OrganizerDashboard.test.tsx. authState is mutable per test so both a
// signed-in and a signed-out customer can be exercised.
const { mockApiFetch, mockLogin, authState } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockLogin: vi.fn(),
  authState: { isAuthenticated: true }
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    isLoading: false,
    accessToken: 'test-token',
    email: 'customer@example.com',
    fullName: 'Test Customer',
    role: 'customer',
    approvalStatus: 'approved',
    login: mockLogin,
    logout: vi.fn(),
    apiFetch: mockApiFetch
  })
}));

import { EventDetail } from './EventDetail';

const EVENT = {
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
      createdAt: '2026-01-01T00:00:00Z',
      ticketCategories: [
        { id: 'cat-a', name: 'General Admission', price: 85, capacity: 1500 },
        { id: 'cat-b', name: 'VIP Standing', price: 180, capacity: 100 }
      ]
    }
  ]
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// The inventory service wraps categories in an envelope with the show id —
// this mirrors that real response shape rather than a bare array.
function availabilityResponse(categories: AvailabilityEntry[], status = 200) {
  return jsonResponse({ showId: 'show-1', categories }, status);
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
}

// Builds a fetch stub that serves the catalog event and lets each availability
// call be answered in turn by the provided responders (a Response, or a function
// returning one so a later call can differ from the first).
function stubFetch(availabilityResponders: Array<Response | (() => Response) | Error>) {
  let call = 0;
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/api/catalog/events/')) {
      return Promise.resolve(jsonResponse(EVENT));
    }
    if (url.includes('/api/inventory/shows/')) {
      const responder = availabilityResponders[Math.min(call, availabilityResponders.length - 1)];
      call += 1;
      if (responder instanceof Error) return Promise.reject(responder);
      const response = typeof responder === 'function' ? responder() : responder;
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`unexpected fetch url: ${url}`));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const AVAILABILITY: AvailabilityEntry[] = [
  { categoryId: 'cat-a', capacity: 1500, available: 340, unitPrice: 85, currency: 'LKR' },
  { categoryId: 'cat-b', capacity: 100, available: 12, unitPrice: 180, currency: 'LKR' }
];

beforeEach(() => {
  authState.isAuthenticated = true;
  mockApiFetch.mockReset();
  mockLogin.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function holdResponse(overrides: Partial<Hold> = {}, status = 201) {
  const body: Hold = {
    holdId: 'hold-1',
    showId: 'show-1',
    status: 'Active',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    items: [{ categoryId: 'cat-a', quantity: 1, unitPrice: 85, currency: 'LKR' }],
    ...overrides
  };
  return jsonResponse(body, status);
}

// Selects a category by name once its card has rendered, waiting for the availability
// fetch that lands after mount.
async function selectCategory(user: ReturnType<typeof userEvent.setup>, name: string) {
  const label = await screen.findByText(name);
  await user.click(label.closest('[aria-disabled]') as HTMLElement);
}

describe('EventDetail live availability', () => {
  it('shows a neutral placeholder before the first response, then the real API number — never a capacity-derived one', async () => {
    stubFetch([availabilityResponse(AVAILABILITY)]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    const gaName = await screen.findByText('General Admission');
    const gaGroup = gaName.parentElement as HTMLElement;

    // Before the response resolves this render is synchronous with the mount,
    // so the placeholder (not a number) must already be showing.
    expect(gaGroup.textContent).toMatch(/checking availability/i);

    expect(await screen.findByText('340 left')).toBeInTheDocument();
    // 1500 * 0.8 = 1200 — the deleted capacity-derived fallback must never appear.
    expect(screen.queryByText(/1,?200/)).not.toBeInTheDocument();
  });

  it('shows the placeholder and a brief message when availability cannot be loaded at all, but still renders the page', async () => {
    stubFetch([new Error('network down')]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByText('General Admission')).toBeInTheDocument();
    expect(await screen.findByText(/live availability isn't available right now/i)).toBeInTheDocument();
    expect(screen.getAllByText(/availability unknown/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/left/)).not.toBeInTheDocument();
  });

  it('shows the placeholder with no crash and no error banner for a show with no stock (404)', async () => {
    stubFetch([jsonResponse(null, 404)]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByText('General Admission')).toBeInTheDocument();
    expect((await screen.findAllByText(/availability unknown/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/live availability isn't available right now/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reads "Sold out" (not "0 left") for a zero-availability category and blocks selecting it', async () => {
    const soldOut: AvailabilityEntry[] = [
      { categoryId: 'cat-a', capacity: 1500, available: 0, unitPrice: 85, currency: 'LKR' },
      { categoryId: 'cat-b', capacity: 100, available: 12, unitPrice: 180, currency: 'LKR' }
    ];
    stubFetch([availabilityResponse(soldOut)]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByText('Sold out')).toBeInTheDocument();
    expect(screen.queryByText('0 left')).not.toBeInTheDocument();

    const gaCard = screen.getByText('Sold out').closest('[aria-disabled]') as HTMLElement;
    expect(gaCard).toHaveAttribute('aria-disabled', 'true');

    await act(async () => {
      gaCard.click();
    });
    // Clicking the sold-out card must not select it.
    expect(gaCard.className).not.toMatch(/ring-brand-blue/);
  });

  it('disables Buy Now when every category is sold out', async () => {
    const allSoldOut: AvailabilityEntry[] = [
      { categoryId: 'cat-a', capacity: 1500, available: 0, unitPrice: 85, currency: 'LKR' },
      { categoryId: 'cat-b', capacity: 100, available: 0, unitPrice: 180, currency: 'LKR' }
    ];
    stubFetch([availabilityResponse(allSoldOut)]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findAllByText('Sold out')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /buy now/i })).toBeDisabled();
  });

  it('defaults selection to the first available category when the first category is sold out and nothing has been clicked', async () => {
    const firstSoldOut: AvailabilityEntry[] = [
      { categoryId: 'cat-a', capacity: 1500, available: 0, unitPrice: 85, currency: 'LKR' },
      { categoryId: 'cat-b', capacity: 100, available: 12, unitPrice: 180, currency: 'LKR' }
    ];
    stubFetch([availabilityResponse(firstSoldOut)]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findByText('Sold out')).toBeInTheDocument();

    const soldOutCard = screen.getByText('Sold out').closest('[aria-disabled]') as HTMLElement;
    const availableCard = screen.getByText('VIP Standing').closest('[aria-disabled]') as HTMLElement;

    // The sold-out category (first in the list) must not be the active selection...
    expect(soldOutCard.className).not.toMatch(/ring-brand-blue/);
    // ...and the still-available category should be picked as the default instead.
    expect(availableCard.className).toMatch(/ring-brand-blue/);
    // Buy Now must not be disabled against the sold-out category that isn't selected.
    expect(screen.getByRole('button', { name: /buy now/i })).toBeEnabled();
  });

  it('keeps the last known numbers on screen and keeps polling when a later poll fails', async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetch([availabilityResponse(AVAILABILITY), new Error('dropped request')]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('340 left')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    // The failed poll must not blank the numbers, show an error, or stop polling.
    expect(screen.getByText('340 left')).toBeInTheDocument();
    expect(screen.queryByText(/live availability isn't available right now/i)).not.toBeInTheDocument();
    const availabilityCalls = fetchMock.mock.calls.filter(([url]) => (url as string).includes('/api/inventory/'));
    expect(availabilityCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('refreshes roughly every 3 seconds', async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetch([availabilityResponse(AVAILABILITY)]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const countAvailabilityCalls = () =>
      fetchMock.mock.calls.filter(([url]) => (url as string).includes('/api/inventory/')).length;
    const initialCalls = countAvailabilityCalls();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(countAvailabilityCalls()).toBe(initialCalls + 1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(countAvailabilityCalls()).toBe(initialCalls + 2);
  });

  it('stops polling while the tab is hidden and resumes when it is shown again', async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetch([availabilityResponse(AVAILABILITY)]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const countAvailabilityCalls = () =>
      fetchMock.mock.calls.filter(([url]) => (url as string).includes('/api/inventory/')).length;
    const callsWhileVisible = countAvailabilityCalls();

    await act(async () => {
      setVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(countAvailabilityCalls()).toBe(callsWhileVisible);

    await act(async () => {
      setVisibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(countAvailabilityCalls()).toBe(callsWhileVisible + 1);
  });

  it('stops polling on unmount', async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetch([availabilityResponse(AVAILABILITY)]);

    const { unmount } = render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const countAvailabilityCalls = () =>
      fetchMock.mock.calls.filter(([url]) => (url as string).includes('/api/inventory/')).length;
    const callsBeforeUnmount = countAvailabilityCalls();

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(countAvailabilityCalls()).toBe(callsBeforeUnmount);
  });
});

describe('EventDetail quantity selection', () => {
  it("clamps the quantity between 1 and the selected category's available count", async () => {
    const user = userEvent.setup();
    stubFetch([availabilityResponse(AVAILABILITY)]);
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await selectCategory(user, 'VIP Standing'); // available: 12

    const decrement = screen.getByRole('button', { name: /decrease quantity/i });
    const increment = screen.getByRole('button', { name: /increase quantity/i });
    expect(decrement).toBeDisabled();

    for (let i = 0; i < 11; i += 1) {
      await user.click(increment);
    }
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(increment).toBeDisabled();

    // One more click past the cap must not go to 13.
    await user.click(increment);
    expect(screen.getByText('12')).toBeInTheDocument();

    await user.click(decrement);
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(increment).not.toBeDisabled();
  });

  it('resets the quantity to 1 when the selected category changes', async () => {
    const user = userEvent.setup();
    stubFetch([availabilityResponse(AVAILABILITY)]);
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await selectCategory(user, 'VIP Standing');
    const increment = screen.getByRole('button', { name: /increase quantity/i });
    await user.click(increment);
    await user.click(increment);
    expect(screen.getByText('3')).toBeInTheDocument();

    await selectCategory(user, 'General Admission');
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it("shows the running total using the availability response's currency, not a hardcoded $", async () => {
    const user = userEvent.setup();
    stubFetch([availabilityResponse(AVAILABILITY)]);
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await selectCategory(user, 'General Admission'); // unitPrice 85, currency LKR
    const increment = screen.getByRole('button', { name: /increase quantity/i });
    await user.click(increment);
    await user.click(increment);

    expect(screen.getByText(/LKR\s*255\.00/)).toBeInTheDocument();
  });

  it('has no quantity control for a sold-out category', async () => {
    const soldOut: AvailabilityEntry[] = [
      { categoryId: 'cat-a', capacity: 1500, available: 0, unitPrice: 85, currency: 'LKR' },
      { categoryId: 'cat-b', capacity: 100, available: 12, unitPrice: 180, currency: 'LKR' }
    ];
    stubFetch([availabilityResponse(soldOut)]);
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await screen.findByText('Sold out');
    // The default selection skips the sold-out category, so its quantity control
    // never appears at all for it — only the available one is selectable.
    expect(screen.queryByRole('button', { name: /increase quantity/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /increase quantity/i })).toHaveLength(1);
  });
});

describe('EventDetail signing in before a hold', () => {
  it('sends a signed-out customer to sign in instead of firing a hold request', async () => {
    authState.isAuthenticated = false;
    const user = userEvent.setup();
    stubFetch([availabilityResponse(AVAILABILITY)]);
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await screen.findByText('General Admission');
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

describe('EventDetail hold confirmation and countdown', () => {
  it('holds tickets and shows a confirmation with a countdown that recomputes from expiresAt', async () => {
    vi.useFakeTimers();
    const fixedNow = new Date('2026-01-01T00:00:00.000Z').getTime();
    vi.setSystemTime(fixedNow);

    stubFetch([availabilityResponse(AVAILABILITY)]);
    const expiresAt = new Date(fixedNow + 5 * 60 * 1000).toISOString();
    mockApiFetch.mockResolvedValue(
      holdResponse({ expiresAt, items: [{ categoryId: 'cat-a', quantity: 2, unitPrice: 85, currency: 'LKR' }] })
    );

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('General Admission')).toBeInTheDocument();

    // Bump quantity to 2 so the confirmation's unit price and total read
    // differently — otherwise they'd coincidentally both show "LKR 85.00".
    await act(async () => {
      screen.getByRole('button', { name: /increase quantity/i }).click();
    });

    // A plain click, not user-event — user-event's internal pointer-delay timers
    // don't play well with vi's fake timers here, and this interaction is trivial.
    await act(async () => {
      screen.getByRole('button', { name: /buy now/i }).click();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText('Tickets Held!')).toBeInTheDocument();
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/inventory\/holds$/),
      expect.objectContaining({ method: 'POST' })
    );
    const [, options] = mockApiFetch.mock.calls[0];
    expect(JSON.parse(options.body as string)).toEqual({
      showId: 'show-1',
      items: [{ categoryId: 'cat-a', quantity: 2 }]
    });
    expect(screen.getByText('LKR 85.00')).toBeInTheDocument();
    expect(screen.getByText('LKR 170.00')).toBeInTheDocument();
    expect(screen.getByText('5:00')).toBeInTheDocument();

    // One large jump, not a series of small ones — a countdown that decrements a
    // stored number instead of recomputing from expiresAt would still show close to
    // 5:00 here (or drift), rather than landing exactly on the correct value.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });
    expect(screen.getByText('3:59')).toBeInTheDocument();
  });

  it('tells the customer the hold expired and returns to ticket selection when the countdown reaches zero', async () => {
    vi.useFakeTimers();
    const fixedNow = new Date('2026-01-01T00:00:00.000Z').getTime();
    vi.setSystemTime(fixedNow);

    stubFetch([availabilityResponse(AVAILABILITY)]);
    const expiresAt = new Date(fixedNow + 3000).toISOString();
    mockApiFetch.mockResolvedValue(holdResponse({ expiresAt }));

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      screen.getByRole('button', { name: /buy now/i }).click();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('Tickets Held!')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    expect(screen.getByText(/hold expired/i)).toBeInTheDocument();
    expect(screen.getByText('Select Tickets')).toBeInTheDocument();
    expect(screen.getByText('General Admission')).toBeInTheDocument();
  });

  it('keeps availability current in the background during a hold, so numbers are fresh the moment it expires', async () => {
    vi.useFakeTimers();
    const fixedNow = new Date('2026-01-01T00:00:00.000Z').getTime();
    vi.setSystemTime(fixedNow);

    const droppedAvailability: AvailabilityEntry[] = [
      { categoryId: 'cat-a', capacity: 1500, available: 338, unitPrice: 85, currency: 'LKR' },
      { categoryId: 'cat-b', capacity: 100, available: 12, unitPrice: 180, currency: 'LKR' }
    ];
    stubFetch([availabilityResponse(AVAILABILITY), availabilityResponse(droppedAvailability)]);
    const expiresAt = new Date(fixedNow + 4000).toISOString();
    mockApiFetch.mockResolvedValue(
      holdResponse({ expiresAt, items: [{ categoryId: 'cat-a', quantity: 2, unitPrice: 85, currency: 'LKR' }] })
    );

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('340 left')).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: /buy now/i }).click();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('Tickets Held!')).toBeInTheDocument();

    // A poll lands while the confirmation is showing — the drop isn't visible on
    // screen yet (the category list isn't rendered), but it's already in state.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    // The hold expires and selection reappears — the numbers are already current;
    // no extra poll or page reload is needed for them to show.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(screen.getByText(/hold expired/i)).toBeInTheDocument();
    expect(screen.getByText('338 left')).toBeInTheDocument();
  });
});

describe('EventDetail hold failures', () => {
  it.each([
    { status: 409, detail: 'Those tickets are no longer available.', match: /those tickets are no longer available/i },
    { status: 422, detail: 'You may hold at most 4 tickets for this show.', match: /at most 4 tickets/i }
  ])('shows the server\'s own message for a $status response and leaves the customer able to try again', async ({ status, detail, match }) => {
    const user = userEvent.setup();
    stubFetch([availabilityResponse(AVAILABILITY)]);
    mockApiFetch.mockResolvedValue(jsonResponse({ title: 'Error', detail, status }, status));

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);
    await screen.findByText('General Admission');
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(match);
    expect(screen.getByText('Select Tickets')).toBeInTheDocument();
    expect(screen.queryByText('Tickets Held!')).not.toBeInTheDocument();
  });

  it('tells the customer to wait on a 429, rather than showing a raw error', async () => {
    const user = userEvent.setup();
    stubFetch([availabilityResponse(AVAILABILITY)]);
    mockApiFetch.mockResolvedValue(jsonResponse({ title: 'Too Many Requests' }, 429));

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);
    await screen.findByText('General Admission');
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/wait/i);
    expect(alert).not.toHaveTextContent(/too many requests/i);
  });

  it('shows a plain apology on a 400, not the raw error body', async () => {
    const user = userEvent.setup();
    stubFetch([availabilityResponse(AVAILABILITY)]);
    mockApiFetch.mockResolvedValue(jsonResponse({ title: 'Bad Request' }, 400));

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);
    await screen.findByText('General Admission');
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/went wrong on our side/i);
    expect(alert).not.toHaveTextContent(/bad request/i);
  });

  it('preserves the chosen quantity after a failed hold attempt', async () => {
    const user = userEvent.setup();
    stubFetch([availabilityResponse(AVAILABILITY)]);
    mockApiFetch.mockResolvedValue(jsonResponse({ detail: 'Those tickets are no longer available.' }, 409));

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);
    await selectCategory(user, 'VIP Standing');
    const increment = screen.getByRole('button', { name: /increase quantity/i });
    await user.click(increment);
    await user.click(increment);
    expect(screen.getByText('3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /buy now/i }));
    await screen.findByRole('alert');

    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
