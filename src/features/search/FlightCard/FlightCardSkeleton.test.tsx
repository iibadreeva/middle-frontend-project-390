import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FlightCardSkeleton } from './FlightCardSkeleton';

describe('FlightCardSkeleton', () => {
  it('renders card shell hidden from assistive tech', () => {
    const { container } = render(<FlightCardSkeleton />);

    const root = screen.getByTestId('flight-card-skeleton');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });
});
