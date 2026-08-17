import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { fixtureCities, fixtureFlights } from '@shared/test/fixtures';
import { TestProviders } from '@shared/test/providers';
import { FlightResults } from './FlightResults';

const flight = fixtureFlights[0];

describe('FlightResults', () => {
  it('marks loading and empty states as status', () => {
    const { rerender } = render(<FlightResults status="loading" />);
    const loading = screen.getByTestId('flights-loading');
    expect(loading).toHaveAttribute('role', 'status');
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading).toHaveAttribute('aria-label', 'Ищем подходящие рейсы');
    expect(loading.tagName).toBe('DIV');
    expect(loading.querySelector('ul')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByTestId('flight-card-skeleton')).toHaveLength(4);

    rerender(
      <FlightResults
        status="success"
        flights={[]}
        passengers={1}
        getBookHref={(id) => `/booking/${id}`}
      />,
    );
    expect(screen.getByTestId('flights-empty')).toHaveAttribute(
      'role',
      'status',
    );
  });

  it('does not mark error state as alert — the global toast announces 5xx', () => {
    render(
      <FlightResults status="error" errorMessage="Не удалось выполнить поиск" />,
    );
    expect(screen.getByTestId('flights-error')).not.toHaveAttribute('role');
  });

  it('renders flight cards without a live region role', () => {
    render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[flight]}
            passengers={1}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );
    expect(screen.getByTestId('flight-results')).not.toHaveAttribute('role');
  });

  it('passes the passengers count down to the cards', () => {
    render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter>
          <FlightResults
            status="success"
            flights={[flight]}
            passengers={2}
            getBookHref={(id) => `/booking/${id}`}
          />
        </MemoryRouter>
      </TestProviders>,
    );
    expect(screen.getByTestId('flight-total-price')).toBeInTheDocument();
  });
});
