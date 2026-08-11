import { useParams } from 'react-router-dom';
import styles from './Page.module.css';

export function BookingViewPage() {
  const { code } = useParams();

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Просмотр брони</h1>
      <p className={styles.placeholder}>
        Код: {code ?? '—'}. Здесь будут поиск по коду + фамилии, детали брони и
        отмена через /api/bookings.
      </p>
    </section>
  );
}
