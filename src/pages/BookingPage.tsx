import { useNavigate, useParams } from 'react-router-dom';
import {
  BookingForm,
  type BookingFormValues,
} from '../components/BookingForm/BookingForm';
import { mockFlights } from '../data/mockFlights';
import styles from './Page.module.css';

function formatFlightLabel(flightId: string | undefined) {
  const flight =
    mockFlights.find((item) => item.id === flightId) ?? mockFlights[0];

  return `${flight.airlineName} · ${flight.flightNumber}: ${flight.originName} → ${flight.destinationName}`;
}

export function BookingPage() {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const flightLabel = formatFlightLabel(flightId);

  function handleSubmit(values: BookingFormValues) {
    const lastName = values.passengers[0]?.lastName?.trim() || 'demo';
    navigate(
      `/bookings/0S54B6/confirmation?lastName=${encodeURIComponent(lastName)}`,
    );
  }

  return (
    <section className={styles.page} data-testid="booking-page">
      <BookingForm flightLabel={flightLabel} onSubmit={handleSubmit} />
    </section>
  );
}
