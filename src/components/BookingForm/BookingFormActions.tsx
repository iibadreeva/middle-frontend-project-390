import styles from './BookingForm.module.css';

type BookingFormActionsProps = {
  canAddPassenger: boolean;
  submitting: boolean;
  submitDisabled: boolean;
  seatsShortage: boolean;
  totalLabel: string | null;
  onAddPassenger: () => void;
};

export function BookingFormActions({
  canAddPassenger,
  submitting,
  submitDisabled,
  seatsShortage,
  totalLabel,
  onAddPassenger,
}: BookingFormActionsProps) {
  return (
    <div className={styles.actions}>
      {totalLabel ? (
        <p className={styles.total} data-testid="booking-form-total-price">
          {totalLabel}
        </p>
      ) : null}
      <button
        className={styles.secondary}
        type="button"
        data-testid="add-passenger"
        disabled={submitting || !canAddPassenger}
        onClick={onAddPassenger}
      >
        Добавить пассажира
      </button>
      <button
        className={styles.primary}
        type="submit"
        disabled={submitDisabled || submitting || seatsShortage}
        data-testid="booking-submit"
      >
        {submitting ? 'Оформляем…' : 'Забронировать'}
      </button>
    </div>
  );
}
