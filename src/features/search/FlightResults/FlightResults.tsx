import type { Flight } from '@entities/flight';
import { useCities } from '@entities/city';
import type { RequestStatus } from '@shared/lib/requestStatus';
import { reportError } from '@shared/lib/reportError';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { FlightCardContent } from '../FlightCard/FlightCard';
import { flightCardResetKeys } from '../FlightCard/flightCardResetKeys';
import { FlightCardSkeleton } from '../FlightCard/FlightCardSkeleton';
import { FlightCardErrorFallback } from './FlightCardErrorFallback';
import styles from './FlightResults.module.css';

const LOADING_SKELETON_COUNT = 4;

type FlightResultsProps =
  | { status: Extract<RequestStatus, 'loading'> }
  | {
      status: Extract<RequestStatus, 'success'>;
      flights: Flight[];
      passengers: number;
      getBookHref: (flightId: string) => string;
    }
  | { status: Extract<RequestStatus, 'error'>; errorMessage: string };

type FlightResultItemProps = {
  flight: Flight;
  passengers: number;
  bookHref: string;
};

/** Один рейс: cities читаются один раз на карточку (и для resetKeys, и для UI). */
function FlightResultItem({
  flight,
  passengers,
  bookHref,
}: FlightResultItemProps) {
  const { cities } = useCities();

  return (
    <ErrorBoundary
      resetKeys={flightCardResetKeys(flight, passengers, bookHref, cities)}
      onError={(error, info) => {
        reportError(`FlightCard render failed (${flight.id})`, error, info);
      }}
      fallbackRender={({ retry }) => (
        <FlightCardErrorFallback onRetry={retry} />
      )}
    >
      <FlightCardContent
        flight={flight}
        passengers={passengers}
        bookHref={bookHref}
        cities={cities}
      />
    </ErrorBoundary>
  );
}

type FlightResultsListProps = {
  flights: Flight[];
  passengers: number;
  getBookHref: (flightId: string) => string;
};

function FlightResultsList({
  flights,
  passengers,
  getBookHref,
}: FlightResultsListProps) {
  return (
    <ul className={styles.list} data-testid="flight-results">
      {flights.map((flight) => (
        <li key={flight.id}>
          <FlightResultItem
            flight={flight}
            passengers={passengers}
            bookHref={getBookHref(flight.id)}
          />
        </li>
      ))}
    </ul>
  );
}

export function FlightResults(props: FlightResultsProps) {
  if (props.status === 'loading') {
    return (
      <div
        data-testid="flights-loading"
        role="status"
        aria-busy="true"
        aria-label="Ищем подходящие рейсы"
      >
        <ul className={styles.list} aria-hidden="true">
          {Array.from({ length: LOADING_SKELETON_COUNT }, (_, index) => (
            <li key={index}>
              <FlightCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
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
    <FlightResultsList
      flights={props.flights}
      passengers={props.passengers}
      getBookHref={props.getBookHref}
    />
  );
}
