import { skipToken } from '@reduxjs/toolkit/query/react';
import { useEffect, useRef, useState } from 'react';
import {
  useCancelBookingMutation,
  useGetBookingQuery,
  type BookingLookupArgs,
} from '@entities/booking';
import { getQueryErrorStatus } from '@shared/store';
import type { BookingDetailsData } from './BookingDetails/BookingDetails';
import { toBookingDetailsData } from './toBookingDetailsData';

export type BookingLookupStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'not-found'
  | 'error';

export function useBookingLookup(args: BookingLookupArgs | null): {
  status: BookingLookupStatus;
  booking: BookingDetailsData | null;
  cancel: () => void;
  cancelling: boolean;
  cancelError: boolean;
  reload: () => void;
} {
  const code = args?.code.trim() ?? '';
  const lastName = args?.lastName.trim() ?? '';
  const canLookup = Boolean(code && lastName);
  const queryArg = canLookup ? { code, lastName } : skipToken;

  const query = useGetBookingQuery(queryArg);
  const [cancelBooking, cancelResult] = useCancelBookingMutation();
  const [reloading, setReloading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    cancelResult.reset();
    // `reset` нестабилен между рендерами — сбрасываем только при смене брони.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lastName]);

  function reload() {
    if (!canLookup) {
      return;
    }
    setReloading(true);
    void query.refetch().finally(() => {
      if (mountedRef.current) {
        setReloading(false);
      }
    });
  }

  function cancel() {
    if (!canLookup || query.data?.status !== 'confirmed') {
      return;
    }
    void cancelBooking({ code, lastName });
  }

  if (!canLookup) {
    return {
      status: 'idle',
      booking: null,
      cancel,
      cancelling: false,
      cancelError: false,
      reload,
    };
  }

  if (reloading) {
    return {
      status: 'loading',
      booking: null,
      cancel,
      cancelling: cancelResult.isLoading,
      cancelError: cancelResult.isError,
      reload,
    };
  }

  if (query.isError) {
    return {
      status: getQueryErrorStatus(query.error) === 404 ? 'not-found' : 'error',
      booking: null,
      cancel,
      cancelling: cancelResult.isLoading,
      cancelError: cancelResult.isError,
      reload,
    };
  }

  if (query.isSuccess && query.data) {
    return {
      status: 'success',
      booking: toBookingDetailsData(query.data),
      cancel,
      cancelling: cancelResult.isLoading,
      cancelError: cancelResult.isError,
      reload,
    };
  }

  return {
    status: 'loading',
    booking: null,
    cancel,
    cancelling: cancelResult.isLoading,
    cancelError: cancelResult.isError,
    reload,
  };
}
