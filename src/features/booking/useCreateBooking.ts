import { useEffect, useRef } from 'react';
import {
  type Booking,
  type CreateBookingRequest,
} from '@shared/api';
import { BOOKING_CREATE_ERROR } from '@shared/lib/messages';
import {
  getQueryErrorMessage,
  getQueryErrorStatus,
  useCreateBookingMutation,
} from '@shared/store/api';

export type CreateBookingStatus = 'idle' | 'submitting' | 'success' | 'error';

type MutationPromise = ReturnType<
  ReturnType<typeof useCreateBookingMutation>[0]
>;

export function useCreateBooking(scopeKey?: string): {
  status: CreateBookingStatus;
  booking: Booking | null;
  errorMessage: string | null;
  submit: (body: CreateBookingRequest) => void;
  clearError: () => void;
} {
  const fixedCacheKey = scopeKey ?? '';
  const [createBooking, result] = useCreateBookingMutation({
    fixedCacheKey,
  });
  const inFlightRef = useRef(false);
  const promiseRef = useRef<MutationPromise | null>(null);

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

  function clearError() {
    if (result.isError) {
      result.reset();
    }
  }

  function submit(body: CreateBookingRequest) {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    const promise = createBooking(body);
    promiseRef.current = promise;

    void promise.finally(() => {
      if (promiseRef.current === promise) {
        inFlightRef.current = false;
        promiseRef.current = null;
      }
    });
  }

  let status: CreateBookingStatus = 'idle';
  if (result.isLoading) {
    status = 'submitting';
  } else if (result.isSuccess) {
    status = 'success';
  } else if (result.isError) {
    status = 'error';
  }

  let errorMessage: string | null = null;
  if (status === 'error') {
    const serverMessage = getQueryErrorMessage(result.error);
    if (getQueryErrorStatus(result.error) === 400 && serverMessage) {
      errorMessage = serverMessage;
    } else {
      errorMessage = BOOKING_CREATE_ERROR;
    }
  }

  return {
    status,
    booking: result.isSuccess ? (result.data ?? null) : null,
    errorMessage,
    submit,
    clearError,
  };
}
