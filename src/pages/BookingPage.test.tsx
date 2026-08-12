import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingPage } from './BookingPage';
import { FLIGHT_NOT_FOUND } from '../lib/messages';
import { fixtureFlights } from '../test/fixtures';

const fixtureFlight = fixtureFlights[0];

describe('BookingPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('disables booking submit when the flight is not found', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'not_found', message: 'missing' },
        { status: 404 },
      ),
    );

    render(
      <MemoryRouter initialEntries={['/booking/missing']}>
        <Routes>
          <Route path="/booking/:flightId" element={<BookingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight-summary')).toHaveTextContent(
        FLIGHT_NOT_FOUND,
      );
    });
    expect(screen.getByTestId('submit-booking-button')).toBeDisabled();
  });

  it('enables booking submit after the flight loads', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(fixtureFlight));

    render(
      <MemoryRouter initialEntries={['/booking/fl_1']}>
        <Routes>
          <Route path="/booking/:flightId" element={<BookingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight-summary')).toHaveTextContent(
        'Аэрофлот · SU1234',
      );
    });
    expect(screen.getByTestId('submit-booking-button')).toBeEnabled();
  });

  it('does not navigate when submit is disabled', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'not_found', message: 'missing' },
        { status: 404 },
      ),
    );

    render(
      <MemoryRouter initialEntries={['/booking/missing']}>
        <Routes>
          <Route path="/booking/:flightId" element={<BookingPage />} />
          <Route
            path="/bookings/:code/confirmation"
            element={<div data-testid="confirmation-page" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('submit-booking-button')).toBeDisabled();
    });

    await user.click(screen.getByTestId('submit-booking-button'));
    expect(screen.queryByTestId('confirmation-page')).not.toBeInTheDocument();
  });
});
