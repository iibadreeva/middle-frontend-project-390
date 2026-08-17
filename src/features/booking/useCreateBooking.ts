import { useCallback, useEffect, useRef } from 'react';
import {
  useCreateBookingMutation,
  type Booking,
  type CreateBookingRequest,
} from '@entities/booking';
import { useLatestRef } from '@shared/hooks/useLatestRef';
import {
  BOOKING_CREATE_ERROR,
  BOOKING_CREATE_ERROR_HINT,
} from '@shared/lib/messages';
import {
  getQueryErrorMessage,
  getQueryErrorStatus,
  isAbortError,
} from '@shared/store';

export type CreateBookingStatus = 'idle' | 'submitting' | 'success' | 'error';

export type UseCreateBookingOptions = {
  /**
   * Sticky без live-region: полный текст объявляет глобальный RTK toast.
   */
  suppressStickyAnnounce?: boolean;
};

type MutationPromise = ReturnType<
  ReturnType<typeof useCreateBookingMutation>[0]
>;

function isValidationError(error: unknown): boolean {
  return getQueryErrorStatus(error) === 400;
}

function getValidationErrorMessage(error: unknown): string {
  return getQueryErrorMessage(error) || BOOKING_CREATE_ERROR;
}

export function useCreateBooking(
  scopeKey?: string,
  options?: UseCreateBookingOptions,
): {
  status: CreateBookingStatus;
  booking: Booking | null;
  errorMessage: string | null;
  /** Sticky-ошибка должна быть live-region (toast эту ошибку не объявляет). */
  announceError: boolean;
  submit: (body: CreateBookingRequest) => void;
  clearError: () => void;
} {
  const suppressStickyAnnounce = options?.suppressStickyAnnounce === true;

  const fixedCacheKey = scopeKey ?? '';
  const [createBooking, result] = useCreateBookingMutation({
    fixedCacheKey,
  });
  const inFlightRef = useRef(false);
  const promiseRef = useRef<MutationPromise | null>(null);
  const resetRef = useLatestRef(result.reset);
  const isErrorRef = useLatestRef(result.isError);

  useEffect(() => {
    const reset = result.reset;
    return () => {
      promiseRef.current?.abort();
      promiseRef.current = null;
      inFlightRef.current = false;
      reset();
    };
    // Сбрасываем только при размонтировании или смене рейса:
    // ссылка `result.reset` нестабильна и не должна быть в зависимостях.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedCacheKey]);

  const clearError = useCallback(() => {
    if (isErrorRef.current) {
      resetRef.current();
    }
  }, [isErrorRef, resetRef]);

  const submit = useCallback(
    (body: CreateBookingRequest) => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      const promise = createBooking(body);
      promiseRef.current = promise;

      void promise
        .unwrap()
        .catch(() => {
          // unwrap() reject: abort / 400 / 5xx. Toast — в error middleware.
        })
        .finally(() => {
          if (promiseRef.current === promise) {
            inFlightRef.current = false;
            promiseRef.current = null;
          }
        });
    },
    [createBooking],
  );

  let status: CreateBookingStatus = 'idle';
  if (result.isLoading) {
    status = 'submitting';
  } else if (result.isSuccess) {
    status = 'success';
  } else if (result.isError && !isAbortError(result.error)) {
    status = 'error';
  }

  let errorMessage: string | null = null;
  let announceError = false;
  if (status === 'error') {
    if (isValidationError(result.error)) {
      errorMessage = getValidationErrorMessage(result.error);
      // Validation: sticky live-region; toast сюда не ходит.
      announceError = true;
    } else {
      // Полный текст — в toast; sticky — короткий якорь, если announce подавлен.
      errorMessage = suppressStickyAnnounce
        ? BOOKING_CREATE_ERROR_HINT
        : BOOKING_CREATE_ERROR;
      // Transient: live-region, пока attention UI явно не подавил announce.
      announceError = !suppressStickyAnnounce;
    }
  }

  return {
    status,
    booking: result.isSuccess ? (result.data ?? null) : null,
    errorMessage,
    announceError,
    submit,
    clearError,
  };
}
