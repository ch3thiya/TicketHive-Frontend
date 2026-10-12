import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeatMapAdminPanel } from './SeatMapAdminPanel';

const apiFetch = vi.fn();
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ apiFetch }) }));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const request = (overrides: Record<string, unknown> = {}) => ({
  id: 'req-1',
  showId: 'show-1',
  organizerId: 'org-1',
  description: 'Stalls with 3 rows and a VIP block',
  status: 'Pending',
  rejectionReason: null,
  requestedAt: '2026-10-11T10:00:00Z',
  decidedAt: null,
  decidedBy: null,
  ...overrides,
});

const categories = [
  { id: 'vip', name: 'VIP', price: 100, capacity: 6 },
  { id: 'gen', name: 'General', price: 40, capacity: 12 },
];

const detail = (overrides: Record<string, unknown> = {}) => ({
  request: request(),
  eventName: 'Arijit Singh Live',
  showDate: '2027-01-01',
  showTime: '18:00:00',
  seatingMode: 'GA',
  categories,
  layouts: [],
  ...overrides,
});

const layout = (overrides: Record<string, unknown> = {}) => ({
  id: 'lay-1',
  showId: 'show-1',
  requestId: 'req-1',
  version: 1,
  status: 'Draft',
  spec: {
    sections: [
      { name: 'Front', categoryId: 'vip', rows: 2, seatsPerRow: 3 },
      { name: 'Hall', categoryId: 'gen', rows: 3, seatsPerRow: 4 },
    ],
  },
  seatCount: 18,
  createdBy: 'admin',
  createdAt: '2026-10-11T10:00:00Z',
  enabledAt: null,
  ...overrides,
});

let currentDetail = detail();

function route(handlers: Record<string, (init?: RequestInit) => Response | Promise<Response>> = {}) {
  apiFetch.mockReset();
  apiFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    if (handlers[key]) return handlers[key](init);
    if (key.startsWith('GET /api/catalog/admin/seat-map-requests?')) {
      return json([{ request: request(), eventName: 'Arijit Singh Live', showDate: '2027-01-01', showTime: '18:00:00', ticketTotal: 18 }]);
    }
    if (key === 'GET /api/catalog/admin/seat-map-requests/req-1') return json(currentDetail);
    throw new Error(`unexpected apiFetch ${key}`);
  });
}

beforeEach(() => {
  currentDetail = detail();
});

async function openBuilder(user: ReturnType<typeof userEvent.setup>) {
  render(<SeatMapAdminPanel />);
  await user.click(await screen.findByRole('button', { name: /build layout for arijit singh live/i }));
  await screen.findByRole('region', { name: 'Layout' });
}

async function fillValidLayout(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Section 1 name'), 'Front');
  await user.selectOptions(screen.getByLabelText('Section 1 category'), 'vip');
  await user.clear(screen.getByLabelText('Section 1 rows'));
  await user.type(screen.getByLabelText('Section 1 rows'), '2');
  await user.clear(screen.getByLabelText('Section 1 seats per row'));
  await user.type(screen.getByLabelText('Section 1 seats per row'), '3');
  await user.click(screen.getByRole('button', { name: /add section/i }));
  await user.type(screen.getByLabelText('Section 2 name'), 'Hall');
  await user.selectOptions(screen.getByLabelText('Section 2 category'), 'gen');
  await user.clear(screen.getByLabelText('Section 2 rows'));
  await user.type(screen.getByLabelText('Section 2 rows'), '3');
  await user.clear(screen.getByLabelText('Section 2 seats per row'));
  await user.type(screen.getByLabelText('Section 2 seats per row'), '4');
}

