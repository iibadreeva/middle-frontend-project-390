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
   * Attention-канал для сети / 5xx и т.п. (например `toast.error`).
   * Validation (400) сюда не вызывается.
   * Сам по себе колбэк не глушит live-region sticky-ошибки — для этого
   * нужен явный `suppressStickyAnnounce: true`.
   * Предпочтительнее `useCreateBookingWithToast` — он задаёт оба флага корректно.
   */
  onTransientError?: (message: string) => void;
  /**
   * Sticky-ошибка без live-region: attention UI уже объявил сообщение.
   * Не выводите из факта наличия `onTransientError` (no-op не должен глушить SR).
   * Вместе с toast всегда передавайте оба: onTransientError + suppressStickyAnnounce.
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
  const onTransientError = options?.onTransientError;
  const onTransientErrorRef = useLatestRef(onTransientError);
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
        .catch((error: unknown) => {
          if (promiseRef.current !== promise) {
            return;
          }
          if (isAbortError(error) || isValidationError(error)) {
            return;
          }
          onTransientErrorRef.current?.(BOOKING_CREATE_ERROR);
        })
        .finally(() => {
          if (promiseRef.current === promise) {
            inFlightRef.current = false;
            promiseRef.current = null;
          }
        });
    },
    [createBooking, onTransientErrorRef],
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
