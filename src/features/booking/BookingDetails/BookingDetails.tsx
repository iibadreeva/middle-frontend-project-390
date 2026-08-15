import type { BookingStatus } from '@entities/booking';
import styles from './BookingDetails.module.css';

export type BookingDetailsData = {
  code: string;
  status: BookingStatus;
  flightLabel: string;
  passengersLabel: string;
  totalPriceLabel: string;
};

type BookingDetailsProps = {
  booking: BookingDetailsData;
  onCancel?: () => void;
};

const statusLabels: Record<BookingStatus, string> = {
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
};

export function BookingDetails({ booking, onCancel }: BookingDetailsProps) {
  const badgeClass =
    booking.status === 'cancelled'
      ? `${styles.badge} ${styles.badgeCancelled}`
      : `${styles.badge} ${styles.badgeConfirmed}`;

  return (
    <article className={styles.card} data-testid="booking-details">
      <div className={styles.header}>
        <p className={styles.code} data-testid="booking-code">
          {booking.code}
        </p>
        <span
          className={badgeClass}
          data-testid="booking-status"
          data-status={booking.status}
        >
          {statusLabels[booking.status]}
        </span>
      </div>

      <p className={styles.row} data-testid="booking-route">
        {booking.flightLabel}
      </p>

      <p className={styles.row} data-testid="booking-passengers">
        Пассажиры: {booking.passengersLabel}
      </p>

      <p className={styles.total} data-testid="booking-total">
        Итого: {booking.totalPriceLabel}
      </p>

      {booking.status === 'confirmed' ? (
        <button
          className={styles.cancel}
          type="button"
          data-testid="booking-cancel-button"
          onClick={onCancel}
        >
          Отменить бронь
        </button>
      ) : null}
    </article>
  );
}
