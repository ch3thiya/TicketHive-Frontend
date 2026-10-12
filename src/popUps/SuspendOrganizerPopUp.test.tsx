import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuspendOrganizerPopUp } from './SuspendOrganizerPopUp';

function setup(props: Partial<React.ComponentProps<typeof SuspendOrganizerPopUp>> = {}) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(<SuspendOrganizerPopUp organizerName="Olive Events" onConfirm={onConfirm} onClose={onClose} {...props} />);
  return { onConfirm, onClose, user: userEvent.setup() };
}

describe('SuspendOrganizerPopUp', () => {
  it('names the organizer and explains what suspension does and does not do', () => {
    setup();

    expect(screen.getByRole('dialog', { name: /suspend olive events\?/i })).toBeInTheDocument();
    expect(screen.getByText(/cannot create, edit, publish or cancel/i)).toBeInTheDocument();
    expect(screen.getByText(/tickets already sold stay valid/i)).toBeInTheDocument();
  });

  it('focuses the reason field when it opens', () => {
    setup();

    expect(screen.getByLabelText(/reason/i)).toHaveFocus();
  });

  it('refuses to submit without a reason and says why', async () => {
    const { user, onConfirm } = setup();

    await user.click(screen.getByRole('button', { name: /suspend organizer/i }));

    expect(await screen.findByText(/enter a reason/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('treats a whitespace-only reason as missing', async () => {
    const { user, onConfirm } = setup();

    await user.type(screen.getByLabelText(/reason/i), '    ');
    await user.click(screen.getByRole('button', { name: /suspend organizer/i }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/reason/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('confirms with the trimmed reason', async () => {
    const { user, onConfirm } = setup();

    await user.type(screen.getByLabelText(/reason/i), '  Chargeback abuse  ');
    await user.click(screen.getByRole('button', { name: /suspend organizer/i }));

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith('Chargeback abuse');
  });

  it('limits the reason to 500 characters and shows a counter', async () => {
    const { user } = setup();
    const reason = screen.getByLabelText(/reason/i);

    await user.click(reason);
    await user.paste('x'.repeat(520));

    expect((reason as HTMLTextAreaElement).value).toHaveLength(500);
    expect(screen.getByText('500/500')).toBeInTheDocument();
  });

  it('closes on Cancel and on Escape', async () => {
    const { user, onClose } = setup();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('disables actions and ignores Escape while the request is in flight', async () => {
    const { user, onClose } = setup({ isLoading: true });

    expect(screen.getByRole('button', { name: /suspending/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a server error in an alert', () => {
    setup({ error: 'You do not have permission to do this.' });

    expect(screen.getByRole('alert')).toHaveTextContent('You do not have permission to do this.');
  });
});