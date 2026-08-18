import { useCallback } from 'react';
import { rtkQueryErrorTag } from '@shared/store';
import { toast } from '@shared/ui/Toast';
import { useCreateBooking } from './useCreateBooking';

/** Tag toast'ов создания брони — dismiss не трогает чужие уведомления. */
export const BOOKING_CREATE_TOAST_TAG = rtkQueryErrorTag('createBooking');

/**
 * Бронирование со sticky-hint: полный текст объявляет глобальный toast.
 * `suppressStickyAnnounce` глушит live-region, чтобы не дублировать attention.
 */
export function useCreateBookingWithToast(scopeKey?: string) {
  const {
    status,
    booking,
    errorMessage,
    announceError,
    submit,
    clearError: clearBookingError,
  } = useCreateBooking(scopeKey, {
    suppressStickyAnnounce: true,
  });

  const clearError = useCallback(() => {
    clearBookingError();
    toast.dismiss(BOOKING_CREATE_TOAST_TAG);
  }, [clearBookingError]);

  const dismissTransientToast = useCallback(() => {
    toast.dismiss(BOOKING_CREATE_TOAST_TAG);
  }, []);

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
