import { afterEach, describe, expect, it, vi } from 'vitest';
import { REQUEST_FAILED } from '@shared/lib/messages';
import { toast } from '@shared/lib/toast';
import { rtkQueryErrorMiddleware, rtkQueryErrorTag } from './errorMiddleware';
import {
  registerQueryErrorPolicy,
  resetQueryErrorPolicies,
} from './queryErrorPolicy';

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
    resetQueryErrorPolicies();
    vi.restoreAllMocks();
    next.mockClear();
  });

  it('toasts a 5xx error with the registered message and endpoint tag', () => {
    registerQueryErrorPolicy('lookup', { message: 'Lookup failed' });
    const error = vi.spyOn(toast, 'error');
    const action = rejectedAction('lookup', {
      status: 500,
      message: 'boom',
    });

    expect(run(action)).toBe(action);
    expect(error).toHaveBeenCalledWith('Lookup failed', {
      tag: rtkQueryErrorTag('lookup'),
    });
    expect(next).toHaveBeenCalledWith(action);
  });

  it('toasts a network error without status using the fallback message', () => {
    const error = vi.spyOn(toast, 'error');

    run(rejectedAction('unknownEndpoint', { message: 'Failed to fetch' }));

    expect(error).toHaveBeenCalledWith(REQUEST_FAILED, {
      tag: rtkQueryErrorTag('unknownEndpoint'),
    });
  });

  it('does not toast silent endpoints', () => {
    registerQueryErrorPolicy('getCities', { silent: true });
    const error = vi.spyOn(toast, 'error');

    run(rejectedAction('getCities', { status: 503, message: 'upstream' }));

    expect(error).not.toHaveBeenCalled();
  });

  it('toasts ResponseValidationError like other 5xx errors', () => {
    registerQueryErrorPolicy('search', { message: 'Search failed' });
    const error = vi.spyOn(toast, 'error');

    run(
      rejectedAction('search', {
        status: 500,
        message: 'Ответ сервера не соответствует схеме',
        name: 'ResponseValidationError',
      }),
    );

    expect(error).toHaveBeenCalledWith('Search failed', {
      tag: rtkQueryErrorTag('search'),
    });
  });

  it('does not toast a silent endpoint ResponseValidationError', () => {
    registerQueryErrorPolicy('getCities', { silent: true });
    const error = vi.spyOn(toast, 'error');

    run(
      rejectedAction('getCities', {
        status: 500,
        message: 'Ответ сервера не соответствует схеме',
        name: 'ResponseValidationError',
      }),
    );

    expect(error).not.toHaveBeenCalled();
  });

  it('does not toast HTTP 4xx errors', () => {
    registerQueryErrorPolicy('lookup', { message: 'Lookup failed' });
    const error = vi.spyOn(toast, 'error');

    run(rejectedAction('lookup', { status: 404, message: 'missing' }));
    run(
      rejectedAction('create', { status: 400, message: 'invalid' }, 'mutation'),
    );
    run(rejectedAction('lookup', { status: 408, message: 'timeout' }));

    expect(error).not.toHaveBeenCalled();
  });

  it('toasts a client timeout by code even without an HTTP status', () => {
    registerQueryErrorPolicy('lookup', { message: 'Lookup failed' });
    const error = vi.spyOn(toast, 'error');

    run(
      rejectedAction('lookup', {
        code: 'timeout',
        message: 'Request timed out',
        name: 'ApiError',
      }),
    );

    expect(error).toHaveBeenCalledWith('Lookup failed', {
      tag: rtkQueryErrorTag('lookup'),
    });
  });

  it('toasts a client timeout even if a 4xx status was attached by mistake', () => {
    registerQueryErrorPolicy('lookup', { message: 'Lookup failed' });
    const error = vi.spyOn(toast, 'error');

    run(
      rejectedAction('lookup', {
        code: 'timeout',
        status: 408,
        message: 'Request timed out',
      }),
    );

    expect(error).toHaveBeenCalledWith('Lookup failed', {
      tag: rtkQueryErrorTag('lookup'),
    });
  });

  it('does not toast abort errors', () => {
    registerQueryErrorPolicy('lookup', { message: 'Lookup failed' });
    const error = vi.spyOn(toast, 'error');

    run(
      rejectedAction('lookup', {
        name: 'AbortError',
        message: 'Aborted',
      }),
    );

    expect(error).not.toHaveBeenCalled();
  });

  it('dismisses the endpoint toast when a matching request becomes pending', () => {
    const dismiss = vi.spyOn(toast, 'dismiss');
    const action = pendingAction('lookup');

    expect(run(action)).toBe(action);
    expect(dismiss).toHaveBeenCalledWith(rtkQueryErrorTag('lookup'));
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
        arg: { endpointName: 'lookup' },
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
