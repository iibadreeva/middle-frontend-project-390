import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BOOKING_CANCEL_ERROR,
  BOOKING_CREATE_ERROR,
  BOOKING_LOOKUP_ERROR,
  FLIGHT_LOAD_ERROR,
  FLIGHTS_SEARCH_ERROR,
  REQUEST_FAILED,
} from '@shared/lib/messages';
import { toast } from '@shared/ui/Toast';
import {
  rtkQueryErrorMiddleware,
  rtkQueryErrorTag,
} from './errorMiddleware';

type EndpointKind = 'query' | 'mutation';

function rejectedAction(
  endpointName: string,
  payload: unknown,
  kind: EndpointKind = 'query',
): {
  type: string;
  payload: unknown;
  meta: {
    requestId: string;
    requestStatus: 'rejected';
    rejectedWithValue: true;
    arg: { type: EndpointKind; endpointName: string };
  };
} {
  return {
    type: 'api/executeQuery/rejected',
    payload,
    meta: {
      requestId: 'req-1',
      requestStatus: 'rejected',
      rejectedWithValue: true,
      arg: { type: kind, endpointName },
    },
  };
}

function pendingAction(endpointName: string): {
  type: string;
  meta: {
    requestId: string;
    requestStatus: 'pending';
    arg: { type: 'query'; endpointName: string };
  };
} {
  return {
    type: 'api/executeQuery/pending',
    meta: {
      requestId: 'req-1',
      requestStatus: 'pending',
      arg: { type: 'query', endpointName },
    },
  };
}

describe('rtkQueryErrorMiddleware', () => {
  const next = vi.fn((action: unknown) => action);
  const run = rtkQueryErrorMiddleware({} as never)(next);

  afterEach(() => {
    vi.restoreAllMocks();
    next.mockClear();
  });

  it('toasts a 5xx lookup error with the domain message and endpoint tag', () => {
    const error = vi.spyOn(toast, 'error');
    const action = rejectedAction('getBooking', {
      status: 500,
      message: 'boom',
    });

    expect(run(action)).toBe(action);
    expect(error).toHaveBeenCalledWith(BOOKING_LOOKUP_ERROR, {
      tag: rtkQueryErrorTag('getBooking'),
    });
    expect(next).toHaveBeenCalledWith(action);
  });

  it.each([
    ['cancelBooking', BOOKING_CANCEL_ERROR, 'mutation'],
    ['createBooking', BOOKING_CREATE_ERROR, 'mutation'],
    ['getFlights', FLIGHTS_SEARCH_ERROR, 'query'],
    ['getFlight', FLIGHT_LOAD_ERROR, 'query'],
  ] as const)('maps %s to the user-facing message', (endpoint, message, kind) => {
    const error = vi.spyOn(toast, 'error');

    run(rejectedAction(endpoint, { status: 503, message: 'upstream' }, kind));

    expect(error).toHaveBeenCalledWith(message, {
      tag: rtkQueryErrorTag(endpoint),
    });
  });

  it('toasts a network error without status using the fallback message', () => {
    const error = vi.spyOn(toast, 'error');

    run(rejectedAction('unknownEndpoint', { message: 'Failed to fetch' }));

    expect(error).toHaveBeenCalledWith(REQUEST_FAILED, {
      tag: rtkQueryErrorTag('unknownEndpoint'),
    });
  });

  it('does not toast getCities errors — fallback notice lives on the search page', () => {
    const error = vi.spyOn(toast, 'error');

    run(rejectedAction('getCities', { status: 503, message: 'upstream' }));

    expect(error).not.toHaveBeenCalled();
  });

  it('does not toast HTTP 4xx errors', () => {
    const error = vi.spyOn(toast, 'error');

    run(rejectedAction('getBooking', { status: 404, message: 'missing' }));
    run(rejectedAction('createBooking', { status: 400, message: 'invalid' }));

    expect(error).not.toHaveBeenCalled();
  });

  it('does not toast abort errors', () => {
    const error = vi.spyOn(toast, 'error');

    run(
      rejectedAction('getBooking', {
        name: 'AbortError',
        message: 'Aborted',
      }),
    );

    expect(error).not.toHaveBeenCalled();
  });

  it('dismisses the endpoint toast when a matching request becomes pending', () => {
    const dismiss = vi.spyOn(toast, 'dismiss');
    const action = pendingAction('getBooking');

    expect(run(action)).toBe(action);
    expect(dismiss).toHaveBeenCalledWith(rtkQueryErrorTag('getBooking'));
    expect(next).toHaveBeenCalledWith(action);
  });

  it('does not toast rejectedWithValue without an RTK Query endpoint arg', () => {
    const error = vi.spyOn(toast, 'error');
    const action = {
      type: 'api/executeQuery/rejected',
      payload: { status: 500, message: 'boom' },
      meta: {
        requestId: 'req-1',
        requestStatus: 'rejected' as const,
        rejectedWithValue: true as const,
        arg: { endpointName: 'getBooking' },
      },
    };

    run(action);

    expect(error).not.toHaveBeenCalled();
  });

  it('passes unrelated actions through without toasting', () => {
    const error = vi.spyOn(toast, 'error');
    const action = { type: 'counter/increment' };

    expect(run(action)).toBe(action);
    expect(error).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });
});
