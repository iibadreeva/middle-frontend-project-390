import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiError } from '../lib/errors';

export type ApiQueryError = {
  status?: number;
  message: string;
  name?: string;
};

export function toQueryError(error: unknown): ApiQueryError {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
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
    return {
      message: error.message,
      ...(status !== undefined ? { status } : {}),
      ...(name !== undefined ? { name } : {}),
    };
  }
  return { message: String(error) };
}

/** AbortError из fetch/RTK или сериализованный аналог (в т.ч. из другого realm). */
export function isAbortError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'AbortError',
  );
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
  signal: AbortSignal,
  execute: () => Promise<T>,
): Promise<{ data: T } | { error: ApiQueryError }> {
  try {
    return { data: await execute() };
  } catch (error: unknown) {
    if (signal.aborted) {
      throw error;
    }
    console.error(error);
    return { error: toQueryError(error) };
  }
}

/**
 * Базовый API без доменных endpoint'ов — их inject'ят entities.
 * `tagTypes` объявляются здесь: RTK Query требует полный список на createApi;
 * новые теги (например Booking) добавляйте в этот массив, затем используйте
 * в injectEndpoints сущности.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<ApiQueryError>(),
  tagTypes: ['City', 'Flight'],
  endpoints: () => ({}),
});
