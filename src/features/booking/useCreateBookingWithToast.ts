import { useCallback } from 'react';
import { useToast } from '@shared/ui/Toast';
import { useCreateBooking } from './useCreateBooking';

/** Tag toast'ов создания брони — dismiss не трогает чужие уведомления. */
export const BOOKING_CREATE_TOAST_TAG = 'booking-create';

/**
 * Бронирование с toast для transient-ошибок.
 * Всегда ставит пару `onTransientError` + `suppressStickyAnnounce`,
 * чтобы не получить двойной live-region announce.
 */
export function useCreateBookingWithToast(scopeKey?: string) {
  const toast = useToast();

  const onTransientError = useCallback(
    (message: string) => {
      toast.error(message, { tag: BOOKING_CREATE_TOAST_TAG });
    },
    [toast],
  );

  const {
    status,
    booking,
    errorMessage,
    announceError,
    submit,
    clearError: clearBookingError,
  } = useCreateBooking(scopeKey, {
    onTransientError,
    suppressStickyAnnounce: true,
  });

  const clearError = useCallback(() => {
    clearBookingError();
    toast.dismiss(BOOKING_CREATE_TOAST_TAG);
  }, [clearBookingError, toast]);

  const dismissTransientToast = useCallback(() => {
    toast.dismiss(BOOKING_CREATE_TOAST_TAG);
  }, [toast]);

  return {
    status,
    booking,
    errorMessage,
    announceError,
    submit,
    clearError,
    dismissTransientToast,
  };
}
