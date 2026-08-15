import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/errors';
import { isAbortError, runQuery, toQueryError } from './api';

describe('toQueryError', () => {
  it('maps ApiError with status and message', () => {
    expect(toQueryError(new ApiError('bad request', 400))).toEqual({
      status: 400,
      message: 'bad request',
    });
  });

  it('preserves numeric status on duck-typed objects with a message', () => {
    expect(
      toQueryError({ status: 503, message: 'upstream unavailable', name: 'Error' }),
    ).toEqual({
      status: 503,
      message: 'upstream unavailable',
      name: 'Error',
    });
  });

  it('keeps message and name for Error instances without inventing status', () => {
    const error = new TypeError('offline');
    expect(toQueryError(error)).toEqual({
      message: 'offline',
      name: 'TypeError',
    });
  });

  it('ignores non-numeric status on duck-typed objects', () => {
    expect(
      toQueryError({ status: 'FETCH_ERROR', message: 'network' }),
    ).toEqual({ message: 'network' });
  });

  it('stringifies unknown values', () => {
    expect(toQueryError(42)).toEqual({ message: '42' });
  });
});

describe('isAbortError', () => {
  it('detects AbortError by name', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    expect(isAbortError({ name: 'AbortError', message: 'Aborted' })).toBe(true);
  });

  it('does not treat AbortError-looking messages without the name as abort', () => {
    expect(isAbortError({ message: 'AbortError: signal is aborted' })).toBe(
      false,
    );
  });

  it('rejects unrelated errors', () => {
    expect(isAbortError(new Error('offline'))).toBe(false);
    expect(isAbortError({ name: 'TypeError', message: 'fail' })).toBe(false);
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError('AbortError')).toBe(false);
  });
});

describe('runQuery', () => {
  it('returns data on success', async () => {
    const signal = new AbortController().signal;
    await expect(runQuery(signal, async () => 42)).resolves.toEqual({
      data: 42,
    });
  });

  it('returns mapped error for ApiError even when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      runQuery(controller.signal, async () => {
        throw new ApiError('Cities unavailable', 500);
      }),
    ).resolves.toEqual({
      error: { status: 500, message: 'Cities unavailable' },
    });

    spy.mockRestore();
  });

  it('rethrows AbortError so RTK can ignore superseded requests', async () => {
    const signal = new AbortController().signal;
    const abortError = new DOMException('Aborted', 'AbortError');

    await expect(
      runQuery(signal, async () => {
        throw abortError;
      }),
    ).rejects.toBe(abortError);
  });
});
