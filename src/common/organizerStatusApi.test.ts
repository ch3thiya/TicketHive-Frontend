import { describe, it, expect, vi } from 'vitest';
import { fetchOrganizerAccessStatus } from './organizerStatusApi';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('fetchOrganizerAccessStatus', () => {
  it('reads the status from the catalog organizer route', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ status: 'suspended' }));

    const status = await fetchOrganizerAccessStatus(apiFetch);

    expect(apiFetch).toHaveBeenCalledWith('/api/catalog/organizer/status');
    expect(status).toBe('suspended');
  });

  it('reports an active organizer', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ status: 'active' }));

    expect(await fetchOrganizerAccessStatus(apiFetch)).toBe('active');
  });

  it('never treats an unknown value as suspended', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ status: 'something-else' }));

    expect(await fetchOrganizerAccessStatus(apiFetch)).toBe('active');
  });

  it('surfaces a 503 ProblemDetails detail', async () => {
    const apiFetch = vi.fn().mockResolvedValue(json({ title: 'Organizer status unavailable', detail: 'Could not verify organizer status right now.' }, 503));

    await expect(fetchOrganizerAccessStatus(apiFetch)).rejects.toThrow('Could not verify organizer status right now.');
  });
});