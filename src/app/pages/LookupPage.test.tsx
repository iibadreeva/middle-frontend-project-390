import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureBooking, fixtureCities } from '@shared/test/fixtures';
import {
  BOOKING_CANCEL_CONFIRM,
  BOOKING_CANCEL_ERROR,
  BOOKING_LOOKUP_ERROR,
  BOOKING_LOOKUP_REQUIRED_ERROR,
  BOOKING_NOT_FOUND,
} from '@shared/lib/messages';
import { TestProviders } from '@shared/test/providers';
import { LookupPage } from './LookupPage';
import { routePaths } from '../routes';

function renderLookup(initialEntry = '/lookup') {
  return render(
    <TestProviders cities={fixtureCities}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path={routePaths.lookup} element={<LookupPage />} />
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  );
}

describe('LookupPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cities')) {
          return Response.json(fixtureCities);
        }
        return new Response('not found', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows the lookup form on an empty /lookup', () => {
    renderLookup();
    expect(screen.getByTestId('booking-lookup-form')).toBeInTheDocument();
    expect(screen.getByTestId('lookup-code')).toBeInTheDocument();
    expect(screen.getByTestId('lookup-lastName')).toBeInTheDocument();
    expect(screen.queryByTestId('booking-details')).not.toBeInTheDocument();
    expect(screen.queryByTestId('booking-not-found')).not.toBeInTheDocument();
  });

  it('loads booking details from query params', async () => {
    const booking = fixtureBooking();
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/cities')) {
        return Response.json(fixtureCities);
      }
      if (url.includes('/api/bookings/AB12CD')) {
        return Response.json(booking);
      }
      return new Response('not found', { status: 404 });
    });

    renderLookup(
      `/lookup?code=AB12CD&lastName=${encodeURIComponent('Петров')}`,
    );

    expect(await screen.findByTestId('booking-details')).toBeInTheDocument();
    expect(screen.getByTestId('booking-code')).toHaveTextContent('AB12CD');
    expect(screen.getByTestId('booking-status')).toHaveAttribute(
      'data-status',
      'confirmed',
    );
    expect(screen.getByTestId('cancel-booking')).toBeInTheDocument();
  });

  it('shows booking-not-found on 404', async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/cities')) {
        return Response.json(fixtureCities);
      }
      return Response.json(
        { code: 'not_found', message: 'missing' },
        { status: 404 },
      );
    });

    renderLookup('/lookup?code=WRONG1&lastName=Нет');

    expect(await screen.findByTestId('booking-not-found')).toHaveTextContent(
      BOOKING_NOT_FOUND,
    );
    expect(screen.queryByTestId('booking-details')).not.toBeInTheDocument();
  });

  it('submits the form and navigates to query-backed lookup', async () => {
    const user = userEvent.setup();
    const booking = fixtureBooking();
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/cities')) {
        return Response.json(fixtureCities);
      }
      if (url.includes('/api/bookings/AB12CD')) {
        return Response.json(booking);
      }
      return new Response('not found', { status: 404 });
    });

    renderLookup();

    await user.type(screen.getByTestId('lookup-code'), 'AB12CD');
    await user.type(screen.getByTestId('lookup-lastName'), 'Петров');
    await user.click(screen.getByTestId('lookup-submit'));

    expect(await screen.findByTestId('booking-details')).toBeInTheDocument();
  });

  it('shows lookup-form-error when code or lastName is empty', async () => {
    const user = userEvent.setup();
    renderLookup();

    await user.click(screen.getByTestId('lookup-submit'));

    expect(screen.getByTestId('lookup-form-error')).toHaveTextContent(
      BOOKING_LOOKUP_REQUIRED_ERROR,
    );
    expect(screen.queryByTestId('booking-details')).not.toBeInTheDocument();
  });

  it('shows booking-cancel-error and toast when cancel fails', async () => {
    const user = userEvent.setup();
    const booking = fixtureBooking();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL, init) => {
      const url = String(input);
      if (url.includes('/api/cities')) {
        return Response.json(fixtureCities);
      }
      if (url.includes('/cancel') && init?.method === 'POST') {
        return Response.json(
          { code: 'server_error', message: 'fail' },
          { status: 500 },
        );
      }
      if (url.includes('/api/bookings/AB12CD')) {
        return Response.json(booking);
      }
      return new Response('not found', { status: 404 });
    });

    renderLookup(
      `/lookup?code=AB12CD&lastName=${encodeURIComponent('Петров')}`,
    );

    expect(await screen.findByTestId('booking-details')).toBeInTheDocument();
    await user.click(screen.getByTestId('cancel-booking'));

    expect(window.confirm).toHaveBeenCalledWith(BOOKING_CANCEL_CONFIRM);
    expect(await screen.findByTestId('booking-cancel-error')).toHaveTextContent(
      BOOKING_CANCEL_ERROR,
    );
    expect(await screen.findByTestId('toast-item')).toHaveTextContent(
      BOOKING_CANCEL_ERROR,
    );
    expect(screen.getByTestId('booking-status')).toHaveAttribute(
      'data-status',
      'confirmed',
    );
  });

  it('does not cancel when confirmation is dismissed', async () => {
    const user = userEvent.setup();
    const booking = fixtureBooking();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fetchMock = vi.mocked(fetch).mockImplementation(
      async (input: RequestInfo | URL, init) => {
        const url = String(input);
        if (url.includes('/api/cities')) {
          return Response.json(fixtureCities);
        }
        if (url.includes('/cancel') && init?.method === 'POST') {
          return Response.json(fixtureBooking({ status: 'cancelled' }));
        }
        if (url.includes('/api/bookings/AB12CD')) {
          return Response.json(booking);
        }
        return new Response('not found', { status: 404 });
      },
    );

    renderLookup(
      `/lookup?code=AB12CD&lastName=${encodeURIComponent('Петров')}`,
    );

    expect(await screen.findByTestId('booking-details')).toBeInTheDocument();
    const callsBefore = fetchMock.mock.calls.length;
    await user.click(screen.getByTestId('cancel-booking'));

    expect(window.confirm).toHaveBeenCalled();
    expect(
      fetchMock.mock.calls.slice(callsBefore).some(([input, init]) => {
        return (
          String(input).includes('/cancel') &&
          (init as RequestInit | undefined)?.method === 'POST'
        );
      }),
    ).toBe(false);
    expect(screen.getByTestId('booking-status')).toHaveAttribute(
      'data-status',
      'confirmed',
    );
  });

  it('retries lookup via booking-lookup-retry after a server error', async () => {
    const user = userEvent.setup();
    const booking = fixtureBooking();
    vi.mocked(fetch)
      .mockImplementationOnce(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cities')) {
          return Response.json(fixtureCities);
        }
        return Response.json(
          { code: 'server_error', message: 'boom' },
          { status: 500 },
        );
      })
      .mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cities')) {
          return Response.json(fixtureCities);
        }
        if (url.includes('/api/bookings/AB12CD')) {
          return Response.json(booking);
        }
        return new Response('not found', { status: 404 });
      });

    renderLookup(
      `/lookup?code=AB12CD&lastName=${encodeURIComponent('Петров')}`,
    );

    expect(await screen.findByTestId('booking-lookup-error')).toHaveTextContent(
      BOOKING_LOOKUP_ERROR,
    );
    expect(await screen.findByTestId('toast-item')).toHaveTextContent(
      BOOKING_LOOKUP_ERROR,
    );

    await user.click(screen.getByTestId('booking-lookup-retry'));

    expect(await screen.findByTestId('booking-details')).toBeInTheDocument();
  });

  it('refetches when submitting the same lookup after an error', async () => {
    const user = userEvent.setup();
    const booking = fixtureBooking();
    let bookingCalls = 0;
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/cities')) {
        return Response.json(fixtureCities);
      }
      if (url.includes('/api/bookings/AB12CD')) {
        bookingCalls += 1;
        if (bookingCalls === 1) {
          return Response.json(
            { code: 'server_error', message: 'boom' },
            { status: 500 },
          );
        }
        return Response.json(booking);
      }
      return new Response('not found', { status: 404 });
    });

    renderLookup(
      `/lookup?code=AB12CD&lastName=${encodeURIComponent('Петров')}`,
    );

    expect(await screen.findByTestId('booking-lookup-error')).toBeInTheDocument();
    await user.click(screen.getByTestId('lookup-submit'));

    expect(await screen.findByTestId('booking-details')).toBeInTheDocument();
    expect(bookingCalls).toBeGreaterThanOrEqual(2);
  });
});
