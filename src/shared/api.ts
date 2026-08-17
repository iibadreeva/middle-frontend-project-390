import { z, type ZodType } from 'zod';
import { mergeAbortSignals } from './lib/abortSignals';
import { ApiError, ValidationError } from './lib/errors';

/** Таймаут сетевых запросов, чтобы UI не зависал навечно. */
const REQUEST_TIMEOUT_MS = 15_000;

export type RequestOptions<S extends ZodType | undefined = undefined> =
  RequestInit & {
    schema?: S;
  };

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

function parseResponse<S extends ZodType>(
  json: unknown,
  schema: S,
): z.output<S> {
  try {
    return schema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.fromZodError(error);
    }
    throw error;
  }
}

/** Универсальный fetch-клиент без знания о доменных типах. */
export async function request<S extends ZodType>(
  path: string,
  init: RequestInit & { schema: S },
): Promise<z.output<S>>;
export async function request(
  path: string,
  init?: RequestInit & { schema?: undefined },
): Promise<unknown>;
export async function request(
  path: string,
  init?: RequestOptions<ZodType | undefined>,
): Promise<unknown> {
  const { headers: initHeaders, signal, schema, ...restInit } = init ?? {};
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

    // 204 No Content — тело отсутствует; schema не применяется.
    if (response.status === 204) {
      return undefined;
    }

    const json = await response.json();
    if (schema) {
      return parseResponse(json, schema);
    }
    return json;
  } finally {
    merged?.dispose();
  }
}
