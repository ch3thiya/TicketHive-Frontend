import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VenueSelect } from './VenueSelect';
import type { Venue } from '../common/venueApi';

const VENUES: Venue[] = [
  { id: 'v1', name: 'Fenway Park', address: 'Boston, MA', capacity: 37755, createdAt: '', updatedAt: '' },
  { id: 'v2', name: 'United Center', address: 'Chicago, IL', capacity: 23500, createdAt: '', updatedAt: '' }
];

describe('VenueSelect', () => {
  it('renders a select (not a free-text input) with a "No venue" option plus each venue by name and address', () => {
    render(<VenueSelect venues={VENUES} value="" onChange={vi.fn()} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'No venue' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fenway Park — Boston, MA' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'United Center — Chicago, IL' })).toBeInTheDocument();
  });

  it('preselects the venue matching the given value (edit mode)', () => {
    render(<VenueSelect venues={VENUES} value="v2" onChange={vi.fn()} />);

    expect(screen.getByRole('combobox')).toHaveValue('v2');
  });

  it('defaults to "No venue" selected when value is empty', () => {
    render(<VenueSelect venues={VENUES} value="" onChange={vi.fn()} />);

    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('calls onChange with the selected venue id when the organizer picks a venue', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<VenueSelect venues={VENUES} value="" onChange={onChange} />);

    await user.selectOptions(screen.getByRole('combobox'), 'v1');

    expect(onChange).toHaveBeenCalledWith('v1');
  });

  it('shows a non-blocking warning when the venue list failed to load, and keeps the field usable', () => {
    render(<VenueSelect venues={[]} value="" onChange={vi.fn()} error="Network error" />);

    expect(screen.getByText(/couldn't load venues: network error/i)).toBeInTheDocument();
    expect(screen.getByText(/you can still save without picking one/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeEnabled();
  });
});
