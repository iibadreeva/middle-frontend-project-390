import { act, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CreateBookingRequest } from '@entities/booking';
import { BOOKING_CREATE_ERROR_HINT } from '@shared/lib/messages';
import { TestProviders } from '@shared/test/providers';
import { useToast } from '@shared/ui/Toast';
import { BOOKING_CREATE_TOAST_TAG, useCreateBookingWithToast } from './useCreateBookingWithToast';

const requestBody: CreateBookingRequest = {
  flightId: 'fl_1',
  contact: { email: 'a@b.c', phone: '+79991234567' },
  passengers: [
    {
      firstName: 'Ivan',
      lastName: 'Petrov',
      dateOfBirth: '1990-01-01',
      documentNumber: '123456',
    },
  ],
};

function wrapper({ children }: { children: ReactNode }) {
  return <TestProviders>{children}</TestProviders>;
}

describe('useCreateBookingWithToast', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows a tagged toast and a short sticky hint on transient failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          { code: 'server_error', message: 'Request failed: 500' },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreateBookingWithToast(), {
      wrapper,
    });

    act(() => {
      result.current.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe(BOOKING_CREATE_ERROR_HINT);
    expect(result.current.announceError).toBe(false);
    expect(await screen.findByTestId('toast-item')).toHaveAttribute(
      'data-toast-tag',
      BOOKING_CREATE_TOAST_TAG,
    );
  });

  it('dismissTransientToast removes only the booking-create toast', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          { code: 'server_error', message: 'Request failed: 500' },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(
      () => {
        const booking = useCreateBookingWithToast();
        const toast = useToast();
        return { booking, toast };
      },
      { wrapper },
    );

    act(() => {
      result.current.toast.error('search notice', { tag: 'search' });
      result.current.booking.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.booking.status).toBe('error');
    });
    expect(screen.getAllByTestId('toast-item')).toHaveLength(2);

    act(() => {
      result.current.booking.dismissTransientToast();
    });

    expect(screen.getAllByTestId('toast-item')).toHaveLength(1);
    expect(screen.getByTestId('toast-item')).toHaveTextContent('search notice');
  });

  it('clearError clears sticky state and the booking toast', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          { code: 'server_error', message: 'Request failed: 500' },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreateBookingWithToast(), {
      wrapper,
    });

    act(() => {
      result.current.submit(requestBody);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(screen.getByTestId('toast-item')).toBeInTheDocument();

    act(() => {
      result.current.clearError();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('idle');
    });
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });
});
