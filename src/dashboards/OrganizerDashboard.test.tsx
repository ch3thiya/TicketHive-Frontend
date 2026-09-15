import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockApiFetch } = vi.hoisted(() => ({
  mockApiFetch: vi.fn()
}));

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
    apiFetch: mockApiFetch
  })
}));

import { OrganizerDashboard } from './OrganizerDashboard';

// One event with one show that already has two persisted categories — this
// is the "editing an existing show" scenario the brief is about.
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
  status: 'Draft',
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
      ticketCategories: [
        { id: 'cat-ga', name: 'General Admission', price: 50, capacity: 200 },
        { id: 'cat-vip', name: 'VIP', price: 100, capacity: 100 }
      ]
    }
  ]
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Routes the mocked apiFetch to the endpoints OrganizerDashboard actually
// calls: the events list on mount, the read-only venues list for the show
// pop-ups, and the show update itself, whose body each test inspects.
function stubApiFetch() {
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes('/api/catalog/events/my-events')) {
      return Promise.resolve(jsonResponse([EVENT]));
    }
    if (url.includes('/api/catalog/venues')) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.includes('/api/catalog/shows/show-1') && options?.method === 'PUT') {
      return Promise.resolve(jsonResponse({}));
    }
    return Promise.reject(new Error(`unexpected apiFetch url: ${url}`));
  });
}

function lastUpdateBody(): { categories: Array<Record<string, unknown>> } {
  const call = mockApiFetch.mock.calls.find(
    ([url, options]) =>
      typeof url === 'string' &&
      url.includes('/api/catalog/shows/show-1') &&
      options?.method === 'PUT'
  );
  if (!call) throw new Error('show update was never sent');
  return JSON.parse(call[1].body as string);
}

async function openEditShowForm() {
  render(<OrganizerDashboard />);

  const editButtons = await screen.findAllByRole('button', { name: 'Edit' });
  // The event card renders "Edit" (for the event) before "Edit" (for the show).
  await userEvent.click(editButtons[editButtons.length - 1]);

  return screen.getByRole('button', { name: /save show changes/i }).closest('form') as HTMLElement;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OrganizerDashboard editing an existing show', () => {
  it('sends existing category ids unchanged and omits id for a newly added category', async () => {
    stubApiFetch();
    const form = await openEditShowForm();

    await userEvent.click(within(form).getByRole('button', { name: /add tier/i }));

    const nameInputs = within(form).getAllByPlaceholderText('General Admission, VIP, Balcony');
    const priceInputs = within(form).getAllByPlaceholderText('50');
    const capacityInputs = within(form).getAllByPlaceholderText('100');

    await userEvent.type(nameInputs[nameInputs.length - 1], 'Balcony');
    await userEvent.type(priceInputs[priceInputs.length - 1], '30');
    await userEvent.type(capacityInputs[capacityInputs.length - 1], '75');

    await userEvent.click(screen.getByRole('button', { name: /save show changes/i }));

    const body = await vi.waitFor(() => lastUpdateBody());

    expect(body.categories).toEqual([
      { id: 'cat-ga', name: 'General Admission', price: 50, capacity: 200 },
      { id: 'cat-vip', name: 'VIP', price: 100, capacity: 100 },
      { name: 'Balcony', price: 30, capacity: 75 }
    ]);
    expect(body.categories[2]).not.toHaveProperty('id');
  });

  it('omits a removed category from the payload while keeping the remaining one\'s id', async () => {
    stubApiFetch();
    const form = await openEditShowForm();

    // Remove the VIP row (second category), leaving General Admission.
    const removeButtons = within(form).getAllByRole('button', { name: '✕' });
    await userEvent.click(removeButtons[removeButtons.length - 1]);

    await userEvent.click(screen.getByRole('button', { name: /save show changes/i }));

    const body = await vi.waitFor(() => lastUpdateBody());

    expect(body.categories).toEqual([
      { id: 'cat-ga', name: 'General Admission', price: 50, capacity: 200 }
    ]);
  });

  it('keeps the category id when only its price or capacity is edited', async () => {
    stubApiFetch();
    const form = await openEditShowForm();

    const capacityInputs = within(form).getAllByDisplayValue('200');
    await userEvent.clear(capacityInputs[0]);
    await userEvent.type(capacityInputs[0], '250');

    await userEvent.click(screen.getByRole('button', { name: /save show changes/i }));

    const body = await vi.waitFor(() => lastUpdateBody());

    expect(body.categories[0]).toEqual({
      id: 'cat-ga',
      name: 'General Admission',
      price: 50,
      capacity: 250
    });
  });
});
