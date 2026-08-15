import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BOOKING_SEATS_ERROR } from '@shared/lib/messages';
import { passengersRootMessage } from '../passengersSectionError';
import { useBookingForm } from './useBookingForm';

const validPassenger = {
  firstName: 'Иван',
  lastName: 'Петров',
  dateOfBirth: '1990-05-20',
  documentNumber: '4509 123456',
};

const twoPassengers = {
  email: 'ivan@example.com',
  phone: '+79991234567',
  passengers: [validPassenger, { ...validPassenger, firstName: 'Анна' }],
};

describe('useBookingForm', () => {
  it('keeps a stable fieldRegisterOptions identity across rerenders', () => {
    const { result, rerender } = renderHook(
      ({ seatsAvailable }: { seatsAvailable?: number }) =>
        useBookingForm({ seatsAvailable, initialValues: twoPassengers }),
      { initialProps: { seatsAvailable: 2 as number | undefined } },
    );

    const first = result.current.fieldRegisterOptions;
    rerender({ seatsAvailable: 1 });
    expect(result.current.fieldRegisterOptions).toBe(first);
  });

  it('rejects submit via Zod resolver when passengers exceed seatsAvailable', async () => {
    const onSubmit = vi.fn();

    const { result } = renderHook(() => {
      const booking = useBookingForm({
        seatsAvailable: 1,
        onSubmit,
        initialValues: twoPassengers,
      });
      // Подписка на Proxy formState, иначе errors после submit не обновятся.
      void booking.form.formState.errors;
      return booking;
    });

    expect(result.current.seatsShortage).toBe(true);

    await act(async () => {
      await result.current.submit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      passengersRootMessage(result.current.form.formState.errors.passengers),
    ).toBe(BOOKING_SEATS_ERROR);
  });

  it('picks up seatsAvailable changes after mount without recreating the form', async () => {
    const onSubmit = vi.fn();

    const { result, rerender } = renderHook(
      ({ seatsAvailable }: { seatsAvailable?: number }) => {
        const booking = useBookingForm({
          seatsAvailable,
          onSubmit,
          initialValues: twoPassengers,
        });
        void booking.form.formState.errors;
        return booking;
      },
      { initialProps: { seatsAvailable: 2 as number | undefined } },
    );

    expect(result.current.seatsShortage).toBe(false);

    await act(async () => {
      await result.current.submit();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    onSubmit.mockClear();

    rerender({ seatsAvailable: 1 });
    expect(result.current.seatsShortage).toBe(true);

    await act(async () => {
      await result.current.submit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      passengersRootMessage(result.current.form.formState.errors.passengers),
    ).toBe(BOOKING_SEATS_ERROR);
  });

  it('clears stale seats Zod error when seatsAvailable recovers after shortage', async () => {
    const onSubmit = vi.fn();

    const { result, rerender } = renderHook(
      ({ seatsAvailable }: { seatsAvailable?: number }) => {
        const booking = useBookingForm({
          seatsAvailable,
          onSubmit,
          initialValues: twoPassengers,
        });
        void booking.form.formState.errors;
        return booking;
      },
      { initialProps: { seatsAvailable: 1 as number | undefined } },
    );

    await act(async () => {
      await result.current.submit();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      passengersRootMessage(result.current.form.formState.errors.passengers),
    ).toBe(BOOKING_SEATS_ERROR);

    await act(async () => {
      rerender({ seatsAvailable: 2 });
    });

    expect(result.current.seatsShortage).toBe(false);
    expect(
      passengersRootMessage(result.current.form.formState.errors.passengers),
    ).toBeUndefined();

    await act(async () => {
      await result.current.submit();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('clears stale seats Zod error after removePassenger ends the shortage', async () => {
    const onSubmit = vi.fn();

    const { result } = renderHook(() => {
      const booking = useBookingForm({
        seatsAvailable: 1,
        onSubmit,
        initialValues: twoPassengers,
      });
      void booking.form.formState.errors;
      return booking;
    });

    await act(async () => {
      await result.current.submit();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      passengersRootMessage(result.current.form.formState.errors.passengers),
    ).toBe(BOOKING_SEATS_ERROR);

    await act(async () => {
      result.current.removePassenger(1);
    });

    expect(result.current.seatsShortage).toBe(false);
    expect(
      passengersRootMessage(result.current.form.formState.errors.passengers),
    ).toBeUndefined();

    await act(async () => {
      await result.current.submit();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});