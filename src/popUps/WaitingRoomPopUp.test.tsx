import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WaitingRoomPopUp } from './WaitingRoomPopUp';

describe('WaitingRoomPopUp', () => {
  it('does not render when isOpen is false', () => {
    const mockApiFetch = vi.fn();
    const onAdmitted = vi.fn();

    render(
      <WaitingRoomPopUp
        isOpen={false}
        showId="show-123"
        apiFetch={mockApiFetch}
        onAdmitted={onAdmitted}
      />
    );

    expect(screen.queryByText("You're in the queue!")).not.toBeInTheDocument();
  });

  it('renders queue position when waiting', async () => {
    const mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        showId: 'show-123',
        customerSub: 'user-1',
        status: 'Waiting',
        position: 248,
        totalWaiting: 500,
      }),
    });

    const onAdmitted = vi.fn();

    render(
      <WaitingRoomPopUp
        isOpen={true}
        showId="show-123"
        apiFetch={mockApiFetch}
        onAdmitted={onAdmitted}
      />
    );

    expect(screen.getByText('HIGH DEMAND')).toBeInTheDocument();
    expect(screen.getByText("You're in the queue!")).toBeInTheDocument();
    expect(screen.getByText('Position in line')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('#248')).toBeInTheDocument();
    });
  });

  it('calls onAdmitted when status is Admitted with token', async () => {
    const mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        showId: 'show-123',
        customerSub: 'user-1',
        status: 'Admitted',
        position: 0,
        totalWaiting: 0,
        admissionToken: 'token-xyz',
      }),
    });

    const onAdmitted = vi.fn();

    render(
      <WaitingRoomPopUp
        isOpen={true}
        showId="show-123"
        apiFetch={mockApiFetch}
        onAdmitted={onAdmitted}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("You're admitted!")).toBeInTheDocument();
      expect(onAdmitted).toHaveBeenCalledWith('token-xyz');
    });
  });
});
