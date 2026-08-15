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
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
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
