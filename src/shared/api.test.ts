import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { REQUEST_TIMEOUT_MS, mergeRequestHeaders, request } from './api';
import {
  ApiError,
  REQUEST_TIMEOUT_CODE,
  REQUEST_TIMEOUT_MESSAGE,
  RESPONSE_INVALID_JSON_MESSAGE,
  ResponseValidationError,
  isAbortError,
  isRequestTimeoutError,
  isTimeoutError,
} from './lib/errors';

/** Как native fetch: реджект с abort reason (TimeoutError или AbortError). */
function rejectWhenAborted(signal?: AbortSignal | null) {
  return new Promise<never>((_resolve, reject) => {
    const abort = () => {
      reject(
        signal?.reason ??
          new DOMException('The user aborted a request.', 'AbortError'),
      );
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });
  });
}

function hangingFetch(_input: RequestInfo | URL, init?: RequestInit) {
  return rejectWhenAborted(init?.signal);
}

const TestSchema = z.object({
  code: z.string(),
  name: z.string(),
});

describe('mergeRequestHeaders', () => {
  it('adds Accept by default and skips Content-Type without a body', () => {
    const headers = mergeRequestHeaders();
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Content-Type')).toBeNull();
  });

  it('adds Content-Type only when a body is present', () => {
    const headers = mergeRequestHeaders(undefined, { hasBody: true });
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('preserves headers from a Headers instance', () => {
    const headers = mergeRequestHeaders(
      new Headers({ Accept: 'text/plain', 'X-Test': '1' }),
      { hasBody: true },
    );
    expect(headers.get('Accept')).toBe('text/plain');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Test')).toBe('1');
  });

  it('preserves headers from an array of pairs', () => {
    const headers = mergeRequestHeaders(
      [
        ['Accept', 'application/xml'],
        ['X-Array', 'yes'],
      ],
      { hasBody: true },
    );
    expect(headers.get('Accept')).toBe('application/xml');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Array')).toBe('yes');
  });
});

describe('request errors', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws ApiError with status and response body as cause', async () => {
    const body = { message: 'boom', code: 'server_error' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(body, { status: 500 })),
    );

    const error = await request('/api/cities').catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 500,
      message: 'boom',
      cause: body,
    });
  });

  it('throws a coded timeout ApiError when the request times out, not AbortError', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(hangingFetch));

    try {
      const pending = request('/api/cities').catch((err: unknown) => err);
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
      const error = await pending;

      expect(error).toBeInstanceOf(ApiError);
      expect(isRequestTimeoutError(error)).toBe(true);
      expect(error).toMatchObject({
        code: REQUEST_TIMEOUT_CODE,
        message: REQUEST_TIMEOUT_MESSAGE,
      });
      expect((error as ApiError).status).toBeUndefined();
      expect(isAbortError(error)).toBe(false);
      expect(isTimeoutError((error as ApiError).cause)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rethrows AbortError when the caller aborts before timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(hangingFetch));
    const caller = new AbortController();
    const pending = request('/api/cities', { signal: caller.signal });
    caller.abort();

    const error = await pending.catch((err: unknown) => err);
    expect(isAbortError(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ApiError);
  });

  it('rethrows AbortError when reading the error body is aborted', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => {
          throw abortError;
        },
      })),
    );

    await expect(request('/api/cities')).rejects.toBe(abortError);
  });

  it('maps TimeoutError while reading the error body to a coded timeout ApiError', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => ({
        ok: false,
        status: 500,
        json: () => rejectWhenAborted(init?.signal),
      })),
    );

    try {
      const pending = request('/api/cities').catch((err: unknown) => err);
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
      const error = await pending;

      expect(error).toBeInstanceOf(ApiError);
      expect(isRequestTimeoutError(error)).toBe(true);
      expect((error as ApiError).status).toBeUndefined();
      expect(isTimeoutError((error as ApiError).cause)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('disposes merged abort listeners only after the body is read', async () => {
    const removeSpy = vi.spyOn(AbortSignal.prototype, 'removeEventListener');
    let resolveJson!: (value: unknown) => void;
    const caller = new AbortController();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: () =>
          new Promise((resolve) => {
            resolveJson = resolve;
          }),
      })),
    );

    const pending = request('/api/cities', { signal: caller.signal });

    await vi.waitFor(() => {
      expect(resolveJson).toBeTypeOf('function');
    });

    const abortRemovesWhilePending = removeSpy.mock.calls.filter(
      (call) => call[0] === 'abort',
    );
    expect(abortRemovesWhilePending).toHaveLength(0);

    resolveJson([{ code: 'MOW', name: 'Москва', country: 'Россия' }]);
    await pending;

    expect(removeSpy.mock.calls.some((call) => call[0] === 'abort')).toBe(true);
    removeSpy.mockRestore();
  });
});

describe('request schema validation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses JSON with the provided schema', async () => {
    const body = { code: 'MOW', name: 'Москва' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(body)),
    );

    await expect(
      request('/api/cities', { schema: TestSchema }),
    ).resolves.toEqual(body);
  });

  it('throws ResponseValidationError when JSON does not match the schema', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ code: 'MOW' })),
    );

    const error = await request('/api/cities', { schema: TestSchema }).catch(
      (err: unknown) => err,
    );

    expect(error).toBeInstanceOf(ResponseValidationError);
    expect(error).toMatchObject({
      status: 500,
      message: 'Ответ сервера не соответствует схеме',
      name: 'ResponseValidationError',
    });
    expect((error as ResponseValidationError).issues.length).toBeGreaterThan(0);
  });

  it('throws ResponseValidationError when the success body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not-json', { status: 200 })),
    );

    const error = await request('/api/cities', { schema: TestSchema }).catch(
      (err: unknown) => err,
    );

    expect(error).toBeInstanceOf(ResponseValidationError);
    expect(error).toMatchObject({
      status: 500,
      message: RESPONSE_INVALID_JSON_MESSAGE,
      name: 'ResponseValidationError',
      issues: [],
    });
  });

  it('rethrows AbortError when reading the success body is aborted', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw abortError;
        },
      })),
    );

    await expect(request('/api/cities')).rejects.toBe(abortError);
  });

  it('maps TimeoutError while reading the success body to a coded timeout ApiError', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => ({
        ok: true,
        status: 200,
        json: () => rejectWhenAborted(init?.signal),
      })),
    );

    try {
      const pending = request('/api/cities').catch((err: unknown) => err);
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
      const error = await pending;

      expect(error).toBeInstanceOf(ApiError);
      expect(isRequestTimeoutError(error)).toBe(true);
      expect((error as ApiError).status).toBeUndefined();
      expect(isTimeoutError((error as ApiError).cause)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not pass schema to fetch init', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ code: 'MOW', name: 'Москва' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await request('/api/cities', { schema: TestSchema });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/cities',
      expect.not.objectContaining({ schema: expect.anything() }),
    );
  });

  it('returns undefined for 204 without a schema', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    );

    await expect(request('/api/resource')).resolves.toBeUndefined();
  });

  it('throws ResponseValidationError for 204 when a schema is required', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    );

    const error = await request('/api/resource', { schema: TestSchema }).catch(
      (err: unknown) => err,
    );

    expect(error).toBeInstanceOf(ResponseValidationError);
    expect(error).toMatchObject({
      status: 500,
      name: 'ResponseValidationError',
    });
  });
});
