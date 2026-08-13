import { useEffect, useRef, useState } from 'react';
import {
  createBooking,
  type Booking,
  type CreateBookingRequest,
} from '../api';
import { ApiError } from '../lib/errors';
import { BOOKING_CREATE_ERROR } from '../lib/messages';

export type CreateBookingStatus = 'idle' | 'submitting' | 'success' | 'error';

type CreateBookingResult = {
  scopeKey: string | undefined;
  status: CreateBookingStatus;
  booking: Booking | null;
  errorMessage: string | null;
};

const idleResult = (scopeKey: string | undefined): CreateBookingResult => ({
  scopeKey,
  status: 'idle',
  booking: null,
  errorMessage: null,
});

export function useCreateBooking(scopeKey?: string): {
  status: CreateBookingStatus;
  booking: Booking | null;
  errorMessage: string | null;
  submit: (body: CreateBookingRequest) => void;
  clearError: () => void;
} {
  const [result, setResult] = useState<CreateBookingResult>(() =>
    idleResult(scopeKey),
  );
  const inFlightRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const scopeKeyRef = useRef(scopeKey);

  if (result.scopeKey !== scopeKey) {
    setResult(idleResult(scopeKey));
  }

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (scopeKeyRef.current === scopeKey) {
      return;
    }

    scopeKeyRef.current = scopeKey;
    controllerRef.current?.abort();
    controllerRef.current = null;
    inFlightRef.current = false;
  }, [scopeKey]);

  function clearError() {
    setResult((current) => {
      if (current.scopeKey !== scopeKey || current.status !== 'error') {
        return current;
      }

      return idleResult(scopeKey);
    });
  }

  function submit(body: CreateBookingRequest) {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setResult({
      scopeKey,
      status: 'submitting',
      booking: null,
      errorMessage: null,
    });

    const controller = new AbortController();
    controllerRef.current = controller;

    createBooking(body, controller.signal)
      .then((nextBooking) => {
        if (controller.signal.aborted) {
          return;
        }
        setResult({
          scopeKey,
          status: 'success',
          booking: nextBooking,
          errorMessage: null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error(error);
        const message =
          error instanceof ApiError && error.status === 400 && error.message
            ? error.message
            : BOOKING_CREATE_ERROR;
        setResult({
          scopeKey,
          status: 'error',
          booking: null,
          errorMessage: message,
        });
      })
      .finally(() => {
        if (controllerRef.current === controller) {
          inFlightRef.current = false;
          controllerRef.current = null;
        }
      });
  }

  const visible =
    result.scopeKey === scopeKey ? result : idleResult(scopeKey);

  return {
    status: visible.status,
    booking: visible.booking,
    errorMessage: visible.errorMessage,
    submit,
    clearError,
  };
}
