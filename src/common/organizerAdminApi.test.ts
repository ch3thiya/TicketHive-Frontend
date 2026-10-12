import { describe, it, expect, vi } from 'vitest';
import { ApiError } from './problemDetails';
import { fetchOrganizers, reinstateOrganizer, suspendOrganizer, type AdminOrganizer } from './organizerAdminApi';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const ORGANIZER: AdminOrganizer = {
  accountId: 'org-1',
  email: 'o@example.com',
  fullName: 'Olive Organizer',
  createdAt: '2026-01-01T00:00:00Z',
  organizationName: 'Olive Events',
  businessEmail: 'biz@example.com',
  eventType: 'Concert',
  status: 'approved',
  suspendedAt: null,
  suspensionReason: null,
};

describe('organizer admin api', () => {
  it('lists organizers from the identity admin route', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json([ORGANIZER]));

    const result = await fetchOrganizers(apiFetch);

    expect(apiFetch).toHaveBeenCalledWith('/api/identity/organizer-requests/organizers');
    expect(result).toEqual([ORGANIZER]);
  });

  it('posts the reason as JSON when suspending', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ organizerId: 'org-1', status: 'suspended', repeated: false }));

    const result = await suspendOrganizer(apiFetch, 'org-1', 'Chargeback abuse');

    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe('/api/identity/organizer-requests/organizers/org-1/suspend');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ reason: 'Chargeback abuse' });
    expect(result.status).toBe('suspended');
  });

  it('posts to the reinstate route', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ organizerId: 'org-1', status: 'approved', repeated: false }));

    const result = await reinstateOrganizer(apiFetch, 'org-1');

    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe('/api/identity/organizer-requests/organizers/org-1/reinstate');
    expect(options.method).toBe('POST');
    expect(result.status).toBe('approved');
  });

  it('turns a ProblemDetails 400 into an ApiError with the server detail', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ title: 'Invalid reason', detail: 'A reason of 1 to 500 characters is required.' }, 400));

    await expect(suspendOrganizer(apiFetch, 'org-1', ' ')).rejects.toMatchObject({
      message: 'A reason of 1 to 500 characters is required.',
      status: 400,
    });
  });

  it('turns a legacy { message } 404 into an ApiError', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ message: 'Organizer not found.' }, 404));

    await expect(reinstateOrganizer(apiFetch, 'missing')).rejects.toMatchObject({ message: 'Organizer not found.', status: 404 });
  });

  it('reports expired sessions and missing permission in plain words', async () => {
    const unauthorized = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const forbidden = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));

    await expect(fetchOrganizers(unauthorized)).rejects.toThrow(/sign in again/i);
    await expect(suspendOrganizer(forbidden, 'org-1', 'x')).rejects.toBeInstanceOf(ApiError);
    await expect(suspendOrganizer(forbidden, 'org-1', 'x')).rejects.toThrow(/do not have permission/i);
  });

  it('reports a 409 conflict with the server wording', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ title: 'Invalid status change', detail: 'Only approved organizers can be suspended.' }, 409));

    await expect(suspendOrganizer(apiFetch, 'org-1', 'x')).rejects.toThrow('Only approved organizers can be suspended.');
  });
});