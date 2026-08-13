import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fixtureFlights } from '../../test/fixtures';
import { BookingFlight } from './BookingFlight';

function normalize(value: string | null | undefined) {
  return (value ?? '').replace(/\u00a0|\u202f/g, ' ');
}

describe('BookingFlight', () => {
  const flight = fixtureFlights[0];

  it('shows unit price without a total for one passenger', () => {
    render(<BookingFlight flight={flight} passengers={1} />);

    expect(normalize(screen.getByTestId('booking-flight').textContent)).toContain(
      '5 400 ₽ за пассажира',
    );
    expect(
      screen.queryByTestId('booking-flight-total-price'),
    ).not.toBeInTheDocument();
  });

  it('shows total price for multiple passengers', () => {
    render(<BookingFlight flight={flight} passengers={3} />);

    expect(
      normalize(screen.getByTestId('booking-flight-total-price').textContent),
    ).toBe('Итого: 16 200 ₽');
  });
});