describe('SeatMapAdminPanel list', () => {
  it('lists pending requests with the event, show time and ticket total', async () => {
    route();
    render(<SeatMapAdminPanel />);

    expect(await screen.findByText('Arijit Singh Live')).toBeInTheDocument();
    expect(screen.getByText(/2027-01-01 · 18:00 · 18 tickets/)).toBeInTheDocument();
    expect(screen.getByText('Stalls with 3 rows and a VIP block')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/api/catalog/admin/seat-map-requests?status=Pending');
  });

  it('shows an empty state and reloads when the filter changes', async () => {
    route({ 'GET /api/catalog/admin/seat-map-requests?status=Pending': () => json([]) });
    const user = userEvent.setup();
    render(<SeatMapAdminPanel />);

    expect(await screen.findByText(/no seat map requests are waiting/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(apiFetch).toHaveBeenCalledWith('/api/catalog/admin/seat-map-requests');
  });

  it('explains a load failure in words', async () => {
    route({ 'GET /api/catalog/admin/seat-map-requests?status=Pending': () => json({ detail: 'Catalog is down.' }, 503) });
    render(<SeatMapAdminPanel />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Catalog is down.');
  });
});

describe('seat layout builder', () => {
  it('shows live seat counts and keeps Save disabled until every category matches', async () => {
    route();
    const user = userEvent.setup();
    await openBuilder(user);

    const save = screen.getByRole('button', { name: /save draft/i });
    expect(save).toBeDisabled();
    expect(screen.getByText('VIP: 0 of 6 seats')).toBeInTheDocument();

    await fillValidLayout(user);

    expect(screen.getByText(/VIP: 6 of 6 seats/)).toBeInTheDocument();
    expect(screen.getByText(/General: 12 of 12 seats/)).toBeInTheDocument();
    expect(screen.getByText('Total: 18 of 18 tickets')).toBeInTheDocument();
    expect(screen.getByText(/6 seats · rows A–B/)).toBeInTheDocument();
    expect(save).toBeEnabled();
  });

  it('explains a section without a category and duplicate names', async () => {
    route();
    const user = userEvent.setup();
    await openBuilder(user);

    await user.type(screen.getByLabelText('Section 1 name'), 'Front');
    await user.click(screen.getByRole('button', { name: /add section/i }));
    await user.type(screen.getByLabelText('Section 2 name'), 'front');

    expect(screen.getByText(/every section needs a ticket category/i)).toBeInTheDocument();
    expect(screen.getByText(/section names must be different/i)).toBeInTheDocument();
  });

  it('flags a category with too many seats even when the total matches', async () => {
    route();
    const user = userEvent.setup();
    await openBuilder(user);
    await user.type(screen.getByLabelText('Section 1 name'), 'Front');
    await user.selectOptions(screen.getByLabelText('Section 1 category'), 'vip');
    await user.clear(screen.getByLabelText('Section 1 rows'));
    await user.type(screen.getByLabelText('Section 1 rows'), '6');
    await user.clear(screen.getByLabelText('Section 1 seats per row'));
    await user.type(screen.getByLabelText('Section 1 seats per row'), '3');

    expect(screen.getByText('VIP: 18 of 6 seats')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled();
  });

  it('saves the draft with the sections and then reloads the versions', async () => {
    let saved: unknown;
    route({
      'POST /api/catalog/admin/seat-map-requests/req-1/layouts': (init) => {
        saved = JSON.parse(String(init?.body));
        currentDetail = detail({ layouts: [layout()] });
        return json(layout(), 201);
      },
    });
    const user = userEvent.setup();
    await openBuilder(user);
    await fillValidLayout(user);

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/draft version 1 saved/i);
    expect(saved).toEqual({
      sections: [
        { name: 'Front', categoryId: 'vip', rows: 2, seatsPerRow: 3 },
        { name: 'Hall', categoryId: 'gen', rows: 3, seatsPerRow: 4 },
      ],
    });
    expect(await screen.findByText(/version 1 · 18 seats/i)).toBeInTheDocument();
  });

  it('shows every reason when the backend refuses a layout', async () => {
    route({
      'POST /api/catalog/admin/seat-map-requests/req-1/layouts': () =>
        json(
          {
            detail: 'The layout is not valid.',
            errors: [
              { code: 'CategoryCapacityMismatch', message: "Category 'VIP' has capacity 6 but 3 seats are mapped to it." },
              { code: 'TotalCapacityMismatch', message: "The layout has 15 seats but the show's ticket total is 18." },
            ],
          },
          422,
        ),
    });
    const user = userEvent.setup();
    await openBuilder(user);
    await fillValidLayout(user);

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The layout is not valid.');
    expect(within(alert).getAllByRole('listitem')).toHaveLength(2);
    expect(alert).toHaveTextContent(/ticket total is 18/);
  });

  it('enables a draft and reports that the seats are ready', async () => {
    currentDetail = detail({ layouts: [layout()] });
    route({
      'POST /api/catalog/admin/seat-layouts/lay-1/enable': () => {
        currentDetail = detail({ request: request({ status: 'Completed' }), seatingMode: 'Seated', layouts: [layout({ status: 'Enabled' })] });
        return json(layout({ status: 'Enabled' }));
      },
    });
    const user = userEvent.setup();
    await openBuilder(user);

    await user.click(screen.getByRole('button', { name: /enable version 1/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/version 1 is enabled/i);
    expect(await within(screen.getByRole('dialog', { name: /build seat layout/i })).findByText('Completed')).toBeInTheDocument();
  });

  it.each([
    [409, { detail: 'Seats have been held or sold for this show, so its layout can no longer change.', code: 'LayoutLocked' }, /can no longer change/i],
    [503, { detail: 'Inventory is unavailable. Try again shortly.' }, /inventory is unavailable/i],
  ])('keeps the draft and explains a %s from enabling', async (status, body, message) => {
    currentDetail = detail({ layouts: [layout()] });
    route({ 'POST /api/catalog/admin/seat-layouts/lay-1/enable': () => json(body, status) });
    const user = userEvent.setup();
    await openBuilder(user);

    await user.click(screen.getByRole('button', { name: /enable version 1/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('button', { name: /enable version 1/i })).toBeEnabled();
  });

  it('starts from the current version without showing a load-map control', async () => {
    currentDetail = detail({ layouts: [layout({ version: 2, spec: { sections: [{ name: 'Balcony', categoryId: 'vip', rows: 1, seatsPerRow: 6 }] } })] });
    route();
    const user = userEvent.setup();
    await openBuilder(user);

    expect(screen.getByLabelText('Section 1 name')).toHaveValue('Balcony');
    expect(screen.queryByRole('button', { name: /load version/i })).not.toBeInTheDocument();
  });
});

describe('rejecting a request', () => {
  it('needs a reason, then records it and goes back to a refreshed list', async () => {
    let body: unknown;
    route({
      'POST /api/catalog/admin/seat-map-requests/req-1/reject': (init) => {
        body = JSON.parse(String(init?.body));
        currentDetail = detail({ request: request({ status: 'Rejected', rejectionReason: 'Venue plan missing' }) });
        return json(request({ status: 'Rejected', rejectionReason: 'Venue plan missing' }));
      },
    });
    const user = userEvent.setup();
    await openBuilder(user);

    await user.click(screen.getByRole('button', { name: /^reject request$/i }));
    await user.click(within(screen.getByRole('dialog', { name: /reject the seat map request/i })).getByRole('button', { name: /reject request/i }));
    expect(await screen.findByText(/enter a reason/i)).toBeInTheDocument();
    expect(body).toBeUndefined();

    await user.type(screen.getByLabelText(/reason/i), 'Venue plan missing');
    await user.click(within(screen.getByRole('dialog', { name: /reject the seat map request/i })).getByRole('button', { name: /reject request/i }));

    expect(body).toEqual({ reason: 'Venue plan missing' });
    expect(await screen.findByText(/rejected: venue plan missing/i)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Layout' })).not.toBeInTheDocument();
  });

  it('shows a rejected request read-only', async () => {
    currentDetail = detail({ request: request({ status: 'Rejected', rejectionReason: 'No plan' }) });
    route();
    const user = userEvent.setup();
    render(<SeatMapAdminPanel />);
    await user.click(await screen.findByRole('button', { name: /build layout for arijit singh live/i }));

    expect(await screen.findByText(/rejected: no plan/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save draft/i })).not.toBeInTheDocument();
  });
});
