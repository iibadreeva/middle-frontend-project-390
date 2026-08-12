import { useNavigate, useSearchParams } from 'react-router-dom';
import { FlightList } from '../components/FlightList/FlightList';
import { SearchForm } from '../components/SearchForm/SearchForm';
import type { SearchFormValues } from '../components/SearchForm/SearchForm';
import { defaultSearchValues, mockFlights } from '../data/mockFlights';
import styles from './Page.module.css';

export function FlightsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const values: SearchFormValues = {
    origin: params.get('origin') ?? defaultSearchValues.origin,
    destination: params.get('destination') ?? defaultSearchValues.destination,
    date: params.get('date') ?? defaultSearchValues.date,
    passengers: Number(params.get('passengers') ?? defaultSearchValues.passengers),
  };

  function handleSubmit(nextValues: SearchFormValues) {
    const query = new URLSearchParams({
      origin: nextValues.origin,
      destination: nextValues.destination,
      date: nextValues.date,
      passengers: String(nextValues.passengers),
    });

    navigate(`/flights?${query}`);
  }

  return (
    <section className={styles.page} data-testid="flights-page">
      <SearchForm key={params.toString()} values={values} onSubmit={handleSubmit} />
      <FlightList flights={mockFlights} />
    </section>
  );
}
