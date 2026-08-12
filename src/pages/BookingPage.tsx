import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFlight } from '../api';
import {
  BookingForm,
  type BookingFormValues,
} from '../components/BookingForm/BookingForm';
import { ApiError } from '../lib/errors';
import { FLIGHT_LOAD_ERROR, FLIGHT_NOT_FOUND } from '../lib/messages';
import styles from './Page.module.css';

type FlightState = {
  flightId: string;
  label: string;
  ready: boolean;
};

export function BookingPage() {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<FlightState | null>(null);

  // Состояние привязано к flightId: смена рейса сразу же показывает загрузку,
  // без setState в теле эффекта.
  const current = state?.flightId === flightId ? state : null;
  const flightLabel = flightId
    ? (current?.label ?? 'Загрузка рейса…')
    : 'Рейс не выбран';
  const flightReady = current?.ready ?? false;

  useEffect(() => {
    if (!flightId) {
      return;
    }

    const controller = new AbortController();

    getFlight(flightId, controller.signal)
      .then((flight) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          flightId,
          label: `${flight.airline.name} · ${flight.flightNumber}: ${flight.origin.name} → ${flight.destination.name}`,
          ready: true,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setState({ flightId, label: FLIGHT_NOT_FOUND, ready: false });
          return;
        }
        console.error(error);
        setState({ flightId, label: FLIGHT_LOAD_ERROR, ready: false });
      });

    return () => controller.abort();
  }, [flightId]);

  function handleSubmit(values: BookingFormValues) {
    if (!flightReady) {
      return;
    }
    const lastName = values.passengers[0]?.lastName?.trim() || 'demo';
    navigate(
      `/bookings/0S54B6/confirmation?lastName=${encodeURIComponent(lastName)}`,
    );
  }

  return (
    <section className={styles.page} data-testid="booking-page">
      <BookingForm
        flightLabel={flightLabel}
        submitDisabled={!flightReady}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
