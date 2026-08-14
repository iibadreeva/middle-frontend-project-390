import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { City, Flight } from '../../api';
import { fixtureCities, fixtureFlights } from '../../test/fixtures';
import { TestProviders } from '../../test/providers';
import { FlightCard } from './FlightCard';

const flight = fixtureFlights[0];

function renderCard(
  props: {
    flight?: Flight;
    passengers?: number;
    cities?: readonly City[];
  } = {},
) {
  return render(
    <TestProviders cities={props.cities ?? fixtureCities}>
      <MemoryRouter>
        <FlightCard
          flight={props.flight ?? flight}
          passengers={props.passengers ?? 1}
        />
      </MemoryRouter>
    </TestProviders>,
  );
}

function normalize(value: string | null): string {
  return (value ?? '').replace(/\u00a0|\u202f/g, ' ');
}

describe('FlightCard', () => {
  it('labels the price as per-passenger', () => {
    renderCard();

    const price = normalize(screen.getByTestId('flight-price').textContent);
    expect(price).toContain('5 400 ₽');
    expect(price).toContain('за пассажира');
  });

  it('shows the total for more than one passenger', () => {
    renderCard({ passengers: 3 });

    expect(
      normalize(screen.getByTestId('flight-total-price').textContent),
    ).toContain('16 200 ₽');
  });

  it('omits the total for a single passenger', () => {
    renderCard({ passengers: 1 });

    expect(screen.queryByTestId('flight-total-price')).not.toBeInTheDocument();
  });

  it('formats duration in hours and minutes', () => {
    renderCard();

    expect(screen.getByTestId('flight-duration')).toHaveTextContent(
      '1 ч 25 мин',
    );
  });

  it('shows available seats', () => {
    renderCard();

    expect(screen.getByTestId('flight-seats')).toHaveTextContent('42');
  });

  it('warns when seats are fewer than requested passengers', () => {
    renderCard({ flight: { ...flight, seatsAvailable: 2 }, passengers: 3 });

    expect(screen.getByTestId('flight-seats-warning')).toBeInTheDocument();
  });

  it('disables booking when seats are fewer than requested passengers', () => {
    renderCard({ flight: { ...flight, seatsAvailable: 2 }, passengers: 3 });

    const book = screen.getByTestId('book-flight');
    expect(book).toBeDisabled();
    expect(book).not.toHaveAttribute('href');
  });

  it('keeps booking enabled when seats are enough', () => {
    renderCard({ passengers: 3 });

    const book = screen.getByTestId('book-flight');
    expect(book).toBeEnabled();
    expect(book).toHaveAttribute('href', `/booking/${flight.id}`);
  });

  it('has no warning when seats are enough', () => {
    renderCard({ passengers: 3 });

    expect(
      screen.queryByTestId('flight-seats-warning'),
    ).not.toBeInTheDocument();
  });

  it('formats departure and arrival in airport-local timezones', () => {
    renderCard({
      flight: {
        ...flight,
        origin: { code: 'MOW', name: 'Москва', country: 'Россия' },
        destination: {
          code: 'SVX',
          name: 'Екатеринбург',
          country: 'Россия',
        },
        departureAt: '2026-07-01T08:00:00Z',
        arrivalAt: '2026-07-01T10:00:00Z',
      },
    });

    const departure = screen.getByTestId('flight-departure').textContent ?? '';
    const arrival = screen.getByTestId('flight-arrival').textContent ?? '';

    expect(departure).toMatch(/MSK$/);
    expect(arrival).toMatch(/YEKT$/);
    expect(departure).not.toBe(arrival);
  });

  it('prefers cities-list timeZone over the embedded flight city', () => {
    renderCard({
      flight: {
        ...flight,
        origin: {
          code: 'SVX',
          name: 'Екатеринбург',
          country: 'Россия',
          timeZone: 'Europe/Moscow',
        },
        departureAt: '2026-07-01T08:00:00Z',
        arrivalAt: '2026-07-01T10:00:00Z',
      },
      cities: [
        {
          code: 'SVX',
          name: 'Екатеринбург',
          timeZone: 'Asia/Yekaterinburg',
        },
      ],
    });

    expect(screen.getByTestId('flight-departure').textContent).toMatch(/YEKT$/);
  });
});
