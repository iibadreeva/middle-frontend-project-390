import { useParams } from 'react-router-dom';
import styles from './Page.module.css';

export function BookingPage() {
  const { flightId } = useParams();

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Оформление брони</h1>
      <p className={styles.placeholder}>
        Рейс: {flightId ?? '—'}. Здесь будут данные рейса, форма пассажиров и
        создание брони через /api/bookings.
      </p>
    </section>
  );
}
