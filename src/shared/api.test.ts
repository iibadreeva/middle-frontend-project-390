import { afterEach, describe, expect, it, vi } from 'vitest';
import { mergeRequestHeaders, request } from './api';
import { ApiError } from './lib/errors';

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

    const pending = request<unknown[]>('/api/cities', { signal: caller.signal });

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
