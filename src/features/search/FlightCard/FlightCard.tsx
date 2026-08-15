import { Link } from 'react-router-dom';
import { useCities } from '@entities/city';
import {
  formatDuration,
  formatPrice,
  totalMoney,
  type Flight,
} from '@entities/flight';
import { formatDateTime } from '@shared/lib/format';
import { resolveFlightCityTimeZone } from '@shared/lib/resolveCityTimeZone';
import styles from './FlightCard.module.css';

type FlightCardProps = {
  flight: Flight;
  passengers: number;
  /** Маршрут бронирования из слоя app — фича не должна хардкодить пути приложения. */
  bookHref: string;
};

export function FlightCard({ flight, passengers, bookHref }: FlightCardProps) {
  const { cities } = useCities();
  const seatsShortage = flight.seatsAvailable < passengers;
  const departureZone = resolveFlightCityTimeZone(cities, flight.origin);
  const arrivalZone = resolveFlightCityTimeZone(cities, flight.destination);

  return (
    <article className={styles.card} data-testid="flight-result-item">
      <div className={styles.main}>
        <h2 className={styles.airline}>
          {flight.airline.name} · {flight.flightNumber}
        </h2>
        <p className={styles.route}>
          {flight.origin.name} → {flight.destination.name}
        </p>
        <p className={styles.schedule}>
          <span data-testid="flight-departure">
            {formatDateTime(flight.departureAt, departureZone)}
          </span>
          {' — '}
          <span data-testid="flight-arrival">
            {formatDateTime(flight.arrivalAt, arrivalZone)}
          </span>
          {' · '}
          <span data-testid="flight-duration">
            {formatDuration(flight.durationMinutes)}
          </span>
        </p>
        <p className={styles.seats} data-testid="flight-seats">
          Свободных мест: {flight.seatsAvailable}
        </p>
        {seatsShortage ? (
          <p
            className={styles.seatsWarning}
            data-testid="flight-seats-warning"
            role="alert"
          >
            Мест меньше, чем пассажиров в поиске
          </p>
        ) : null}
      </div>

      <div className={styles.aside}>
        <p className={styles.price} data-testid="flight-price">
          {formatPrice(flight.price)}
          <span className={styles.priceHint}> за пассажира</span>
        </p>
        {passengers > 1 ? (
          <p className={styles.total} data-testid="flight-total-price">
            Итого: {formatPrice(totalMoney(flight.price, passengers))}
          </p>
        ) : null}
        {seatsShortage ? (
          <button
            className={styles.book}
            type="button"
            disabled
            data-testid="book-flight"
          >
            Забронировать
          </button>
        ) : (
          <Link
            className={styles.book}
            to={bookHref}
            data-testid="book-flight"
          >
            Забронировать
          </Link>
        )}
      </div>
    </article>
  );
}
