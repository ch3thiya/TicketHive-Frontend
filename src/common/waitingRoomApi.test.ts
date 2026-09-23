import { describe, it, expect, vi, afterEach } from 'vitest';
import { joinQueue, fetchQueueStatus, QueueNotFoundError, type QueueEntry, type QueuePosition } from './waitingRoomApi';

const ENTRY: QueueEntry = { showId: 'show-1', queueNumber: 42, joinedAt: '2026-09-20T10:00:00Z' };

const WAITING_STATUS: QueuePosition = {
  status: 'Waiting',
  position: 12,
  onSaleAt: null,
  admissionToken: null,
  admissionExpiresAt: null
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('joinQueue', () => {
  it('POSTs to the entries endpoint and returns the parsed entry', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(ENTRY), { status: 200 }));

    const result = await joinQueue('show-1', apiFetch);

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/waiting-room\/queues\/show-1\/entries$/),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual(ENTRY);
  });

  it('throws a QueueNotFoundError on a 404, distinct from other failures', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

    await expect(joinQueue('show-1', apiFetch)).rejects.toBeInstanceOf(QueueNotFoundError);
  });

  it('throws a plain Error (not QueueNotFoundError) with the ProblemDetails detail on a server error', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ title: 'Catalog unavailable', detail: 'Could not determine this show\'s sales rules right now. Please try again.', status: 503 }),
        { status: 503 }
      )
    );

    const rejection = joinQueue('show-1', apiFetch);
    await expect(rejection).rejects.toThrow('Could not determine this show\'s sales rules right now. Please try again.');
    await expect(rejection).rejects.not.toBeInstanceOf(QueueNotFoundError);
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response('not json', { status: 500 }));

    await expect(joinQueue('show-1', apiFetch)).rejects.toThrow('Unable to join the queue.');
  });
});

describe('fetchQueueStatus', () => {
  it('GETs the entries/me endpoint and returns the parsed status', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(WAITING_STATUS), { status: 200 }));

    const result = await fetchQueueStatus('show-1', apiFetch);

    expect(apiFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/waiting-room\/queues\/show-1\/entries\/me$/));
    expect(result).toEqual(WAITING_STATUS);
  });

  it('never treats a 404 specially — it throws like any other failure', async () => {
    // The real backend's GET .../entries/me never 404s (a customer with no entry comes
    // back as 200 NotInQueue), but this still shouldn't be mistaken for the join 404.
    const apiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Not found.' }), { status: 404 }));

    await expect(fetchQueueStatus('show-1', apiFetch)).rejects.toThrow('Not found.');
    await expect(fetchQueueStatus('show-1', apiFetch)).rejects.not.toBeInstanceOf(QueueNotFoundError);
  });

  it('throws the ProblemDetails detail on a server error', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ title: 'Server Error', detail: 'The waiting room service is unavailable.', status: 500 }), {
        status: 500
      })
    );

    await expect(fetchQueueStatus('show-1', apiFetch)).rejects.toThrow('The waiting room service is unavailable.');
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    const apiFetch = vi.fn().mockResolvedValue(new Response('not json', { status: 500 }));

    await expect(fetchQueueStatus('show-1', apiFetch)).rejects.toThrow('Unable to check your place in the queue.');
  });
});
