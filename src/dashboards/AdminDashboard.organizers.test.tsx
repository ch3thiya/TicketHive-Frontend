import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

const base = { email: 'o@example.com', createdAt: '2026-01-01T00:00:00Z', businessEmail: 'biz@example.com', eventType: 'Concert', suspendedAt: null, suspensionReason: null };
const ACTIVE = { ...base, accountId: 'org-active', fullName: 'Alice', organizationName: 'Alice Events', status: 'approved' };
const SUSPENDED = { ...base, accountId: 'org-susp', fullName: 'Sam', organizationName: 'Sam Shows', status: 'suspended', suspendedAt: '2026-10-01T00:00:00Z', suspensionReason: 'Fraud' };

interface Stub {
  organizers?: unknown[];
  organizersStatus?: number;
  suspend?: () => Response;
  reinstate?: () => Response;
}

function stub({ organizers = [ACTIVE, SUSPENDED], organizersStatus = 200, suspend, reinstate }: Stub = {}) {
  let current = organizers;
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation((url: string, options?: RequestInit) => {
    if (url.endsWith('/organizer-requests/pending')) return Promise.resolve(json([]));
    if (url.endsWith('/organizer-requests/organizers')) return Promise.resolve(organizersStatus === 200 ? json(current) : json({ detail: 'Identity unavailable.' }, organizersStatus));
    if (url.includes('/api/catalog/venues')) return Promise.resolve(json([]));
    if (url.endsWith('/org-active/suspend') && options?.method === 'POST') {
      const response = suspend ? suspend() : json({ organizerId: 'org-active', status: 'suspended', repeated: false });
      if (response.ok) current = [{ ...ACTIVE, status: 'suspended', suspensionReason: 'Fraud', suspendedAt: '2026-10-10T00:00:00Z' }, SUSPENDED];
      return Promise.resolve(response);
    }
    if (url.endsWith('/org-susp/reinstate') && options?.method === 'POST') {
      const response = reinstate ? reinstate() : json({ organizerId: 'org-susp', status: 'approved', repeated: false });
      if (response.ok) current = [ACTIVE, { ...SUSPENDED, status: 'approved', suspendedAt: null, suspensionReason: null }];
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`unexpected apiFetch url: ${url}`));
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminDashboard organizer suspension', () => {
  it('shows each organizer with an accessible status and the matching action', async () => {
    stub();
    render(<AdminDashboard />);

    expect(await screen.findByRole('button', { name: 'Suspend Alice Events' })).toBeInTheDocument();
    expect(screen.getByLabelText('Account status: active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reinstate Sam Shows' })).toBeInTheDocument();
    expect(screen.getByLabelText('Account status: suspended')).toBeInTheDocument();
    expect(screen.getByText(/suspended on .*: fraud/i)).toBeInTheDocument();
  });

  it('shows a loading indicator while organizers load', async () => {
    stub();
    render(<AdminDashboard />);

    expect(screen.getByRole('status', { name: /loading organizers/i })).toBeInTheDocument();
    await screen.findByRole('button', { name: 'Suspend Alice Events' });
  });

  it('requires a reason before suspending, then suspends and refreshes the list', async () => {
    const user = userEvent.setup();
    stub();
    render(<AdminDashboard />);

    await user.click(await screen.findByRole('button', { name: 'Suspend Alice Events' }));
    const dialog = screen.getByRole('dialog', { name: /suspend alice events\?/i });
    await user.click(within(dialog).getByRole('button', { name: /suspend organizer/i }));
    expect(within(dialog).getByText(/enter a reason/i)).toBeInTheDocument();
    expect(mockApiFetch.mock.calls.some(([url]) => String(url).endsWith('/suspend'))).toBe(false);

    await user.type(within(dialog).getByLabelText(/reason/i), 'Fraud');
    await user.click(within(dialog).getByRole('button', { name: /suspend organizer/i }));

    expect(await screen.findByRole('button', { name: 'Reinstate Alice Events' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const call = mockApiFetch.mock.calls.find(([url]) => String(url).endsWith('/org-active/suspend'));
    expect(JSON.parse(call![1].body as string)).toEqual({ reason: 'Fraud' });
  });

  it('keeps the dialog open and shows the ProblemDetails message when the server refuses', async () => {
    const user = userEvent.setup();
    stub({ suspend: () => json({ title: 'Invalid status change', detail: 'Only approved organizers can be suspended.' }, 409) });
    render(<AdminDashboard />);

    await user.click(await screen.findByRole('button', { name: 'Suspend Alice Events' }));
    await user.type(screen.getByLabelText(/reason/i), 'Fraud');
    await user.click(screen.getByRole('button', { name: /suspend organizer/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Only approved organizers can be suspended.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('tells the admin when their session expired (401) or they lack permission (403)', async () => {
    const user = userEvent.setup();
    stub({ suspend: () => new Response(null, { status: 401 }) });
    render(<AdminDashboard />);

    await user.click(await screen.findByRole('button', { name: 'Suspend Alice Events' }));
    await user.type(screen.getByLabelText(/reason/i), 'Fraud');
    await user.click(screen.getByRole('button', { name: /suspend organizer/i }));
    expect(await screen.findByText(/sign in again/i)).toBeInTheDocument();
  });

  it('shows a forbidden error without changing anything', async () => {
    const user = userEvent.setup();
    stub({ suspend: () => new Response(null, { status: 403 }) });
    render(<AdminDashboard />);

    await user.click(await screen.findByRole('button', { name: 'Suspend Alice Events' }));
    await user.type(screen.getByLabelText(/reason/i), 'Fraud');
    await user.click(screen.getByRole('button', { name: /suspend organizer/i }));

    expect(await screen.findByText(/do not have permission/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Account status: active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suspend Alice Events' })).toBeInTheDocument();
  });

  it('reinstates a suspended organizer in one click and refreshes the list', async () => {
    const user = userEvent.setup();
    stub();
    render(<AdminDashboard />);

    await user.click(await screen.findByRole('button', { name: 'Reinstate Sam Shows' }));

    expect(await screen.findByRole('button', { name: 'Suspend Sam Shows' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reinstate/i })).not.toBeInTheDocument();
  });

  it('shows a reinstate failure in an alert and keeps the organizer suspended', async () => {
    const user = userEvent.setup();
    stub({ reinstate: () => json({ detail: 'Identity is unavailable.' }, 503) });
    render(<AdminDashboard />);

    await user.click(await screen.findByRole('button', { name: 'Reinstate Sam Shows' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Identity is unavailable.');
    expect(screen.getByRole('button', { name: 'Reinstate Sam Shows' })).toBeEnabled();
  });

  it('shows an error when the organizer list cannot be loaded', async () => {
    stub({ organizersStatus: 503 });
    render(<AdminDashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Identity unavailable.');
  });
});