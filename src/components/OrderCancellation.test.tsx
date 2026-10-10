import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderCancellation } from './OrderCancellation';
import { Ticket } from './Ticket';

const apiFetch = vi.fn();
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ apiFetch }) }));

describe('order cancellation', () => {
  beforeEach(() => apiFetch.mockReset());

  it('requires confirmation and presents the explicit simulated refund outcome', async () => {
    apiFetch.mockResolvedValueOnce(new Response('', { status: 404 }));
    apiFetch.mockResolvedValueOnce(Response.json({ refundStatus: 'Simulated', inventoryReturned: true, notificationStatus: 'Simulated' }));
    const onCancelled = vi.fn();
    render(<OrderCancellation orderId="order-1" onCancelled={onCancelled} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel entire order' }));
    expect(apiFetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
    expect(await screen.findByText('Full refund simulated in sandbox. No money was moved.')).toBeInTheDocument();
    expect(onCancelled).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Cancel entire order' })).not.toBeInTheDocument();
  });

  it('shows eligibility refusal and permits a retry without claiming cancellation', async () => {
    apiFetch.mockResolvedValueOnce(new Response('', { status: 404 }));
    apiFetch.mockResolvedValueOnce(Response.json({ detail: 'TicketUsed' }, { status: 409 }));
    render(<OrderCancellation orderId="order-2" />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel entire order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('TicketUsed');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm cancellation' })).toBeEnabled());
  });

  it('never displays a QR code for a voided ticket', () => {
    const { container } = render(<Ticket eventDetails={{ name: 'Show', date: '2026-12-01', time: '18:00', categoryName: 'GA' }}
      ticketDetails={{ orderId: 'order-3', uniqueCode: 'voided-code', price: 100, voidedAt: '2026-10-10T12:00:00Z' }} />);
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('exposes terminal email reconciliation without offering a resend', async () => {
    apiFetch.mockResolvedValue(Response.json({ refundStatus: 'Simulated', inventoryReturned: true, notificationStatus: 'NeedsReconciliation' }));
    render(<OrderCancellation orderId="order-4" cancelled />);
    expect(await screen.findByText('Email delivery needs support review.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resend/i })).not.toBeInTheDocument();
  });
});
