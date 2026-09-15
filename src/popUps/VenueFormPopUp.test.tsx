import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VenueFormPopUp } from './VenueFormPopUp';

const noop = () => {};

describe('VenueFormPopUp validation', () => {
  it('rejects empty name and address without calling onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <VenueFormPopUp isOpen onClose={noop} onSubmit={onSubmit} mode="create" isLoading={false} />
    );

    await user.type(screen.getByLabelText(/capacity/i), '100');
    await user.click(screen.getByRole('button', { name: /add venue/i }));

    expect(await screen.findByText('Venue name is required.')).toBeInTheDocument();
    expect(screen.getByText('Address is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(['0', '-5', 'abc'])('rejects a capacity of "%s" without calling onSubmit', async (badCapacity) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <VenueFormPopUp isOpen onClose={noop} onSubmit={onSubmit} mode="create" isLoading={false} />
    );

    await user.type(screen.getByLabelText(/venue name/i), 'Fenway Park');
    await user.type(screen.getByLabelText(/address/i), 'Boston, MA');
    await user.type(screen.getByLabelText(/capacity/i), badCapacity);
    await user.click(screen.getByRole('button', { name: /add venue/i }));

    expect(await screen.findByText('Capacity must be a positive whole number.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed name/address and the parsed capacity on valid input', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <VenueFormPopUp isOpen onClose={noop} onSubmit={onSubmit} mode="create" isLoading={false} />
    );

    await user.type(screen.getByLabelText(/venue name/i), '  Fenway Park  ');
    await user.type(screen.getByLabelText(/address/i), '  Boston, MA  ');
    await user.type(screen.getByLabelText(/capacity/i), '37755');
    await user.click(screen.getByRole('button', { name: /add venue/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Fenway Park',
      address: 'Boston, MA',
      capacity: 37755
    });
  });

  it('pre-fills fields from initialValues in edit mode', () => {
    render(
      <VenueFormPopUp
        isOpen
        onClose={noop}
        onSubmit={noop}
        mode="edit"
        initialValues={{ name: 'Fenway Park', address: 'Boston, MA', capacity: 37755 }}
        isLoading={false}
      />
    );

    expect(screen.getByLabelText(/venue name/i)).toHaveValue('Fenway Park');
    expect(screen.getByLabelText(/address/i)).toHaveValue('Boston, MA');
    expect(screen.getByLabelText(/capacity/i)).toHaveValue('37755');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows a server-side error message when provided', () => {
    render(
      <VenueFormPopUp
        isOpen
        onClose={noop}
        onSubmit={noop}
        mode="create"
        isLoading={false}
        error="A venue with this name already exists."
      />
    );

    expect(screen.getByText('A venue with this name already exists.')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <VenueFormPopUp isOpen={false} onClose={noop} onSubmit={noop} mode="create" isLoading={false} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
