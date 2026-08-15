import styles from './FlightResults.module.css';

type FlightCardErrorFallbackProps = {
  onRetry: () => void;
};

/** Компактный fallback одной карточки в списке результатов. */
export function FlightCardErrorFallback({
  onRetry,
}: FlightCardErrorFallbackProps) {
  return (
    <div
      className={styles.cardError}
      data-testid="flight-card-error"
      role="alert"
    >
      <p className={styles.cardErrorMessage}>Не удалось показать этот рейс</p>
      <button
        className={styles.cardErrorRetry}
        type="button"
        data-testid="flight-card-error-retry"
        aria-label="Попробовать показать рейс снова"
        onClick={onRetry}
      >
        Повторить
      </button>
    </div>
  );
}
