import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    role: 'admin',
    apiFetch: mockApiFetch,
  }),
}));

import { AdminDashboard } from './AdminDashboard';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const pending = {
  request: {
    id: 'req-1',
    showId: 'show-1',
    organizerId: 'org-1',
    description: 'Stalls and a balcony',
    status: 'Pending',
    rejectionReason: null,
    requestedAt: '2026-10-11T10:00:00Z',
    decidedAt: null,
    decidedBy: null,
  },
  eventName: 'Arijit Singh Live',
  showDate: '2027-01-01',
  showTime: '18:00:00',
  ticketTotal: 320,
};

describe('AdminDashboard seat map requests', () => {
  it('lists pending seat map requests alongside the other admin tasks', async () => {
    mockApiFetch.mockReset();
    mockApiFetch.mockImplementation((url: string) => {
      if (url.includes('/api/catalog/admin/seat-map-requests')) return Promise.resolve(json([pending]));
      if (url.includes('/organizer-requests/')) return Promise.resolve(json([]));
      if (url.includes('/api/catalog/venues')) return Promise.resolve(json([]));
      return Promise.reject(new Error(`unexpected apiFetch url: ${url}`));
    });
    render(<AdminDashboard />);

    expect(await screen.findByRole('heading', { name: /seat map requests/i })).toBeInTheDocument();
    expect(await screen.findByText('Stalls and a balcony')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /build layout for arijit singh live/i })).toBeInTheDocument();
  });
});
