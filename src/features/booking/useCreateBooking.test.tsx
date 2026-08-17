import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureBooking } from '@shared/test/fixtures';
import {
  BOOKING_CREATE_ERROR,
  BOOKING_CREATE_ERROR_HINT,
} from '@shared/lib/messages';
import { TestProviders } from '@shared/test/providers';
import { useCreateBooking } from './useCreateBooking';

const booking = fixtureBooking();

const requestBody = {
  flightId: 'fl_1',
  contact: booking.contact,
  passengers: booking.passengers,
};

function wrapper({ children }: { children: ReactNode }) {
  return <TestProviders>{children}</TestProviders>;
}

describe('useCreateBooking', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts idle and moves to success with the booking', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(booking, { status: 201 }),
    );

    const { result } = renderHook(() => useCreateBooking(), { wrapper });

    expect(result.current.status).toBe('idle');

    act(() => {
      result.current.submit(requestBody);
    });

    expect(result.current.status).toBe('submitting');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.booking).toEqual(booking);
    expect(result.current.errorMessage).toBeNull();
  });

  it('surfaces the server validation message on 400', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'validation_error', message: 'Укажите flightId' },
        { status: 400 },
      ),
    );

    const { result } = renderHook(
      () =>
        useCreateBooking(undefined, {
          suppressStickyAnnounce: true,
        }),
      { wrapper },
    );

    act(() => {
      result.current.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe('Укажите flightId');
    expect(result.current.announceError).toBe(true);
    expect(result.current.booking).toBeNull();
  });

  it('keeps a sticky form hint when suppressStickyAnnounce is set for 5xx', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'server_error', message: 'Request failed: 500' },
        { status: 500 },
      ),
    );

    const { result } = renderHook(
      () =>
        useCreateBooking(undefined, {
          suppressStickyAnnounce: true,
        }),
      { wrapper },
    );

    act(() => {
      result.current.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe(BOOKING_CREATE_ERROR_HINT);
    expect(result.current.announceError).toBe(false);
  });

  it('keeps a sticky form hint on network failure when announce is suppressed', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));

    const { result } = renderHook(
      () =>
        useCreateBooking(undefined, {
          suppressStickyAnnounce: true,
        }),
      { wrapper },
    );

    act(() => {
      result.current.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe(BOOKING_CREATE_ERROR_HINT);
    expect(result.current.announceError).toBe(false);
  });

  it('announces sticky non-validation errors when suppressStickyAnnounce is omitted', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useCreateBooking(), { wrapper });

    act(() => {
      result.current.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe(BOOKING_CREATE_ERROR);
    expect(result.current.announceError).toBe(true);
  });

  it('does not treat a 400 as a suppressed sticky error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ message: '' }, { status: 400 }),
    );

    const { result } = renderHook(
      () =>
        useCreateBooking(undefined, {
          suppressStickyAnnounce: true,
        }),
      { wrapper },
    );

    act(() => {
      result.current.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe(BOOKING_CREATE_ERROR);
    expect(result.current.announceError).toBe(true);
  });

  it('treats AbortError as idle', async () => {
    vi.mocked(fetch).mockRejectedValue(
      new DOMException('Aborted', 'AbortError'),
    );

    const { result } = renderHook(
      () =>
        useCreateBooking(undefined, {
          suppressStickyAnnounce: true,
        }),
      { wrapper },
    );

    act(() => {
      result.current.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('idle');
    });
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.announceError).toBe(false);
  });

  it('ignores a second submit while the first is in flight', async () => {
    let resolveFirst!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFirst = resolve;
        }),
    );

    const { result } = renderHook(() => useCreateBooking(), { wrapper });

    act(() => {
      result.current.submit(requestBody);
      result.current.submit(requestBody);
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst(Response.json(booking, { status: 201 }));
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });

  it('does not clear in-flight guard when an aborted request settles after a new submit', async () => {
    const pending: Array<{
      resolve: (value: Response) => void;
      reject: (reason?: unknown) => void;
    }> = [];

    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve, reject) => {
          pending.push({ resolve, reject });
        }),
    );

    function Consumer({ scopeKey }: { scopeKey: string }) {
      const { submit } = useCreateBooking(scopeKey);
      return (
        <button type="button" onClick={() => submit(requestBody)}>
          submit
        </button>
      );
    }

    function Harness() {
      const [scopeKey, setScopeKey] = useState('fl_1');
      return (
        <>
          <Consumer scopeKey={scopeKey} />
          <button type="button" onClick={() => setScopeKey('fl_2')}>
            switch
          </button>
        </>
      );
    }

    const user = userEvent.setup();
    render(<Harness />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(fetch).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'switch' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(fetch).toHaveBeenCalledTimes(2);

    await act(async () => {
      pending[0]?.reject(new DOMException('Aborted', 'AbortError'));
    });

    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(fetch).toHaveBeenCalledTimes(2);

    await act(async () => {
      pending[1]?.resolve(Response.json(booking, { status: 201 }));
    });
  });

  it('does not expose success for the previous scope on the first render after switch', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(booking, { status: 201 }),
    );

    const renders: string[] = [];

    function Consumer({ scopeKey }: { scopeKey: string }) {
      const { status, booking: current, submit } = useCreateBooking(scopeKey);
      renders.push(`${scopeKey}|${status}|${current?.code ?? '-'}`);

      return (
        <button type="button" onClick={() => submit(requestBody)}>
          submit
        </button>
      );
    }

    function Harness() {
      const [scopeKey, setScopeKey] = useState('fl_1');

      return (
        <>
          <Consumer scopeKey={scopeKey} />
          <button type="button" onClick={() => setScopeKey('fl_2')}>
            switch
          </button>
        </>
      );
    }

    const user = userEvent.setup();
    render(<Harness />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() => {
      expect(renders.at(-1)).toBe('fl_1|success|AB12CD');
    });

    const beforeSwitch = renders.length;
    await user.click(screen.getByRole('button', { name: 'switch' }));

    const afterSwitch = renders.slice(beforeSwitch);
    expect(afterSwitch[0]).toBe('fl_2|idle|-');
    expect(afterSwitch.every((entry) => !entry.includes('|success|'))).toBe(
      true,
    );
  });

  it('clearError returns from error to idle', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'validation_error', message: 'bad' },
        { status: 400 },
      ),
    );

    const { result } = renderHook(() => useCreateBooking('fl_1'), { wrapper });

    act(() => {
      result.current.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
  });
});
