import { Link } from 'react-router-dom';
import { formatPrice, type Booking } from '@entities/booking';
import styles from './BookingSuccess.module.css';

type BookingSuccessProps = {
  booking: Booking;
  /** Маршрут просмотра брони из слоя app — фича не должна хардкодить пути приложения. */
  viewBookingHref: string;
};

export function BookingSuccess({
  booking,
  viewBookingHref,
}: BookingSuccessProps) {
  return (
    <section className={styles.success} data-testid="booking-success">
      <h2 className={styles.heading}>Бронирование оформлено</h2>
      <p className={styles.row}>
        Код бронирования:{' '}
        <span className={styles.strong} data-testid="booking-code">
          {booking.code}
        </span>
      </p>
      <p className={styles.row}>
        {booking.flight.origin.name} → {booking.flight.destination.name},{' '}
        {booking.flight.flightNumber}
      </p>
      <p className={styles.row}>Пассажиров: {booking.passengers.length}</p>
      <p className={styles.row}>
        Итого:{' '}
        <span className={styles.strong}>
          {formatPrice(booking.totalPrice)}
        </span>
      </p>
      <p className={styles.row}>
        <Link
          className={styles.link}
          to={viewBookingHref}
          data-testid="booking-view-link"
        >
          Перейти к брони
        </Link>
      </p>
    </section>
  );
}
