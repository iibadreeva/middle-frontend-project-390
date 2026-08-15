import { afterEach, describe, expect, it, vi } from 'vitest';
import { reportError } from './reportError';

describe('reportError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards the message and details to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');
    const info = { componentStack: 'stack' };

    reportError('FlightCard render failed (fl_1)', error, info);

    expect(spy).toHaveBeenCalledWith(
      'FlightCard render failed (fl_1)',
      error,
      info,
    );
  });
});
