import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from '../cards/EventCard';

describe('EventCard Component', () => {
  it('renders event title, category, and date correctly', () => {
    render(
      <EventCard
        title="Wiramaya Live Concert 2026"
        category="Concert"
        date="Fri, Sep 15"
      />
    );
    expect(screen.getByText('Wiramaya Live Concert 2026')).toBeInTheDocument();
    expect(screen.getByText('Concert')).toBeInTheDocument();
    expect(screen.getByText('Fri, Sep 15')).toBeInTheDocument();
  });

  it('calls onClick handler when event card is clicked', () => {
    const handleClick = vi.fn();
    render(
      <EventCard
        title="Wiramaya Live Concert 2026"
        category="Concert"
        date="Fri, Sep 15"
        onClick={handleClick}
      />
    );
    fireEvent.click(screen.getByText('Wiramaya Live Concert 2026'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
