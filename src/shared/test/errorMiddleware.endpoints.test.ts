import { afterEach, describe, expect, it, vi } from 'vitest';
import { bookingApi } from '@entities/booking';
import { cityApi } from '@entities/city';
import { flightApi } from '@entities/flight';
import {
  BOOKING_CANCEL_ERROR,
  BOOKING_CREATE_ERROR,
  BOOKING_LOOKUP_ERROR,
  FLIGHT_LOAD_ERROR,
  FLIGHTS_SEARCH_ERROR,
} from '@shared/lib/messages';
import { toast } from '@shared/lib/toast';
import {
  rtkQueryErrorMiddleware,
  rtkQueryErrorTag,
} from '../store/errorMiddleware';

type EndpointKind = 'query' | 'mutation';

function rejectedAction(
  endpointName: string,
  payload: unknown,
  kind: EndpointKind = 'query',
) {
  return {
    type: 'api/executeQuery/rejected',
    payload,
    meta: {
      requestId: 'req-1',
      requestStatus: 'rejected' as const,
      rejectedWithValue: true as const,
      arg: { type: kind, endpointName },
    },
  };
}

describe('rtkQueryErrorMiddleware registered endpoints', () => {
  const next = vi.fn((action: unknown) => action);
  const run = rtkQueryErrorMiddleware({} as never)(next);

  afterEach(() => {
    vi.restoreAllMocks();
    next.mockClear();
  });

  it.each([
    [bookingApi.endpoints.getBooking.name, BOOKING_LOOKUP_ERROR, 'query'],
    [bookingApi.endpoints.cancelBooking.name, BOOKING_CANCEL_ERROR, 'mutation'],
    [bookingApi.endpoints.createBooking.name, BOOKING_CREATE_ERROR, 'mutation'],
    [flightApi.endpoints.getFlights.name, FLIGHTS_SEARCH_ERROR, 'query'],
    [flightApi.endpoints.getFlight.name, FLIGHT_LOAD_ERROR, 'query'],
  ] as const)(
    'maps %s to the user-facing message',
    (endpoint, message, kind) => {
      const error = vi.spyOn(toast, 'error');

      run(rejectedAction(endpoint, { status: 503, message: 'upstream' }, kind));

      expect(error).toHaveBeenCalledWith(message, {
        tag: rtkQueryErrorTag(endpoint),
      });
    },
  );

  it('does not toast getCities errors', () => {
    const error = vi.spyOn(toast, 'error');

    run(
      rejectedAction(cityApi.endpoints.getCities.name, {
        status: 503,
        message: 'upstream',
      }),
    );

    expect(error).not.toHaveBeenCalled();
  });
});
