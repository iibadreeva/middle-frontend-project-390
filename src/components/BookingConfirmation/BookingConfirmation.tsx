import styles from './BookingConfirmation.module.css';

export type BookingConfirmationData = {
  code: string;
  routeLabel: string;
  flightNumber: string;
  passengersCount: number;
  totalPriceLabel: string;
};

type BookingConfirmationProps = {
  booking: BookingConfirmationData;
};

export function BookingConfirmation({ booking }: BookingConfirmationProps) {
  return (
    <section className={styles.confirmation} data-testid="booking-confirmation">
      <h2 className={styles.heading} data-testid="booking-confirmation-heading">
        Бронирование оформлено
      </h2>

      <p className={styles.row} data-testid="booking-confirmation-code">
        Код бронирования:{' '}
        <span className={styles.strong}>{booking.code}</span>
      </p>

      <p className={styles.row} data-testid="booking-confirmation-route">
        {booking.routeLabel}, {booking.flightNumber}
      </p>

      <p className={styles.row} data-testid="booking-confirmation-passengers">
        Пассажиров: {booking.passengersCount}
      </p>

      <p className={styles.row} data-testid="booking-confirmation-total">
        Итого: <span className={styles.strong}>{booking.totalPriceLabel}</span>
      </p>
    </section>
  );
}
