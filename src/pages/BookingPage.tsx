import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Flight } from '../api';
import { BookingFlight } from '../components/BookingFlight/BookingFlight';
import {
  BookingForm,
  type BookingFormValues,
} from '../components/BookingForm/BookingForm';
import { BookingSuccess } from '../components/BookingSuccess/BookingSuccess';
import { useCreateBooking } from '../hooks/useCreateBooking';
import { useFlight } from '../hooks/useFlight';
import { FLIGHT_LOAD_ERROR, FLIGHT_NOT_FOUND } from '../lib/messages';
import styles from './Page.module.css';

export function BookingPage() {
  const { flightId } = useParams();
  const { status: flightStatus, flight, reload } = useFlight(flightId);
  const {
    status: createStatus,
    booking,
    errorMessage,
    submit,
    clearError,
  } = useCreateBooking(flightId);

  const renderFlightSlot = useCallback(
    (passengerCount: number) => (
      <BookingFlightSlot flight={flight} passengerCount={passengerCount} />
    ),
    [flight],
  );

  function handleSubmit(values: BookingFormValues) {
    if (!flightId || flightStatus !== 'success') {
      return;
    }

    submit({
      flightId,
      contact: {
        email: values.email,
        phone: values.phone,
      },
      passengers: values.passengers,
    });
  }

  if (flightStatus === 'not-found') {
    return (
      <section className={styles.page} data-testid="booking-page">
        <p className={styles.empty} data-testid="flight-not-found" role="alert">
          {FLIGHT_NOT_FOUND}
        </p>
      </section>
    );
  }

  if (flightStatus === 'error') {
    return (
      <section className={styles.page} data-testid="booking-page">
        <p
          className={styles.empty}
          data-testid="booking-flight-error"
          role="alert"
        >
          {FLIGHT_LOAD_ERROR}
        </p>
        <button
          className={styles.retry}
          type="button"
          data-testid="booking-flight-retry"
          onClick={reload}
        >
          Повторить
        </button>
      </section>
    );
  }

  if (createStatus === 'success' && booking) {
    return (
      <section className={styles.page} data-testid="booking-page">
        <BookingSuccess booking={booking} />
      </section>
    );
  }

  return (
    <section className={styles.page} data-testid="booking-page">
      <BookingForm
        key={flightId}
        flightSlot={renderFlightSlot}
        unitPrice={flight?.price}
        seatsAvailable={flight?.seatsAvailable}
        submitDisabled={flightStatus !== 'success'}
        submitting={createStatus === 'submitting'}
        externalError={createStatus === 'error' ? errorMessage : null}
        onDismissExternalError={clearError}
        onSubmit={handleSubmit}
      />
    </section>
  );
}

function BookingFlightSlot({
  flight,
  passengerCount,
}: {
  flight: Flight | null;
  passengerCount: number;
}) {
  if (!flight) {
    return (
      <p className={styles.empty} data-testid="booking-flight">
        Загрузка рейса…
      </p>
    );
  }

  return <BookingFlight flight={flight} passengers={passengerCount} />;
}
