import { FlightCard, type FlightCardData } from '../FlightCard/FlightCard';
import styles from './FlightList.module.css';

type FlightListProps = {
  flights: FlightCardData[];
};

export function FlightList({ flights }: FlightListProps) {
  return (
    <ul className={styles.list} data-testid="flight-list">
      {flights.map((flight) => (
        <li key={flight.id}>
          <FlightCard flight={flight} />
        </li>
      ))}
    </ul>
  );
}
