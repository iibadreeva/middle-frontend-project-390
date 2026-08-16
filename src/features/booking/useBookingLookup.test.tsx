import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureBooking } from '@shared/test/fixtures';
import { TestProviders } from '@shared/test/providers';
import { useBookingLookup } from './useBookingLookup';

const booking = fixtureBooking();

function wrapper({ children }: { children: ReactNode }) {
  return <TestProviders>{children}</TestProviders>;
}

describe('useBookingLookup', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays idle without code and lastName', () => {
    const { result } = renderHook(() => useBookingLookup(null), { wrapper });
    expect(result.current.status).toBe('idle');
    expect(result.current.booking).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('loads a booking by code and lastName', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(booking));

    const { result } = renderHook(
      () => useBookingLookup({ code: 'AB12CD', lastName: 'Петров' }),
      { wrapper },
    );

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.booking?.code).toBe('AB12CD');
    expect(result.current.booking?.status).toBe('confirmed');
    expect(fetch).toHaveBeenCalledWith(
      '/api/bookings/AB12CD?lastName=%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B2',
      expect.anything(),
    );
  });

  it('maps 404 to not-found', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'not_found', message: 'missing' },
        { status: 404 },
      ),
    );

    const { result } = renderHook(
      () => useBookingLookup({ code: 'WRONG1', lastName: 'Нет' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('not-found');
    });
    expect(result.current.booking).toBeNull();
  });

  it('cancels a confirmed booking and updates status', async () => {
    const cancelled = fixtureBooking({ status: 'cancelled' });
    let current = booking;
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/cancel') && init?.method === 'POST') {
        current = cancelled;
        return Response.json(cancelled);
      }
      return Response.json(current);
    });

    const { result } = renderHook(
      () => useBookingLookup({ code: 'AB12CD', lastName: 'Петров' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => {
      expect(result.current.booking?.status).toBe('cancelled');
    });
    expect(result.current.cancelError).toBe(false);
  });

  it('surfaces cancelError when cancel fails', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/cancel') && init?.method === 'POST') {
        return Response.json(
          { code: 'server_error', message: 'fail' },
          { status: 500 },
        );
      }
      return Response.json(booking);
    });

    const { result } = renderHook(
      () => useBookingLookup({ code: 'AB12CD', lastName: 'Петров' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => {
      expect(result.current.cancelError).toBe(true);
    });
    expect(result.current.booking?.status).toBe('confirmed');
  });

  it('reload retries after an error', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        Response.json(
          { code: 'server_error', message: 'boom' },
          { status: 500 },
        ),
      )
      .mockResolvedValueOnce(Response.json(booking));

    const { result } = renderHook(
      () => useBookingLookup({ code: 'AB12CD', lastName: 'Петров' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    act(() => {
      result.current.reload();
    });

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.booking?.code).toBe('AB12CD');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('clears cancelError when lookup args change', async () => {
    const other = fixtureBooking({ code: 'ZZ99YY' });
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/cancel') && init?.method === 'POST') {
        return Response.json(
          { code: 'server_error', message: 'fail' },
          { status: 500 },
        );
      }
      if (url.includes('ZZ99YY')) {
        return Response.json(other);
      }
      return Response.json(booking);
    });

    const { result, rerender } = renderHook(
      ({ args }) => useBookingLookup(args),
      {
        wrapper,
        initialProps: {
          args: { code: 'AB12CD', lastName: 'Петров' } as {
            code: string;
            lastName: string;
          } | null,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => {
      expect(result.current.cancelError).toBe(true);
    });

    rerender({ args: { code: 'ZZ99YY', lastName: 'Петров' } });

    await waitFor(() => {
      expect(result.current.booking?.code).toBe('ZZ99YY');
    });
    expect(result.current.cancelError).toBe(false);
  });
});
