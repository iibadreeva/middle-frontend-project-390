import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { City } from '@entities/city';
import type { Flight } from '@entities/flight';
import { fixtureCities, fixtureFlights } from '@shared/test/fixtures';
import { TestProviders } from '@shared/test/providers';
import { FlightResults } from './FlightResults';

const cardBehavior = { boom: true };
const citiesState: { current: City[] } = { current: [...fixtureCities] };

vi.mock('@entities/city', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@entities/city')>();
  return {
    ...actual,
    useCities: () => ({
      cities: citiesState.current,
      notice: null,
      ready: true,
    }),
  };
});

vi.mock('../FlightCard/FlightCard', () => ({
  FlightCardContent: ({
    flight,
    passengers,
  }: {
    flight: Flight;
    passengers: number;
  }) => {
    if (flight.id === 'fl_boom' && cardBehavior.boom) {
      throw new Error('card boom');
    }
    return (
      <div data-testid="flight-result-item">
        {flight.id}:{passengers}:{flight.price.amount}
      </div>
    );
  },
}));

const boomFlight: Flight = { ...fixtureFlights[0], id: 'fl_boom' };
const okFlight = fixtureFlights[1];

describe('FlightResults card isolation', () => {
  beforeEach(() => {
    cardBehavior.boom = true;
    citiesState.current = [...fixtureCities];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isolates a throwing card and recovers after retry when the fault is cleared', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('flight-card-error')).toBeInTheDocument();
    expect(screen.getByTestId('flight-result-item')).toHaveTextContent('fl_2');

    cardBehavior.boom = false;
    await user.click(screen.getByTestId('flight-card-error-retry'));

    expect(screen.queryByTestId('flight-card-error')).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId('flight-result-item').map((node) => node.textContent),
    ).toEqual(['fl_boom:1:5400', 'fl_2:1:3200']);
  });

  it('keeps the card fallback when retry cannot clear a deterministic fault', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('flight-card-error')).toBeInTheDocument();

    await user.click(screen.getByTestId('flight-card-error-retry'));

    expect(screen.getByTestId('flight-card-error')).toBeInTheDocument();
    expect(screen.getByTestId('flight-result-item')).toHaveTextContent('fl_2');
  });

  it('resets the card fallback when passengers change and the fault is cleared', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('flight-card-error')).toBeInTheDocument();

    cardBehavior.boom = false;
    rerender(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={2}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.queryByTestId('flight-card-error')).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId('flight-result-item').map((node) => node.textContent),
    ).toEqual(['fl_boom:2:5400', 'fl_2:2:3200']);
  });

  it('resets the card fallback when flight data changes and the fault is cleared', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('flight-card-error')).toBeInTheDocument();

    cardBehavior.boom = false;
    const updatedBoom: Flight = {
      ...boomFlight,
      price: { ...boomFlight.price, amount: boomFlight.price.amount + 1 },
    };
    rerender(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[updatedBoom, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.queryByTestId('flight-card-error')).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId('flight-result-item').map((node) => node.textContent),
    ).toEqual([`fl_boom:1:${updatedBoom.price.amount}`, 'fl_2:1:3200']);
  });

  it('resets the card fallback when displayed airline name changes and the fault is cleared', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('flight-card-error')).toBeInTheDocument();

    cardBehavior.boom = false;
    const renamedBoom: Flight = {
      ...boomFlight,
      airline: { ...boomFlight.airline, name: `${boomFlight.airline.name} Renamed` },
    };
    rerender(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[renamedBoom, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.queryByTestId('flight-card-error')).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId('flight-result-item').map((node) => node.textContent),
    ).toEqual(['fl_boom:1:5400', 'fl_2:1:3200']);
  });

  it('resets the card fallback when bookHref changes and the fault is cleared', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('flight-card-error')).toBeInTheDocument();

    cardBehavior.boom = false;
    rerender(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/book/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.queryByTestId('flight-card-error')).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId('flight-result-item').map((node) => node.textContent),
    ).toEqual(['fl_boom:1:5400', 'fl_2:1:3200']);
  });

  it('logs the flight id when a card throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('flight-card-error')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(
      'FlightCard render failed (fl_boom)',
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it('resets the card fallback when city time zones change and the fault is cleared', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('flight-card-error')).toBeInTheDocument();

    cardBehavior.boom = false;
    citiesState.current = fixtureCities.map((city) =>
      city.code === boomFlight.origin.code
        ? { ...city, timeZone: 'Asia/Yekaterinburg' }
        : city,
    );
    rerender(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[boomFlight, okFlight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.queryByTestId('flight-card-error')).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId('flight-result-item').map((node) => node.textContent),
    ).toEqual(['fl_boom:1:5400', 'fl_2:1:3200']);
  });
});
