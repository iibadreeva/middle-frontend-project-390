import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Кастомный UI вместо стандартного fallback. */
  fallback?: ReactNode;
  /** Колбэк для логирования / телеметрии; по умолчанию — console.error. */
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, info);
      return;
    }

    console.error('ErrorBoundary caught a render error', error, info);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
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
