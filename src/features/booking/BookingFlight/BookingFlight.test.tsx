import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fixtureCities, fixtureFlights } from '@shared/test/fixtures';
import { TestProviders } from '@shared/test/providers';
import { BookingFlight } from './BookingFlight';

function normalize(value: string | null | undefined) {
  return (value ?? '').replace(/\u00a0|\u202f/g, ' ');
}

describe('BookingFlight', () => {
  const flight = fixtureFlights[0];

  it('shows unit price without a total for one passenger', () => {
    render(
      <TestProviders cities={fixtureCities}>
        <BookingFlight flight={flight} passengers={1} />
      </TestProviders>,
    );

    expect(normalize(screen.getByTestId('booking-flight').textContent)).toContain(
      '5 400 ₽ за пассажира',
    );
    expect(
      screen.queryByTestId('booking-flight-total-price'),
    ).not.toBeInTheDocument();
  });

  it('shows total price for multiple passengers', () => {
    render(
      <TestProviders cities={fixtureCities}>
        <BookingFlight flight={flight} passengers={3} />
      </TestProviders>,
    );

    expect(
      normalize(screen.getByTestId('booking-flight-total-price').textContent),
    ).toBe('Итого: 16 200 ₽');
  });

  it('exposes origin and destination names with a direction, not a replacing route label', () => {
    render(
      <TestProviders cities={fixtureCities}>
        <BookingFlight flight={flight} passengers={1} />
      </TestProviders>,
    );

    expect(screen.getByText(flight.origin.name)).toBeInTheDocument();
    expect(screen.getByText('→')).toHaveClass('srOnly');
    expect(screen.getByText(flight.destination.name)).toBeInTheDocument();
    expect(screen.queryByLabelText('Маршрут')).not.toBeInTheDocument();
  });
});
