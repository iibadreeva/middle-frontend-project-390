import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  BookingFlight,
  BookingFlightSkeleton,
  BookingForm,
  BookingSuccess,
  useCreateBookingWithToast,
  useFlight,
  type BookingFormValues,
} from '@features/booking';
import type { Flight } from '@entities/flight';
import { FLIGHT_LOAD_ERROR, FLIGHT_NOT_FOUND } from '@shared/lib/messages';
import { bookingViewHref } from '../routes';
import styles from './Page.module.css';

export function BookingPage() {
  const { flightId } = useParams();
  const { status: flightStatus, flight, reload } = useFlight(flightId);
  const {
    status: createStatus,
    booking,
    errorMessage,
    announceError,
    submit,
    clearError,
    dismissTransientToast,
  } = useCreateBookingWithToast(flightId);

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

    // Снимаем прошлый booking-toast до retry/success (чужие toast не трогаем).
    dismissTransientToast();

    submit({
      flightId,
      contact: {
        email: values.email,
        phone: values.phone,
      },
      passengers: values.passengers,
    });
  }

  if (createStatus === 'success' && booking) {
    const lastName = booking.passengers[0]?.lastName?.trim() ?? '';
    return (
      <section className={styles.page} data-testid="booking-page">
        <BookingSuccess
          booking={booking}
          viewBookingHref={
            lastName
              ? bookingViewHref(booking.code, { lastName })
              : bookingViewHref(booking.code)
          }
        />
      </section>
    );
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
        announceExternalError={announceError}
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
    return <BookingFlightSkeleton />;
  }

  return <BookingFlight flight={flight} passengers={passengerCount} />;
}
