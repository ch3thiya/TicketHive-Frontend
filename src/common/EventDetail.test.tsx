import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { EventDetail } from './EventDetail';
import type { AvailabilityEntry } from './inventoryApi';

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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('EventDetail live availability', () => {
  it('shows a neutral placeholder before the first response, then the real API number — never a capacity-derived one', async () => {
    stubFetch([jsonResponse(AVAILABILITY)]);

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
    stubFetch([jsonResponse(soldOut)]);

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
    stubFetch([jsonResponse(allSoldOut)]);

    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    expect(await screen.findAllByText('Sold out')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /buy now/i })).toBeDisabled();
  });

  it('keeps the last known numbers on screen and keeps polling when a later poll fails', async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetch([jsonResponse(AVAILABILITY), new Error('dropped request')]);

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
    const fetchMock = stubFetch([jsonResponse(AVAILABILITY)]);

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
    const fetchMock = stubFetch([jsonResponse(AVAILABILITY)]);

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
    const fetchMock = stubFetch([jsonResponse(AVAILABILITY)]);

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
