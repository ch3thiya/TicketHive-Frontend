import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from './EventCard';

describe('EventCard sales paused state', () => {
  it('shows a Sales paused tag when the organizer is suspended', () => {
    render(<EventCard title="Arijit Singh Live" date="1 Dec 2026" salesPaused />);

    expect(screen.getByText('Sales paused')).toBeInTheDocument();
  });

  it('shows no tag by default', () => {
    render(<EventCard title="Arijit Singh Live" date="1 Dec 2026" />);

    expect(screen.queryByText('Sales paused')).not.toBeInTheDocument();
  });

  it('keeps the card clickable so customers can still open the event page', async () => {
    const onClick = vi.fn();
    render(<EventCard title="Arijit Singh Live" date="1 Dec 2026" salesPaused onClick={onClick} />);

    await userEvent.click(screen.getByText('Arijit Singh Live'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});