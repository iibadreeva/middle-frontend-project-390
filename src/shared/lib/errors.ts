import type { ZodError } from 'zod';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type ValidationIssue = {
  path: string;
  message: string;
};

export class ValidationError extends Error {
  /** Для RTK/middleware: трактуется как 5xx, не как HTTP-статус ответа сервера. */
  readonly status = 500;
  readonly issues: ValidationIssue[];

  constructor(
    message: string,
    issues: ValidationIssue[],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ValidationError';
    this.issues = issues;
  }

  static fromZodError(error: ZodError): ValidationError {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return new ValidationError(
      'Ответ сервера не соответствует схеме',
      issues,
      { cause: error },
    );
  }
}
