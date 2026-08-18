import {
  isPending,
  isRejectedWithValue,
  type Middleware,
} from '@reduxjs/toolkit';
import { isRequestTimeoutError } from '@shared/lib/errors';
import { REQUEST_FAILED } from '@shared/lib/messages';
import { toast } from '@shared/lib/toast';
import { getQueryErrorStatus, isAbortError } from './api';
import {
  getQueryErrorPolicy,
  isSilentQueryErrorPolicy,
  queryErrorPolicyMessage,
} from './queryErrorPolicy';

export function rtkQueryErrorTag(endpointName: string): string {
  return `rtk:${endpointName}`;
}

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
        (isRequestTimeoutError(payload) ||
          !isClientHttpError(getQueryErrorStatus(payload)))
      ) {
        const endpointName = getRtkQueryEndpointName(action);
        const policy = endpointName
          ? getQueryErrorPolicy(endpointName)
          : undefined;
        if (endpointName && !isSilentQueryErrorPolicy(policy)) {
          toast.error(queryErrorPolicyMessage(policy, REQUEST_FAILED), {
            tag: rtkQueryErrorTag(endpointName),
          });
        }
      }
    }

    return next(action);
  };
