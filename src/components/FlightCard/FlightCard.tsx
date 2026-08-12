import { Link } from 'react-router-dom';
import styles from './FlightCard.module.css';

export type FlightCardData = {
  id: string;
  airlineName: string;
  flightNumber: string;
  originName: string;
  destinationName: string;
  departureLabel: string;
  arrivalLabel: string;
  durationMinutes: number;
  priceLabel: string;
};

type FlightCardProps = {
  flight: FlightCardData;
};

export function FlightCard({ flight }: FlightCardProps) {
  return (
    <article className={styles.card} data-testid="flight-card">
      <div className={styles.main}>
        <h2 className={styles.airline}>
          {flight.airlineName} · {flight.flightNumber}
        </h2>
        <p className={styles.route}>
          {flight.originName} → {flight.destinationName}
        </p>
        <p className={styles.schedule}>
          {flight.departureLabel} — {flight.arrivalLabel} ·{' '}
          {flight.durationMinutes} мин
        </p>
      </div>

      <div className={styles.aside}>
        <p className={styles.price}>{flight.priceLabel}</p>
        <Link
          className={styles.book}
          to={`/booking/${flight.id}`}
          data-testid="flight-book-button"
        >
          Забронировать
        </Link>
      </div>
    </article>
  );
}
