import { describe, expect, it } from 'vitest';
import { ApiError } from './errors';

describe('ApiError', () => {
  it('preserves cause when provided', () => {
    const cause = { code: 'server_error' };
    const error = new ApiError('boom', 500, { cause });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.message).toBe('boom');
    expect(error.cause).toBe(cause);
  });
});
