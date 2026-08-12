import { useNavigate } from 'react-router-dom';
import { SearchForm } from '../components/SearchForm/SearchForm';
import type { SearchFormValues } from '../components/SearchForm/SearchForm';
import { defaultSearchValues } from '../data/mockFlights';
import styles from './Page.module.css';

export function SearchPage() {
  const navigate = useNavigate();

  function handleSubmit(values: SearchFormValues) {
    const query = new URLSearchParams({
      origin: values.origin,
      destination: values.destination,
      date: values.date,
      passengers: String(values.passengers),
    });

    navigate(`/flights?${query}`);
  }

  return (
    <section className={styles.page} data-testid="search-page">
      <SearchForm values={defaultSearchValues} onSubmit={handleSubmit} />
      <p className={styles.hint} data-testid="search-placeholder">
        Укажите маршрут и нажмите «Найти», чтобы увидеть доступные рейсы.
      </p>
    </section>
  );
}
