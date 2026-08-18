import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { reportError } from '../lib/reportError';
import { ApiError, ResponseValidationError, isAbortError } from '../lib/errors';
import {
  registerQueryErrorPoliciesFromEndpoints,
  type QueryErrorExtraOptions,
} from './queryErrorPolicy';

export { isAbortError };

export type ApiQueryError = {
  status?: number;
  message: string;
  name?: string;
  code?: string;
};

export function toQueryError(error: unknown): ApiQueryError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      name: error.name,
      ...(error.status !== undefined ? { status: error.status } : {}),
      ...(error.code !== undefined ? { code: error.code } : {}),
    };
  }
  // Duck-typing: DOMException/Error из другого realm может не пройти instanceof.
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    const status =
      'status' in error && typeof error.status === 'number'
        ? error.status
        : undefined;
    const name =
      'name' in error && typeof error.name === 'string'
        ? error.name
        : undefined;
    const code =
      'code' in error && typeof error.code === 'string'
        ? error.code
        : undefined;
    return {
      message: error.message,
      ...(status !== undefined ? { status } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(code !== undefined ? { code } : {}),
    };
  }
  return { message: String(error) };
}

export function getQueryErrorStatus(error: unknown): number | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return error.status;
  }
  return undefined;
}

export function getQueryErrorMessage(error: unknown): string | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return undefined;
}

export async function runQuery<T>(
  _signal: AbortSignal,
  execute: () => Promise<T>,
): Promise<{ data: T } | { error: ApiQueryError }> {
  try {
    return { data: await execute() };
  } catch (error: unknown) {
    // Только AbortError: при гонке «HTTP-ошибка + abort следующего запроса»
    // RTK signal уже aborted, но error — ApiError. Пробрасывать его нельзя —
    // иначе RTK не фиксирует isError и уходит в цикл refetch.
    if (isAbortError(error)) {
      throw error;
    }
    if (error instanceof ResponseValidationError) {
      reportError(
        error.kind === 'invalid-json'
          ? 'API response is not JSON'
          : 'API response validation failed',
        error.issues,
        error,
      );
    } else {
      reportError('API request failed', error);
    }
    return { error: toQueryError(error) };
  }
}

/**
 * Базовый API без доменных endpoint'ов — их inject'ят entities
 * при импорте entity-модуля api (хуки или объект API).
 * `tagTypes` объявляются здесь: RTK Query требует полный список на createApi;
 * новые теги (например Booking) добавляйте в этот массив, затем используйте
 * в injectEndpoints сущности.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<ApiQueryError>() as unknown as BaseQueryFn<
    void,
    never,
    ApiQueryError,
    QueryErrorExtraOptions
  >,
  tagTypes: ['City', 'Flight', 'Booking'],
  endpoints: () => ({}),
});

const injectEndpoints = api.injectEndpoints.bind(api);
api.injectEndpoints = ((config) => {
  const endpoints = typeof config === 'function' ? config : config.endpoints;
  const rest = typeof config === 'function' ? {} : config;
  return injectEndpoints({
    ...rest,
    endpoints: (build) => {
      const definitions = endpoints(build);
      // extraOptions не торчит на public endpoint — копируем политику в реестр.
      registerQueryErrorPoliciesFromEndpoints(definitions);
      return definitions;
    },
  });
}) as typeof api.injectEndpoints;
