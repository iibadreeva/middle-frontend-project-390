import { useCities } from '@entities/city';
import { formatPrice, totalMoney, type Flight } from '@entities/flight';
import { formatDateTime } from '@shared/lib/format';
import { resolveFlightCityTimeZone } from '@shared/lib/resolveCityTimeZone';
import styles from './BookingFlight.module.css';

type BookingFlightProps = {
  flight: Flight;
  passengers: number;
};

export function BookingFlight({ flight, passengers }: BookingFlightProps) {
  const { cities } = useCities();
  const departureZone = resolveFlightCityTimeZone(cities, flight.origin);
  const arrivalZone = resolveFlightCityTimeZone(cities, flight.destination);
  const total =
    passengers > 1 ? totalMoney(flight.price, passengers) : null;

  return (
    <div className={styles.summary} data-testid="booking-flight">
      <p className={styles.airline}>
        {flight.airline.name} · {flight.flightNumber}
      </p>

      <div className={styles.body}>
        <div className={styles.main}>
          <p className={styles.route}>
            <span className={styles.city}>{flight.origin.name}</span>
            <span className="srOnly">→</span>
            <span className={styles.routeLine} aria-hidden="true">
              <span className={styles.dot} />
              <span className={styles.line} />
              <span className={styles.dot} />
            </span>
            <span className={styles.city}>{flight.destination.name}</span>
          </p>
          <p className={styles.schedule}>
            {formatDateTime(flight.departureAt, departureZone)} —{' '}
            {formatDateTime(flight.arrivalAt, arrivalZone)}
          </p>
        </div>

        <div className={styles.fares}>
          <p className={styles.price}>
            {formatPrice(flight.price)}
            <span className={styles.priceHint}> за пассажира</span>
          </p>
          {total ? (
            <p className={styles.total} data-testid="booking-flight-total-price">
              Итого: {formatPrice(total)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
