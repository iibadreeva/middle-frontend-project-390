import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FLIGHT_NOT_FOUND } from '../lib/messages';
import { stubBookingApiFetch } from '../test/apiFetch';
import { fixtureBooking, fixtureCities, fixtureFlights } from '../test/fixtures';
import { TestProviders } from '../test/providers';
import { createTestStore } from '../test/store';
import { BookingPage } from './BookingPage';

const fixtureFlight = fixtureFlights[0];

function RouteSwitcher() {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate('/booking/fl_2')}>
      switch flight
    </button>
  );
}

function renderBooking(path: string) {
  return render(
    <TestProviders cities={fixtureCities}>
      <MemoryRouter initialEntries={[path]}>
        <RouteSwitcher />
        <Routes>
          <Route path="/booking/:flightId" element={<BookingPage />} />
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('contact-email'), 'ivan@example.com');
  await user.type(screen.getByTestId('contact-phone'), '+79991234567');
  await user.type(screen.getByTestId('passenger-0-firstName'), 'Иван');
  await user.type(screen.getByTestId('passenger-0-lastName'), 'Петров');
  await user.type(screen.getByTestId('passenger-0-dob'), '1990-05-20');
  await user.type(screen.getByTestId('passenger-0-document'), '4509 123456');
}

describe('BookingPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows flight-not-found when the flight is missing', async () => {
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        flightById: () =>
          Response.json(
            { code: 'not_found', message: 'missing' },
            { status: 404 },
          ),
      }),
    );

    renderBooking('/booking/missing');

    await waitFor(() => {
      expect(screen.getByTestId('flight-not-found')).toHaveTextContent(
        FLIGHT_NOT_FOUND,
      );
    });
    expect(screen.queryByTestId('booking-form')).not.toBeInTheDocument();
  });

  it('shows the flight and enables submit after load', async () => {
    vi.stubGlobal('fetch', stubBookingApiFetch());

    renderBooking('/booking/fl_1');

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight')).toHaveTextContent(
        'Аэрофлот · SU1234',
      );
    });
    expect(screen.getByTestId('booking-submit')).toBeEnabled();
  });

  it('creates a booking and shows the success panel', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        createBooking: () =>
          Response.json(fixtureBooking(), { status: 201 }),
      }),
    );

    renderBooking('/booking/fl_1');

    await waitFor(() => {
      expect(screen.getByTestId('booking-submit')).toBeEnabled();
    });

    await fillValidForm(user);
    await user.click(screen.getByTestId('booking-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-success')).toBeInTheDocument();
    });
    expect(screen.getByTestId('booking-code')).toHaveTextContent('AB12CD');
    expect(screen.queryByTestId('booking-form')).not.toBeInTheDocument();
  });

  it('shows booking-error when create fails with validation', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        createBooking: () =>
          Response.json(
            { code: 'validation_error', message: 'Укажите flightId' },
            { status: 400 },
          ),
      }),
    );

    renderBooking('/booking/fl_1');

    await waitFor(() => {
      expect(screen.getByTestId('booking-submit')).toBeEnabled();
    });

    await fillValidForm(user);
    await user.click(screen.getByTestId('booking-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-error')).toHaveTextContent(
        'Укажите flightId',
      );
    });
    expect(screen.queryByTestId('booking-success')).not.toBeInTheDocument();
  });

  it('retries flight loading after an error', async () => {
    const user = userEvent.setup();
    let flightAttempts = 0;
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        flightById: () => {
          flightAttempts += 1;
          if (flightAttempts === 1) {
            return Response.json(
              { code: 'server_error', message: 'boom' },
              { status: 500 },
            );
          }
          return Response.json(fixtureFlight);
        },
      }),
    );

    renderBooking('/booking/fl_1');

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight-error')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('booking-flight-retry'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight')).toHaveTextContent(
        'Аэрофлот · SU1234',
      );
    });
    expect(screen.getByTestId('booking-submit')).toBeEnabled();
  });

  it('clears booking result when navigating to another flight', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        createBooking: () =>
          Response.json(fixtureBooking({ flight: fixtureFlights[0] }), {
            status: 201,
          }),
      }),
    );

    renderBooking('/booking/fl_1');

    await waitFor(() => {
      expect(screen.getByTestId('booking-submit')).toBeEnabled();
    });

    await fillValidForm(user);
    await user.click(screen.getByTestId('booking-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-success')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'switch flight' }));

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight')).toHaveTextContent(
        'Победа · DP202',
      );
    });
    expect(screen.queryByTestId('booking-success')).not.toBeInTheDocument();
    expect(screen.getByTestId('booking-form')).toBeInTheDocument();
  });

  it('does not keep success after leaving and returning to the same flight', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ cities: fixtureCities });
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        createBooking: () =>
          Response.json(fixtureBooking(), { status: 201 }),
      }),
    );

    const view = render(
      <TestProviders store={store}>
        <MemoryRouter initialEntries={['/booking/fl_1']}>
          <Routes>
            <Route path="/booking/:flightId" element={<BookingPage />} />
          </Routes>
        </MemoryRouter>
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('booking-submit')).toBeEnabled();
    });

    await fillValidForm(user);
    await user.click(screen.getByTestId('booking-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-success')).toBeInTheDocument();
    });

    view.unmount();

    render(
      <TestProviders store={store}>
        <MemoryRouter initialEntries={['/booking/fl_1']}>
          <Routes>
            <Route path="/booking/:flightId" element={<BookingPage />} />
          </Routes>
        </MemoryRouter>
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('booking-form')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('booking-success')).not.toBeInTheDocument();
  });
});
