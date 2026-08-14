import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookingFlightSkeleton } from './BookingFlightSkeleton';

describe('BookingFlightSkeleton', () => {
  it('exposes booking-flight status while loading', () => {
    render(<BookingFlightSkeleton />);

    const root = screen.getByTestId('booking-flight');
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root).toHaveAttribute('aria-label', 'Загрузка рейса');
    expect(root.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4);
  });
});
