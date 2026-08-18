import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  ApiError,
  REQUEST_TIMEOUT_CODE,
  REQUEST_TIMEOUT_MESSAGE,
  RESPONSE_INVALID_JSON_MESSAGE,
  RESPONSE_VALIDATION_MESSAGE,
  ResponseValidationError,
  isAbortError,
  isRequestTimeoutError,
  isTimeoutError,
} from './errors';

describe('ApiError', () => {
  it('preserves cause when provided', () => {
    const cause = { code: 'server_error' };
    const error = new ApiError('boom', 500, { cause });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.message).toBe('boom');
    expect(error.cause).toBe(cause);
  });

  it('marks a client timeout by code, not an HTTP status', () => {
    const cause = new DOMException(
      'The operation was aborted due to timeout',
      'TimeoutError',
    );
    const error = ApiError.timeout(cause);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(REQUEST_TIMEOUT_MESSAGE);
    expect(error.code).toBe(REQUEST_TIMEOUT_CODE);
    expect(error.status).toBeUndefined();
    expect(error.cause).toBe(cause);
    expect(isRequestTimeoutError(error)).toBe(true);
    expect(isAbortError(error)).toBe(false);
  });
});

describe('ResponseValidationError', () => {
  it('maps Zod issues and keeps the original error as cause', () => {
    const parsed = z.object({ code: z.string() }).safeParse({});
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    const error = ResponseValidationError.fromZodError(parsed.error);

    expect(error).toBeInstanceOf(ResponseValidationError);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ResponseValidationError');
    expect(error.status).toBe(500);
    expect(error.message).toBe(RESPONSE_VALIDATION_MESSAGE);
    expect(error.cause).toBe(parsed.error);
    expect(error.kind).toBe('schema');
    expect(error.issues.length).toBeGreaterThan(0);
    expect(error.issues[0]).toMatchObject({ path: 'code' });
  });

  it('wraps invalid JSON without inventing issues', () => {
    const cause = new SyntaxError('Unexpected token');
    const error = ResponseValidationError.fromInvalidJson(cause);

    expect(error).toBeInstanceOf(ResponseValidationError);
    expect(error.message).toBe(RESPONSE_INVALID_JSON_MESSAGE);
    expect(error.issues).toEqual([]);
    expect(error.cause).toBe(cause);
    expect(error.kind).toBe('invalid-json');
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
    expect(isAbortError(new DOMException('timeout', 'TimeoutError'))).toBe(
      false,
    );
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError('AbortError')).toBe(false);
  });
});

describe('isTimeoutError', () => {
  it('detects TimeoutError by name', () => {
    expect(
      isTimeoutError(
        new DOMException(
          'The operation was aborted due to timeout',
          'TimeoutError',
        ),
      ),
    ).toBe(true);
    expect(isTimeoutError({ name: 'TimeoutError', message: 'timeout' })).toBe(
      true,
    );
  });

  it('does not treat AbortError as a timeout', () => {
    expect(isTimeoutError(new DOMException('Aborted', 'AbortError'))).toBe(
      false,
    );
    expect(isTimeoutError(new Error('offline'))).toBe(false);
    expect(isTimeoutError(null)).toBe(false);
  });
});

describe('isRequestTimeoutError', () => {
  it('detects a serialized timeout by code even without status', () => {
    expect(
      isRequestTimeoutError({
        code: REQUEST_TIMEOUT_CODE,
        message: REQUEST_TIMEOUT_MESSAGE,
        name: 'ApiError',
      }),
    ).toBe(true);
  });

  it('still detects a timeout if a 4xx status was attached by mistake', () => {
    expect(
      isRequestTimeoutError({
        code: REQUEST_TIMEOUT_CODE,
        status: 408,
        message: REQUEST_TIMEOUT_MESSAGE,
      }),
    ).toBe(true);
  });

  it('rejects HTTP errors and abort errors without the timeout code', () => {
    expect(isRequestTimeoutError(new ApiError('gateway', 504))).toBe(false);
    expect(
      isRequestTimeoutError(new DOMException('Aborted', 'AbortError')),
    ).toBe(false);
    expect(isRequestTimeoutError(null)).toBe(false);
  });
});
