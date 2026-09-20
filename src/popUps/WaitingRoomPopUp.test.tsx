import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { WaitingRoomPopUp } from './WaitingRoomPopUp';
import type { QueuePosition } from '../common/waitingRoomApi';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
}

const WAITING_WITH_POSITION: QueuePosition = {
  status: 'Waiting',
  position: 248,
  onSaleAt: null,
  admissionToken: null,
  admissionExpiresAt: null
};

const PRE_QUEUE: QueuePosition = {
  status: 'Waiting',
  position: null,
  onSaleAt: '2026-12-01T19:00:00Z',
  admissionToken: null,
  admissionExpiresAt: null
};

const ADMITTED: QueuePosition = {
  status: 'Admitted',
  position: null,
  onSaleAt: null,
  admissionToken: 'token-xyz',
  admissionExpiresAt: '2026-09-20T10:15:00Z'
};

const SOLD_OUT: QueuePosition = {
  status: 'SoldOut',
  position: null,
  onSaleAt: null,
  admissionToken: null,
  admissionExpiresAt: null
};

// Builds an apiFetch stub: the first call is the join POST, every call after is the
// GET .../entries/me status check, served in turn by the given responders.
function stubApiFetch(joinResponse: Response, statusResponders: Array<Response | (() => Response)>) {
  let statusCall = 0;
  return vi.fn((_url: string, options?: RequestInit) => {
    if (options?.method === 'POST') {
      return Promise.resolve(joinResponse);
    }
    const responder = statusResponders[Math.min(statusCall, statusResponders.length - 1)];
    statusCall += 1;
    return Promise.resolve(typeof responder === 'function' ? responder() : responder);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('WaitingRoomPopUp', () => {
  it('does not render when isOpen is false', () => {
    const apiFetch = vi.fn();
    render(
      <WaitingRoomPopUp isOpen={false} showId="show-1" apiFetch={apiFetch} onAdmitted={vi.fn()} />
    );

    expect(screen.queryByText(/queue/i)).not.toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('joins on open and shows the position once waiting', async () => {
    const apiFetch = stubApiFetch(jsonResponse({ showId: 'show-1', queueNumber: 300, joinedAt: '2026-09-20T09:00:00Z' }), [
      jsonResponse(WAITING_WITH_POSITION)
    ]);

    render(<WaitingRoomPopUp isOpen showId="show-1" apiFetch={apiFetch} onAdmitted={vi.fn()} />);

    expect(await screen.findByText('#248')).toBeInTheDocument();
    expect(screen.getByText(/high demand/i)).toBeInTheDocument();
  });

  it('joins exactly once even when the parent re-renders with new onAdmitted/onSoldOut closures', async () => {
    // EventDetail passes these as fresh inline arrow functions on every render (its own
    // availability polling alone re-renders it every few seconds) — a parent re-render
    // must never tear the join/poll effect down and re-join mid-wait.
    const apiFetch = stubApiFetch(jsonResponse({ showId: 'show-1', queueNumber: 300, joinedAt: '2026-09-20T09:00:00Z' }), [
      jsonResponse(WAITING_WITH_POSITION)
    ]);

    const { rerender } = render(
      <WaitingRoomPopUp isOpen showId="show-1" apiFetch={apiFetch} onAdmitted={() => {}} onSoldOut={() => {}} />
    );
    await screen.findByText('#248');

    for (let i = 0; i < 5; i++) {
      rerender(
        <WaitingRoomPopUp isOpen showId="show-1" apiFetch={apiFetch} onAdmitted={() => {}} onSoldOut={() => {}} />
      );
    }

    await waitFor(() => {
      const joinCalls = apiFetch.mock.calls.filter(([, options]) => (options as RequestInit | undefined)?.method === 'POST');
      expect(joinCalls).toHaveLength(1);
    });
  });

  it('shows the pre-queue message with the sale time when there is no number yet', async () => {
    const apiFetch = stubApiFetch(jsonResponse({ showId: 'show-1', queueNumber: null, joinedAt: '2026-09-20T09:00:00Z' }), [
      jsonResponse(PRE_QUEUE)
    ]);

    render(<WaitingRoomPopUp isOpen showId="show-1" apiFetch={apiFetch} onAdmitted={vi.fn()} />);

    expect(await screen.findByText(/pre-queue/i)).toBeInTheDocument();
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
  });

  it('shows a calm "not open yet" message (not an error) on a 404 join, using saleOpensAt', async () => {
    const apiFetch = vi.fn().mockResolvedValue(jsonResponse({ detail: 'Show has no queue open yet.' }, 404));

    render(
      <WaitingRoomPopUp
        isOpen
        showId="show-1"
        apiFetch={apiFetch}
        saleOpensAt="2026-12-01T19:00:00Z"
        onAdmitted={vi.fn()}
      />
    );

    expect(await screen.findByText('Not open yet')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('calls onAdmitted with the token and expiry once the status turns Admitted', async () => {
    const apiFetch = stubApiFetch(jsonResponse({ showId: 'show-1', queueNumber: 300, joinedAt: '2026-09-20T09:00:00Z' }), [
      jsonResponse(ADMITTED)
    ]);
    const onAdmitted = vi.fn();

    render(<WaitingRoomPopUp isOpen showId="show-1" apiFetch={apiFetch} onAdmitted={onAdmitted} />);

    await screen.findByText("You're in!");
    expect(onAdmitted).toHaveBeenCalledWith('token-xyz', '2026-09-20T10:15:00Z');
  });

  it('calls onSoldOut and stops polling once the queue closes', async () => {
    vi.useFakeTimers();
    const apiFetch = stubApiFetch(jsonResponse({ showId: 'show-1', queueNumber: 300, joinedAt: '2026-09-20T09:00:00Z' }), [
      jsonResponse(WAITING_WITH_POSITION),
      jsonResponse(SOLD_OUT)
    ]);
    const onSoldOut = vi.fn();

    render(<WaitingRoomPopUp isOpen showId="show-1" apiFetch={apiFetch} onAdmitted={vi.fn()} onSoldOut={onSoldOut} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(onSoldOut).toHaveBeenCalledTimes(1);
    expect(screen.getByText('This show sold out')).toBeInTheDocument();

    const callsSoFar = apiFetch.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    // No further status calls after sold-out — a closed queue has nothing left to poll.
    expect(apiFetch.mock.calls.length).toBe(callsSoFar);
  });

  it('polls on a jittered interval between 3 and 6 seconds, never a fixed tick', async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const apiFetch = stubApiFetch(jsonResponse({ showId: 'show-1', queueNumber: 300, joinedAt: '2026-09-20T09:00:00Z' }), [
      jsonResponse(WAITING_WITH_POSITION)
    ]);

    render(<WaitingRoomPopUp isOpen showId="show-1" apiFetch={apiFetch} onAdmitted={vi.fn()} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Run enough ticks to see real spread, not just one lucky value.
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000);
      });
    }

    const delays = setTimeoutSpy.mock.calls
      .map(([, delay]) => delay as number)
      .filter((delay) => typeof delay === 'number' && delay >= 1000);

    expect(delays.length).toBeGreaterThan(5);
    for (const delay of delays) {
      expect(delay).toBeGreaterThanOrEqual(3000);
      expect(delay).toBeLessThanOrEqual(6000);
    }
    // Not every delay is identical — this is jitter, not a fixed tick.
    expect(new Set(delays).size).toBeGreaterThan(1);
  });

  it('stops polling while the tab is hidden and resumes immediately when it is shown again', async () => {
    vi.useFakeTimers();
    const apiFetch = stubApiFetch(jsonResponse({ showId: 'show-1', queueNumber: 300, joinedAt: '2026-09-20T09:00:00Z' }), [
      jsonResponse(WAITING_WITH_POSITION)
    ]);

    render(<WaitingRoomPopUp isOpen showId="show-1" apiFetch={apiFetch} onAdmitted={vi.fn()} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const callsWhileVisible = apiFetch.mock.calls.length;

    await act(async () => {
      setVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(apiFetch.mock.calls.length).toBe(callsWhileVisible);

    await act(async () => {
      setVisibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(apiFetch.mock.calls.length).toBe(callsWhileVisible + 1);
  });

  it('stops polling on unmount', async () => {
    vi.useFakeTimers();
    const apiFetch = stubApiFetch(jsonResponse({ showId: 'show-1', queueNumber: 300, joinedAt: '2026-09-20T09:00:00Z' }), [
      jsonResponse(WAITING_WITH_POSITION)
    ]);

    const { unmount } = render(<WaitingRoomPopUp isOpen showId="show-1" apiFetch={apiFetch} onAdmitted={vi.fn()} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const callsBeforeUnmount = apiFetch.mock.calls.length;

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(apiFetch.mock.calls.length).toBe(callsBeforeUnmount);
  });
});
