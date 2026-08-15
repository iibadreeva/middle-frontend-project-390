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

  return (
    <div className={styles.summary} data-testid="booking-flight">
      <p className={styles.airline}>
        {flight.airline.name} · {flight.flightNumber}
      </p>
      <p className={styles.route}>
        {flight.origin.name} → {flight.destination.name}
      </p>
      <p className={styles.schedule}>
        {formatDateTime(flight.departureAt, departureZone)} —{' '}
        {formatDateTime(flight.arrivalAt, arrivalZone)}
      </p>
      <p className={styles.price}>{formatPrice(flight.price)} за пассажира</p>
      {passengers > 1 ? (
        <p className={styles.total} data-testid="booking-flight-total-price">
          Итого: {formatPrice(totalMoney(flight.price, passengers))}
        </p>
      ) : null}
    </div>
  );
}
