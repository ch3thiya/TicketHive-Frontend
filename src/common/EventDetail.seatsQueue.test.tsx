import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventDetail } from './EventDetail';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, login: vi.fn(), apiFetch: globalThis.fetch }),
}));

// WaitingRoomPopUp has focused tests; here it only exposes admission to the page.
vi.mock('../popUps/WaitingRoomPopUp', () => ({
  WaitingRoomPopUp: ({ isOpen, onAdmitted }: { isOpen: boolean; onAdmitted: (token: string) => void }) =>
    isOpen ? <button onClick={() => onAdmitted('admission-token-1')}>Admit me</button> : null,
}));

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function stubFetch(queueStatus: unknown = { title: 'Not found' }) {
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (url.includes('/api/catalog/events/')) {
      return Promise.resolve(json({
        id: 'evt-1', organizerId: 'o', name: 'Arijit Singh Live', description: '', category: 'CONCERT', status: 'Published', createdAt: '2026-01-01T00:00:00Z',
        shows: [{ id: 'show-1', eventId: 'evt-1', showDate: '2026-12-01', showTime: '19:00', status: 'Active', createdAt: '2026-01-01T00:00:00Z', seatingMode: 'Seated', ticketCategories: [{ id: 'vip', name: 'VIP', price: 120, capacity: 2 }] }],
      }));
    }
    if (url.includes('/availability')) return Promise.resolve(json({ showId: 'show-1', categories: [] }));
    if (url.includes('/api/inventory/holds/active')) return Promise.resolve(json({ title: 'Not found' }, 404));
    if (url.includes('/api/waiting-room/')) {
      const notFound = (queueStatus as { title?: string }).title === 'Not found';
      return Promise.resolve(json(queueStatus, notFound ? 404 : 200));
    }
    if (url.endsWith('/api/inventory/holds') && options?.method === 'POST') {
      return Promise.resolve(json({ title: 'Unexpected hold' }, 500));
    }
    return Promise.reject(new Error(`unexpected fetch url: ${url}`));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const holdCalls = (fetchMock: ReturnType<typeof stubFetch>) =>
  fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/api/inventory/holds') && (options as RequestInit | undefined)?.method === 'POST');

afterEach(() => {
  window.history.replaceState({}, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('EventDetail waiting-room restoration for a seated show', () => {
  it('reopens a waiting queue and closes it after admission', async () => {
    stubFetch({ status: 'Waiting' });
    const user = userEvent.setup();
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Admit me' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Admit me' })).not.toBeInTheDocument());
  });

  it('delegates seat selection to checkout without creating a quantity hold', async () => {
    const fetchMock = stubFetch({ status: 'Admitted', admissionToken: 'admission-token-1' });
    const user = userEvent.setup();
    render(<EventDetail eventId="evt-1" onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /checkout/i }));

    expect(window.location.pathname).toBe('/checkout');
    expect(window.location.search).toBe('?showId=show-1&count=1');
    expect(holdCalls(fetchMock)).toHaveLength(0);
  });
});
