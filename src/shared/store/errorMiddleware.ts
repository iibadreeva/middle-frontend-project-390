import {
  isPending,
  isRejectedWithValue,
  type Middleware,
} from '@reduxjs/toolkit';
import {
  BOOKING_CANCEL_ERROR,
  BOOKING_CREATE_ERROR,
  BOOKING_LOOKUP_ERROR,
  FLIGHT_LOAD_ERROR,
  FLIGHTS_SEARCH_ERROR,
  REQUEST_FAILED,
} from '@shared/lib/messages';
import { toast } from '@shared/ui/Toast/toast';
import { getQueryErrorStatus, isAbortError } from './api';

export function rtkQueryErrorTag(endpointName: string): string {
  return `rtk:${endpointName}`;
}

const ENDPOINT_ERROR_MESSAGES: Record<string, string> = {
  getBooking: BOOKING_LOOKUP_ERROR,
  cancelBooking: BOOKING_CANCEL_ERROR,
  createBooking: BOOKING_CREATE_ERROR,
  getFlights: FLIGHTS_SEARCH_ERROR,
  getFlight: FLIGHT_LOAD_ERROR,
};

/** Fallback-notice на поиске; Layout тянет города на всех страницах. */
const TOAST_SILENT_ENDPOINTS = new Set(['getCities']);

/**
 * Публичная форма thunk-аргумента RTK Query (`QueryThunkArg` / `MutationThunkArg`):
 * `type` + `endpointName` в `action.meta.arg`.
 * При мажорном обновлении `@reduxjs/toolkit` сверить matcher и форму экшена.
 */
type RtkQueryEndpointArg = {
  type: 'query' | 'mutation';
  endpointName: string;
};

type RtkQueryEndpointAction = {
  meta: { arg: RtkQueryEndpointArg };
};

function isRtkQueryEndpointAction(
  action: unknown,
): action is RtkQueryEndpointAction {
  if (!action || typeof action !== 'object' || !('meta' in action)) {
    return false;
  }
  const meta = action.meta;
  if (!meta || typeof meta !== 'object' || !('arg' in meta)) {
    return false;
  }
  const arg = meta.arg;
  if (!arg || typeof arg !== 'object') {
    return false;
  }
  if (!('type' in arg) || !('endpointName' in arg)) {
    return false;
  }
  return (
    (arg.type === 'query' || arg.type === 'mutation') &&
    typeof arg.endpointName === 'string'
  );
}

function getRtkQueryEndpointName(action: unknown): string | undefined {
  return isRtkQueryEndpointAction(action)
    ? action.meta.arg.endpointName
    : undefined;
}

function isClientHttpError(status: number | undefined): boolean {
  return status !== undefined && status >= 400 && status < 500;
}

export const rtkQueryErrorMiddleware: Middleware =
  () => (next) => (action: unknown) => {
    if (isPending(action)) {
      const endpointName = getRtkQueryEndpointName(action);
      if (endpointName) {
        toast.dismiss(rtkQueryErrorTag(endpointName));
      }
      return next(action);
    }

    if (isRejectedWithValue(action)) {
      const payload = action.payload;
      if (
        !isAbortError(payload) &&
        !isClientHttpError(getQueryErrorStatus(payload))
      ) {
        const endpointName = getRtkQueryEndpointName(action);
        if (endpointName && !TOAST_SILENT_ENDPOINTS.has(endpointName)) {
          toast.error(
            ENDPOINT_ERROR_MESSAGES[endpointName] ?? REQUEST_FAILED,
            { tag: rtkQueryErrorTag(endpointName) },
          );
        }
      }
    }

    return next(action);
  };
