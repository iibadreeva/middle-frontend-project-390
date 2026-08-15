import { mergeAbortSignals } from './lib/abortSignals';
import { ApiError } from './lib/errors';

/** Таймаут сетевых запросов, чтобы UI не зависал навечно. */
const REQUEST_TIMEOUT_MS = 15_000;

export function mergeRequestHeaders(
  initHeaders?: HeadersInit,
  options?: { hasBody?: boolean },
): Headers {
  const headers = new Headers(initHeaders);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (options?.hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

/** Универсальный fetch-клиент без знания о доменных типах. */
export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { headers: initHeaders, signal, ...restInit } = init ?? {};
  const hasBody = restInit.body != null;
  const merged = mergeAbortSignals(
    signal ?? undefined,
    AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  );

  try {
    const response = await fetch(path, {
      ...restInit,
      signal: merged?.signal,
      headers: mergeRequestHeaders(initHeaders, { hasBody }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message =
        errorBody && typeof errorBody === 'object' && 'message' in errorBody
          ? String(errorBody.message)
          : `Request failed: ${response.status}`;
      throw new ApiError(message, response.status, {
        cause: errorBody ?? undefined,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    merged?.dispose();
  }
}
