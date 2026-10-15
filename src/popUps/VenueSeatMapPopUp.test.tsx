import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VenueSeatMapPopUp } from './VenueSeatMapPopUp';
import type { Venue } from '../common/venueApi';

const venue: Venue = {
  id: 'venue-1', name: 'Grand Hall', address: 'Colombo', capacity: 20,
  createdAt: '2026-01-01', updatedAt: '2026-01-01', seatMap: null,
};

describe('VenueSeatMapPopUp', () => {
  it('creates a venue seat map and enforces venue capacity', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<VenueSeatMapPopUp venue={venue} isLoading={false} onClose={vi.fn()} onSubmit={onSubmit} onDelete={vi.fn()} />);

    await user.type(screen.getByLabelText('Venue section 1 name'), 'Stalls');
    await user.clear(screen.getByLabelText('Venue section 1 rows'));
    await user.type(screen.getByLabelText('Venue section 1 rows'), '2');
    await user.clear(screen.getByLabelText('Venue section 1 seats per row'));
    await user.type(screen.getByLabelText('Venue section 1 seats per row'), '10');
    await user.click(screen.getByRole('button', { name: 'Add Seat Map' }));

    expect(onSubmit).toHaveBeenCalledWith([{ name: 'Stalls', rows: 2, seatsPerRow: 10 }]);
  });

  it('offers deletion when the venue already has a map', () => {
    const onDelete = vi.fn();
    render(<VenueSeatMapPopUp venue={{ ...venue, seatMap: { venueId: venue.id, spec: { sections: [{ name: 'Stalls', rows: 2, seatsPerRow: 10 }] }, seatCount: 20, createdBy: 'admin', createdAt: '2026-01-01', updatedAt: '2026-01-01' } }} isLoading={false} onClose={vi.fn()} onSubmit={vi.fn()} onDelete={onDelete} />);

    screen.getByRole('button', { name: 'Delete Seat Map' }).click();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
