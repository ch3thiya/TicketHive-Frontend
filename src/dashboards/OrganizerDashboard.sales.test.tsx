import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    accessToken: 'test-token',
    email: 'organizer@example.com',
    fullName: 'Test Organizer',
    role: 'organizer',
    approvalStatus: 'approved',
    login: vi.fn(),
    logout: vi.fn(),
    apiFetch: mockApiFetch,
  }),
}));

import { OrganizerDashboard } from './OrganizerDashboard';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const show = (id: string, status: string) => ({
  id,
  eventId: 'evt-1',
  showDate: '2026-12-01',
  showTime: '19:00:00',
  venueId: null,
  onSaleAt: null,
  highDemandThreshold: null,
  reminderMinutesBefore: null,
  status,
  createdAt: '2026-01-01T00:00:00Z',
  ticketCategories: [{ id: 'cat-ga', name: 'General Admission', price: 50, capacity: 200 }],
});

const EVENT = {
  id: 'evt-1',
  organizerId: 'org-1',
  name: 'Arijit Singh Live',
  description: 'A great show.',
  category: 'Concert',
  eventDate: '2026-12-01',
  eventTime: '19:00',
  bannerUrl: '',
  cancellationCutoffHours: 24,
  status: 'Published',
  createdAt: '2026-01-01T00:00:00Z',
  shows: [show('show-active', 'Active'), show('show-cancelled', 'Cancelled')],
};

function stub(status: 'active' | 'suspended') {
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation((url: string) => {
    if (url.includes('/api/catalog/organizer/status')) return Promise.resolve(json({ status }));
    if (url.includes('/api/catalog/events/my-events')) return Promise.resolve(json([EVENT]));
    if (url.includes('/api/catalog/venues')) return Promise.resolve(json([]));
    if (url.includes('/seat-map-requests')) return Promise.resolve(json([]));
    if (url.includes('/api/booking/shows/show-active/sales')) {
      return Promise.resolve(json({ showId: 'show-active', currency: 'LKR', ticketsSold: 12, revenue: 600, ticketsUsed: 5, categories: [{ categoryId: 'cat-ga', sold: 12, revenue: 600, used: 5 }], asOf: '2026-10-11T12:00:00Z' }));
    }
    return Promise.reject(new Error(`unexpected apiFetch url: ${url}`));
  });
}

const salesCalls = () => mockApiFetch.mock.calls.filter(([url]) => String(url).includes('/sales'));

describe('OrganizerDashboard sales', () => {
  it('offers sales on a live show only, and reads nothing until asked', async () => {
    stub('active');
    render(<OrganizerDashboard />);

    expect(await screen.findAllByRole('button', { name: 'View sales' })).toHaveLength(1);
    expect(salesCalls()).toHaveLength(0);
  });

  it('shows the show\'s sold tickets against its capacity, revenue and entry progress', async () => {
    stub('active');
    const user = userEvent.setup();
    render(<OrganizerDashboard />);

    await user.click(await screen.findByRole('button', { name: 'View sales' }));

    expect(await screen.findByText('Tickets sold')).toBeInTheDocument();
    expect(screen.getByText('Tickets sold').nextSibling).toHaveTextContent('12 of 200');
    expect(screen.getByText('Entered', { selector: 'dt' }).nextSibling).toHaveTextContent('5 of 12');
    expect(salesCalls().map(([url]) => url)).toEqual(['/api/booking/shows/show-active/sales']);
  });

  it('keeps sales readable while the organizer is suspended', async () => {
    stub('suspended');
    const user = userEvent.setup();
    render(<OrganizerDashboard />);
    await screen.findByText(/your account is suspended/i);

    const button = await screen.findByRole('button', { name: 'View sales' });
    expect(button).toBeEnabled();
    await user.click(button);

    expect(await screen.findByText('Tickets sold')).toBeInTheDocument();
  });
});
