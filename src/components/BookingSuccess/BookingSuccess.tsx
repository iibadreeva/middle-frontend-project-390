import { Link } from 'react-router-dom';
import type { Booking } from '../../api';
import { formatPrice } from '../../lib/format';
import styles from './BookingSuccess.module.css';

type BookingSuccessProps = {
  booking: Booking;
};

export function BookingSuccess({ booking }: BookingSuccessProps) {
  const lastName = booking.passengers[0]?.lastName?.trim() ?? '';
  const viewSearch = new URLSearchParams();
  if (lastName) {
    viewSearch.set('lastName', lastName);
  }
  const viewHref = `/bookings/${encodeURIComponent(booking.code)}${
    viewSearch.size > 0 ? `?${viewSearch}` : ''
  }`;

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
          to={viewHref}
          data-testid="booking-view-link"
        >
          Перейти к брони
        </Link>
      </p>
    </section>
  );
}
