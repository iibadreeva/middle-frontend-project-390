import { useSearchParams } from 'react-router-dom';
import styles from './Page.module.css';

export function FlightsPage() {
  const [params] = useSearchParams();
  const origin = params.get('origin') ?? '—';
  const destination = params.get('destination') ?? '—';
  const date = params.get('date') ?? '—';
  const passengers = params.get('passengers') ?? '1';

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Результаты поиска</h1>
      <p className={styles.placeholder}>
        Параметры: {origin} → {destination}, {date}, пассажиров: {passengers}.
        Здесь будет список рейсов из /api/flights.
      </p>
    </section>
  );
}
