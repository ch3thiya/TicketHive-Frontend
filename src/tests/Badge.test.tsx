import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/Badge';

describe('Badge Component', () => {
  it('renders badge children text correctly', () => {
    render(<Badge variant="blue">Concert</Badge>);
    expect(screen.getByText('Concert')).toBeDefined();
  });

  it('applies uppercase styling when uppercase prop is true', () => {
    const { container } = render(<Badge variant="yellow" uppercase={true}>Trending</Badge>);
    expect(container.firstChild).toHaveClass('uppercase');
  });

  it('renders correctly with default props', () => {
    const { container } = render(<Badge>Live</Badge>);
    expect(container.textContent).toBe('Live');
  });
});
