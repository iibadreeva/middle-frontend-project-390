import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BOOKING_CREATE_ERROR,
  BOOKING_CREATE_ERROR_HINT,
  FLIGHT_LOAD_ERROR,
  FLIGHT_NOT_FOUND,
} from '@shared/lib/messages';
import { stubBookingApiFetch } from '@shared/test/apiFetch';
import { fixtureBooking, fixtureCities, fixtureFlights } from '@shared/test/fixtures';
import { TestProviders } from '@shared/test/providers';
import { createTestStore } from '@shared/test/store';
import { bookingHref, routePaths } from '../routes';
import { BookingPage } from './BookingPage';

const fixtureFlight = fixtureFlights[0];
const bookingRoutePath = `/${routePaths.booking}`;

function RouteSwitcher() {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate(bookingHref('fl_2'))}>
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
          <Route path={bookingRoutePath} element={<BookingPage />} />
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

    renderBooking(bookingHref('missing'));

    await waitFor(() => {
      expect(screen.getByTestId('flight-not-found')).toHaveTextContent(
        FLIGHT_NOT_FOUND,
      );
    });
    expect(screen.queryByTestId('booking-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });

  it('shows the flight and enables submit after load', async () => {
    vi.stubGlobal('fetch', stubBookingApiFetch());

    renderBooking(bookingHref('fl_1'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight')).toHaveTextContent(
        'Аэрофлот · SU1234',
      );
    });
    expect(screen.getByTestId('booking-submit')).toBeEnabled();
  });

  it('shows a flight skeleton while the flight is loading', async () => {
    let resolveFlight!: (response: Response) => void;
    const flightPromise = new Promise<Response>((resolve) => {
      resolveFlight = resolve;
    });

    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        flightById: () => flightPromise,
      }),
    );

    renderBooking(bookingHref('fl_1'));

    const skeleton = screen.getByTestId('booking-flight-loading');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');

    resolveFlight(Response.json(fixtureFlight));

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight')).toHaveTextContent(
        'Аэрофлот · SU1234',
      );
    });
    expect(screen.getByTestId('booking-flight')).not.toHaveAttribute(
      'aria-busy',
    );
  });

  it('creates a booking and shows the success panel', async () => {
    const user = userEvent.setup({ delay: null });
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        createBooking: () =>
          Response.json(fixtureBooking(), { status: 201 }),
      }),
    );

    renderBooking(bookingHref('fl_1'));

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
    const user = userEvent.setup({ delay: null });
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

    renderBooking(bookingHref('fl_1'));

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
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
    expect(screen.queryByTestId('booking-success')).not.toBeInTheDocument();
  });

  it('shows a toast and sticky booking-error when create fails with a server error', async () => {
    const user = userEvent.setup({ delay: null });
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        createBooking: () =>
          Response.json(
            { code: 'server_error', message: 'Request failed: 500' },
            { status: 500 },
          ),
      }),
    );

    renderBooking(bookingHref('fl_1'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-submit')).toBeEnabled();
    });

    await fillValidForm(user);
    await user.click(screen.getByTestId('booking-submit'));

    expect(await screen.findByTestId('toast-item')).toHaveTextContent(
      BOOKING_CREATE_ERROR,
    );
    await waitFor(() => {
      expect(screen.getByTestId('booking-error')).toHaveTextContent(
        BOOKING_CREATE_ERROR_HINT,
      );
    });
  });

  it('dismisses the toast when the sticky booking-error is cleared by editing', async () => {
    const user = userEvent.setup({ delay: null });
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        createBooking: () =>
          Response.json(
            { code: 'server_error', message: 'Request failed: 500' },
            { status: 500 },
          ),
      }),
    );

    renderBooking(bookingHref('fl_1'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-submit')).toBeEnabled();
    });

    await fillValidForm(user);
    await user.click(screen.getByTestId('booking-submit'));

    expect(await screen.findByTestId('toast-item')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('booking-error')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('contact-email'), 'x');

    await waitFor(() => {
      expect(screen.queryByTestId('booking-error')).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });

  it('clears the error toast after a successful retry without editing fields', async () => {
    const user = userEvent.setup({ delay: null });
    let createAttempts = 0;
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        createBooking: () => {
          createAttempts += 1;
          if (createAttempts === 1) {
            return Response.json(
              { code: 'server_error', message: 'Request failed: 500' },
              { status: 500 },
            );
          }
          return Response.json(fixtureBooking(), { status: 201 });
        },
      }),
    );

    renderBooking(bookingHref('fl_1'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-submit')).toBeEnabled();
    });

    await fillValidForm(user);
    await user.click(screen.getByTestId('booking-submit'));

    expect(await screen.findByTestId('toast-item')).toHaveTextContent(
      BOOKING_CREATE_ERROR,
    );
    await waitFor(() => {
      expect(screen.getByTestId('booking-error')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('booking-submit'));

    expect(await screen.findByTestId('booking-success')).toBeInTheDocument();
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });

  it('retries flight loading after an error', async () => {
    const user = userEvent.setup({ delay: null });
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

    renderBooking(bookingHref('fl_1'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight-error')).toBeInTheDocument();
    });
    expect(await screen.findByTestId('toast-item')).toHaveTextContent(
      FLIGHT_LOAD_ERROR,
    );
    expect(screen.getByTestId('booking-flight-error')).not.toHaveAttribute(
      'role',
      'alert',
    );

    await user.click(screen.getByTestId('booking-flight-retry'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-flight')).toHaveTextContent(
        'Аэрофлот · SU1234',
      );
    });
    expect(screen.getByTestId('booking-submit')).toBeEnabled();
  });

  it('clears booking result when navigating to another flight', async () => {
    const user = userEvent.setup({ delay: null });
    vi.stubGlobal(
      'fetch',
      stubBookingApiFetch({
        createBooking: () =>
          Response.json(fixtureBooking({ flight: fixtureFlights[0] }), {
            status: 201,
          }),
      }),
    );

    renderBooking(bookingHref('fl_1'));

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
    const user = userEvent.setup({ delay: null });
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
        <MemoryRouter initialEntries={[bookingHref('fl_1')]}>
          <Routes>
            <Route path={bookingRoutePath} element={<BookingPage />} />
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
        <MemoryRouter initialEntries={[bookingHref('fl_1')]}>
          <Routes>
            <Route path={bookingRoutePath} element={<BookingPage />} />
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
