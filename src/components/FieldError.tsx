import type { ReactNode } from 'react';

type FieldErrorProps = {
  id?: string;
  testId?: string;
  className?: string;
  children?: ReactNode;
  /**
   * По умолчанию без live-region — связь через aria-describedby у поля.
   * assertive — внешние/серверные ошибки (role="alert").
   */
  live?: 'assertive';
};

/** Сообщение об ошибке поля; live-region только для внешних ошибок. */
export function FieldError({
  id,
  testId,
  className,
  children,
  live,
}: FieldErrorProps) {
  if (children == null || children === false || children === '') {
    return null;
  }

  return (
    <p
      className={className}
      id={id}
      data-testid={testId}
      role={live === 'assertive' ? 'alert' : undefined}
    >
      {children}
    </p>
  );
}
