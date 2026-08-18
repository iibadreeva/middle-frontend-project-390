import { z, type ZodType } from 'zod';
import {
  createTimeoutSignal,
  mergeAbortSignals,
  type MergedAbortSignal,
} from './lib/abortSignals';
import {
  ApiError,
  ResponseValidationError,
  isAbortError,
  isTimeoutError,
} from './lib/errors';

/** Таймаут сетевых запросов, чтобы UI не зависал навечно. */
export const REQUEST_TIMEOUT_MS = 15_000;

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
      throw ResponseValidationError.fromZodError(error);
    }
    throw error;
  }
}

function isFetchSignalError(error: unknown): boolean {
  return isAbortError(error) || isTimeoutError(error);
}

function throwIfClientTimeout(
  error: unknown,
  timeout: MergedAbortSignal,
  callerSignal: AbortSignal | undefined,
): void {
  if (
    isFetchSignalError(error) &&
    timeout.signal.aborted &&
    !callerSignal?.aborted
  ) {
    throw ApiError.timeout(error);
  }
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (isFetchSignalError(error)) {
      throw error;
    }
    return null;
  }
}

function toHttpApiError(status: number, errorBody: unknown): ApiError {
  const message =
    errorBody && typeof errorBody === 'object' && 'message' in errorBody
      ? String(errorBody.message)
      : `Request failed: ${status}`;
  return new ApiError(message, status, {
    cause: errorBody ?? undefined,
  });
}

async function readSuccessJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (isFetchSignalError(error)) {
      throw error;
    }
    throw ResponseValidationError.fromInvalidJson(error);
  }
}

async function parseOkResponse(
  response: Response,
  schema: ZodType | undefined,
): Promise<unknown> {
  // 204 No Content — тела нет. Без schema это валидный пустой ответ.
  if (response.status === 204) {
    if (schema) {
      return parseResponse(undefined, schema);
    }
    return undefined;
  }

  const json = await readSuccessJson(response);
  if (schema) {
    return parseResponse(json, schema);
  }
  return json;
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
  const timeout = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  const merged = mergeAbortSignals(signal ?? undefined, timeout.signal);

  try {
    try {
      const response = await fetch(path, {
        ...restInit,
        signal: merged?.signal,
        headers: mergeRequestHeaders(initHeaders, { hasBody }),
      });

      if (!response.ok) {
        throw toHttpApiError(response.status, await readErrorBody(response));
      }

      return await parseOkResponse(response, schema);
    } catch (error) {
      throwIfClientTimeout(error, timeout, signal ?? undefined);
      throw error;
    }
  } finally {
    merged?.dispose();
    timeout.dispose();
  }
}
