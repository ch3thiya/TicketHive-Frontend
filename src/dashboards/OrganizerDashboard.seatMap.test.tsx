import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
    return Promise.reject(new Error(`unexpected apiFetch url: ${url}`));
  });
}

describe('OrganizerDashboard seat maps', () => {
  it('offers a seat map request on each live show but not on a cancelled one', async () => {
    stub('active');
    render(<OrganizerDashboard />);

    expect(await screen.findAllByRole('button', { name: /request seat map/i })).toHaveLength(1);
    const statusCalls = mockApiFetch.mock.calls.filter(([url]) => String(url).includes('/seat-map-requests'));
    expect(statusCalls.map(([url]) => url)).toEqual(['/api/catalog/shows/show-active/seat-map-requests']);
  });

  it('keeps the request disabled while the organizer is suspended', async () => {
    stub('suspended');
    render(<OrganizerDashboard />);

    const button = await screen.findByRole('button', { name: /request seat map/i });
    await screen.findByText(/your account is suspended/i);
    expect(button).toBeDisabled();
  });
});
