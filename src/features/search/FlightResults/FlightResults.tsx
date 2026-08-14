import type { Flight } from '@shared/api';
import type { RequestStatus } from '@shared/lib/requestStatus';
import { FlightCard } from '../FlightCard/FlightCard';
import styles from './FlightResults.module.css';

type FlightResultsProps =
  | { status: Extract<RequestStatus, 'loading'> }
  | {
      status: Extract<RequestStatus, 'success'>;
      flights: Flight[];
      passengers: number;
      getBookHref: (flightId: string) => string;
    }
  | { status: Extract<RequestStatus, 'error'>; errorMessage: string };

export function FlightResults(props: FlightResultsProps) {
  if (props.status === 'loading') {
    return (
      <p className={styles.message} data-testid="flights-loading" role="status">
        Ищем подходящие рейсы…
      </p>
    );
  }

  if (props.status === 'error') {
    return (
      <p
        className={`${styles.message} ${styles.error}`}
        data-testid="flights-error"
        role="alert"
      >
        {props.errorMessage}
      </p>
    );
  }

  if (props.flights.length === 0) {
    return (
      <p className={styles.message} data-testid="flights-empty" role="status">
        Рейсов не найдено
      </p>
    );
  }

  return (
    <ul className={styles.list} data-testid="flight-results">
      {props.flights.map((flight) => (
        <li key={flight.id}>
          <FlightCard
            flight={flight}
            passengers={props.passengers}
            bookHref={props.getBookHref(flight.id)}
          />
        </li>
      ))}
    </ul>
  );
}
