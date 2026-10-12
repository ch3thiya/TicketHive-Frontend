import { describe, it, expect, vi, afterEach } from 'vitest';
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
  shows: [
    {
      id: 'show-1',
      eventId: 'evt-1',
      showDate: '2026-12-01',
      showTime: '19:00:00',
      venueId: null,
      onSaleAt: null,
      highDemandThreshold: null,
      reminderMinutesBefore: null,
      status: 'Active',
      createdAt: '2026-01-01T00:00:00Z',
      ticketCategories: [{ id: 'cat-ga', name: 'General Admission', price: 50, capacity: 200 }],
    },
  ],
};

function stub(status: 'active' | 'suspended', cancelResponse?: () => Response) {
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes('/api/catalog/organizer/status')) return Promise.resolve(json({ status }));
    if (url.includes('/api/catalog/events/my-events')) return Promise.resolve(json([EVENT]));
    if (url.includes('/api/catalog/venues')) return Promise.resolve(json([]));
    if (url.includes('/api/catalog/events/evt-1/cancel') && options?.method === 'POST') {
      return Promise.resolve(cancelResponse ? cancelResponse() : json({ message: 'ok' }, 202));
    }
    return Promise.reject(new Error(`unexpected apiFetch url: ${url}`));
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OrganizerDashboard while suspended', () => {
  it('explains the restrictions, keeps events visible and disables every write action', async () => {
    stub('suspended');
    render(<OrganizerDashboard />);

    expect(await screen.findByText('Arijit Singh Live')).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent(/your account is suspended/i);
    expect(screen.getByRole('status')).toHaveTextContent(/cannot create, edit, publish or cancel/i);
    expect(screen.getByRole('button', { name: /create new event/i })).toBeDisabled();
    for (const name of ['Edit', 'Cancel Event', 'Add Show', 'Cancel Show']) {
      const buttons = screen.getAllByRole('button', { name: new RegExp(`^${name}$`, 'i') });
      buttons.forEach((button) => expect(button).toBeDisabled());
    }
  });

  it('does not reveal any suspension reason to the organizer', async () => {
    stub('suspended');
    render(<OrganizerDashboard />);

    await screen.findByRole('status');

    expect(screen.queryByText(/fraud|chargeback/i)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).not.toHaveTextContent(/reason:/i);
  });

  it('shows no banner and keeps actions enabled for an active organizer', async () => {
    stub('active');
    render(<OrganizerDashboard />);

    expect(await screen.findByText('Arijit Singh Live')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create new event/i })).toBeEnabled();
  });

  it('switches to read-only when a write is refused because the account was suspended meanwhile', async () => {
    const user = userEvent.setup();
    stub('active', () => json({ title: 'Organizer suspended', detail: 'This organizer account is suspended.', code: 'OrganizerSuspended' }, 403));
    render(<OrganizerDashboard />);
    await screen.findByText('Arijit Singh Live');

    await user.click(screen.getByRole('button', { name: /^cancel event$/i }));
    // The confirmation dialog repeats the label; its confirm button is the last one on the page.
    const confirmButtons = await screen.findAllByRole('button', { name: /^cancel event$/i });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    expect(await screen.findByText(/your account is suspended/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create new event/i })).toBeDisabled();
  });

  it('keeps the page usable when the status lookup fails (writes are still enforced by the server)', async () => {
    mockApiFetch.mockReset();
    mockApiFetch.mockImplementation((url: string) => {
      if (url.includes('/api/catalog/organizer/status')) return Promise.resolve(json({ detail: 'down' }, 503));
      if (url.includes('/my-events')) return Promise.resolve(json([EVENT]));
      return Promise.resolve(json([]));
    });
    render(<OrganizerDashboard />);

    expect(await screen.findByText('Arijit Singh Live')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});