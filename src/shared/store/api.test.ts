import { describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  RESPONSE_INVALID_JSON_MESSAGE,
  ResponseValidationError,
} from '../lib/errors';
import * as reportErrorModule from '../lib/reportError';
import { runQuery, toQueryError } from './api';

describe('toQueryError', () => {
  it('maps ApiError with status, message, and name', () => {
    expect(toQueryError(new ApiError('bad request', 400))).toEqual({
      status: 400,
      message: 'bad request',
      name: 'ApiError',
    });
  });

  it('maps a client timeout without inventing an HTTP status', () => {
    const timeout = ApiError.timeout();
    expect(toQueryError(timeout)).toEqual({
      message: timeout.message,
      name: 'ApiError',
      code: timeout.code,
    });
  });

  it('maps ResponseValidationError with status, message, and name', () => {
    const error = new ResponseValidationError(
      'Ответ сервера не соответствует схеме',
      [{ path: 'code', message: 'Required' }],
    );
    expect(toQueryError(error)).toEqual({
      status: 500,
      message: 'Ответ сервера не соответствует схеме',
      name: 'ResponseValidationError',
    });
  });

  it('preserves numeric status on duck-typed objects with a message', () => {
    expect(
      toQueryError({
        status: 503,
        message: 'upstream unavailable',
        name: 'Error',
      }),
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

  it('preserves a string code on duck-typed objects', () => {
    expect(
      toQueryError({
        code: 'timeout',
        message: 'Request timed out',
        name: 'ApiError',
      }),
    ).toEqual({
      code: 'timeout',
      message: 'Request timed out',
      name: 'ApiError',
    });
  });

  it('stringifies unknown values', () => {
    expect(toQueryError(42)).toEqual({ message: '42' });
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
      error: { status: 500, message: 'Cities unavailable', name: 'ApiError' },
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

  it('logs ResponseValidationError via reportError', async () => {
    const signal = new AbortController().signal;
    const validationError = new ResponseValidationError(
      'Ответ сервера не соответствует схеме',
      [{ path: 'code', message: 'Required' }],
    );
    const reportSpy = vi
      .spyOn(reportErrorModule, 'reportError')
      .mockImplementation(() => {});

    await expect(
      runQuery(signal, async () => {
        throw validationError;
      }),
    ).resolves.toEqual({
      error: {
        status: 500,
        message: 'Ответ сервера не соответствует схеме',
        name: 'ResponseValidationError',
      },
    });

    expect(reportSpy).toHaveBeenCalledWith(
      'API response validation failed',
      validationError.issues,
      validationError,
    );
    reportSpy.mockRestore();
  });

  it('logs invalid JSON via a distinct reportError prefix', async () => {
    const signal = new AbortController().signal;
    const invalidJson = ResponseValidationError.fromInvalidJson(
      new SyntaxError('Unexpected token'),
    );
    const reportSpy = vi
      .spyOn(reportErrorModule, 'reportError')
      .mockImplementation(() => {});

    await expect(
      runQuery(signal, async () => {
        throw invalidJson;
      }),
    ).resolves.toEqual({
      error: {
        status: 500,
        message: RESPONSE_INVALID_JSON_MESSAGE,
        name: 'ResponseValidationError',
      },
    });

    expect(reportSpy).toHaveBeenCalledWith(
      'API response is not JSON',
      invalidJson.issues,
      invalidJson,
    );
    reportSpy.mockRestore();
  });
});
