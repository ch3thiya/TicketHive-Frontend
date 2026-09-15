import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HoldConfirmationPopUp } from './HoldConfirmationPopUp';

describe('HoldConfirmationPopUp', () => {
  it('renders hold confirmation details and countdown timer', () => {
    const onProceed = vi.fn();
    const onClose = vi.fn();

    render(
      <HoldConfirmationPopUp
        isOpen={true}
        holdId="hold-123"
        categoryName="General Admission"
        quantity={2}
        totalPrice={170}
        expiresAt={new Date(Date.now() + 600000).toISOString()}
        onProceedToPayment={onProceed}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Ticket Hold Confirmed!')).toBeInTheDocument();
    expect(screen.getByText(/You are holding this ticket! Proceed to payment/i)).toBeInTheDocument();
    expect(screen.getByText('General Admission × 2')).toBeInTheDocument();
    expect(screen.getByText('$170.00')).toBeInTheDocument();
    expect(screen.getByText('Proceed to Payment')).toBeInTheDocument();
  });

  it('triggers onProceedToPayment when button is clicked', () => {
    const onProceed = vi.fn();
    const onClose = vi.fn();

    render(
      <HoldConfirmationPopUp
        isOpen={true}
        holdId="hold-123"
        categoryName="VIP Standing"
        quantity={1}
        totalPrice={180}
        expiresAt={new Date(Date.now() + 600000).toISOString()}
        onProceedToPayment={onProceed}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /proceed to payment/i }));
    expect(onProceed).toHaveBeenCalledTimes(1);
  });
});
