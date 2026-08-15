import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Кастомный UI вместо стандартного fallback. */
  fallback?: ReactNode;
  /** Кастомный fallback с доступом к error/retry (имеет приоритет над `fallback`). */
  fallbackRender?: (ctx: { error: Error; retry: () => void }) => ReactNode;
  /**
   * При изменении любого элемента массива сбрасывает состояние ошибки
   * (например, новые props карточки в списке).
   */
  resetKeys?: ReadonlyArray<unknown>;
  /** Колбэк для логирования / телеметрии; по умолчанию — console.error. */
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function haveResetKeysChanged(
  prev: ReadonlyArray<unknown> | undefined,
  next: ReadonlyArray<unknown> | undefined,
): boolean {
  if (prev === next) {
    return false;
  }
  if (!prev || !next || prev.length !== next.length) {
    return true;
  }
  return prev.some((value, index) => !Object.is(value, next[index]));
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error: toError(error) };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      haveResetKeysChanged(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(toError(error), info);
      return;
    }

    console.error('ErrorBoundary caught a render error', error, info);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender({
          error: this.state.error ?? new Error('Unknown error'),
          retry: this.handleRetry,
        });
      }

      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div className={styles.fallback} data-testid="error-boundary" role="alert">
          <p className={styles.message}>
            Что-то пошло не так при отображении страницы.
          </p>
          <button
            className={styles.retry}
            type="button"
            data-testid="error-boundary-retry"
            onClick={this.handleRetry}
          >
            Повторить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
