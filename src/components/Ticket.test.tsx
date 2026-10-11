import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Ticket } from './Ticket';

const event = { name: 'Arijit Singh Live', date: '2026-12-01', time: '19:00', categoryName: 'VIP' };
const ticket = { uniqueCode: 'TKT-1', price: 120, orderId: 'order-1' };

describe('Ticket', () => {
  it('shows the section, row and seat of a seated ticket', () => {
    render(<Ticket eventDetails={event} ticketDetails={{ ...ticket, seat: { section: 'Front', row: 'B', number: 7 } }} />);

    expect(screen.getByLabelText('Seat')).toHaveTextContent('Section Front · Row B · Seat 7');
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('shows no seat line for a general admission ticket', () => {
    render(<Ticket eventDetails={event} ticketDetails={ticket} />);

    expect(screen.queryByLabelText('Seat')).not.toBeInTheDocument();
  });

  it('keeps the seat on a cancelled ticket and marks it cancelled', () => {
    render(<Ticket eventDetails={event} ticketDetails={{ ...ticket, voidedAt: '2026-10-11T10:00:00Z', seat: { section: 'Hall', row: 'A', number: 1 } }} />);

    expect(screen.getByLabelText('Seat')).toHaveTextContent('Hall');
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });
});
