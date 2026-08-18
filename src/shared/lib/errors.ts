import type { ZodError } from 'zod';

export const REQUEST_TIMEOUT_CODE = 'timeout';

export const REQUEST_TIMEOUT_MESSAGE = 'Request timed out';

type ApiErrorOptions = ErrorOptions & {
  code?: string;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, status?: number, options?: ApiErrorOptions) {
    const { code, ...errorOptions } = options ?? {};
    super(message, errorOptions);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  static timeout(cause?: unknown): ApiError {
    return new ApiError(REQUEST_TIMEOUT_MESSAGE, undefined, {
      cause,
      code: REQUEST_TIMEOUT_CODE,
    });
  }
}

export type ValidationIssue = {
  path: string;
  message: string;
};

export const RESPONSE_VALIDATION_MESSAGE =
  'Ответ сервера не соответствует схеме';

export const RESPONSE_INVALID_JSON_MESSAGE = 'Ответ сервера не является JSON';

export type ResponseValidationKind = 'schema' | 'invalid-json';

type ResponseValidationErrorOptions = ErrorOptions & {
  kind?: ResponseValidationKind;
};

export class ResponseValidationError extends ApiError {
  readonly issues: ValidationIssue[];
  readonly kind: ResponseValidationKind;

  constructor(
    message: string,
    issues: ValidationIssue[],
    options?: ResponseValidationErrorOptions,
  ) {
    const { kind = 'schema', ...errorOptions } = options ?? {};
    super(message, 500, errorOptions);
    this.name = 'ResponseValidationError';
    this.issues = issues;
    this.kind = kind;
  }

  static fromZodError(error: ZodError): ResponseValidationError {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return new ResponseValidationError(RESPONSE_VALIDATION_MESSAGE, issues, {
      cause: error,
      kind: 'schema',
    });
  }

  static fromInvalidJson(cause: unknown): ResponseValidationError {
    return new ResponseValidationError(RESPONSE_INVALID_JSON_MESSAGE, [], {
      cause,
      kind: 'invalid-json',
    });
  }
}

/** AbortError из fetch/RTK или сериализованный аналог (в т.ч. из другого realm). */
export function isAbortError(error: unknown): boolean {
  return hasErrorName(error, 'AbortError');
}

/** TimeoutError — abort reason из AbortSignal.timeout / createTimeoutSignal. */
export function isTimeoutError(error: unknown): boolean {
  return hasErrorName(error, 'TimeoutError');
}

/** Клиентский timeout fetch-клиента (не HTTP-статус шлюза). */
export function isRequestTimeoutError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === REQUEST_TIMEOUT_CODE,
  );
}

function hasErrorName(error: unknown, name: string): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === name,
  );
}
