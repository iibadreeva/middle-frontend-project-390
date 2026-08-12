import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { fixtureCities, fixtureFlights } from '../../test/fixtures';
import { FlightResults } from './FlightResults';

const flight = fixtureFlights[0];

describe('FlightResults', () => {
  it('marks loading and empty states as status', () => {
    const { rerender } = render(<FlightResults status="loading" />);
    expect(screen.getByTestId('flights-loading')).toHaveAttribute(
      'role',
      'status',
    );

    rerender(
      <FlightResults
        status="success"
        flights={[]}
        passengers={1}
        cities={fixtureCities}
      />,
    );
    expect(screen.getByTestId('flights-empty')).toHaveAttribute(
      'role',
      'status',
    );
  });

  it('marks error state as alert', () => {
    render(
      <FlightResults status="error" errorMessage="Не удалось выполнить поиск" />,
    );
    expect(screen.getByTestId('flights-error')).toHaveAttribute(
      'role',
      'alert',
    );
  });

  it('renders flight cards without a live region role', () => {
    render(
      <MemoryRouter>
        <FlightResults
          status="success"
          flights={[flight]}
          passengers={1}
          cities={fixtureCities}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('flight-results')).not.toHaveAttribute('role');
  });

  it('passes the passengers count down to the cards', () => {
    render(
      <MemoryRouter>
        <FlightResults
          status="success"
          flights={[flight]}
          passengers={2}
          cities={fixtureCities}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('flight-total-price')).toBeInTheDocument();
  });
});
