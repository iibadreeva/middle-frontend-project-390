import { useParams } from 'react-router-dom';
import { BookingConfirmation } from '../components/BookingConfirmation/BookingConfirmation';
import { getMockConfirmation } from '../data/mockBooking';
import styles from './Page.module.css';

export function BookingConfirmationPage() {
  const { code } = useParams();
  const booking = getMockConfirmation(code);

  return (
    <section className={styles.page} data-testid="booking-confirmation-page">
      <BookingConfirmation booking={booking} />
    </section>
  );
}
