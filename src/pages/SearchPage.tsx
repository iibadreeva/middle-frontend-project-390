import { FlightResults } from '../components/FlightResults/FlightResults';
import { SearchForm } from '../components/SearchForm/SearchForm';
import { useFlightSearch } from '../hooks/useFlightSearch';
import { FLIGHTS_SEARCH_ERROR } from '../lib/messages';
import styles from './Page.module.css';

export function SearchPage() {
  const {
    cities,
    citiesNotice,
    values,
    valuesError,
    status,
    flights,
    errorMessage,
    submit,
  } = useFlightSearch();

  let results = null;
  if (!valuesError) {
    if (status === 'loading') {
      results = <FlightResults status="loading" />;
    } else if (status === 'error') {
      results = (
        <FlightResults
          status="error"
          errorMessage={errorMessage ?? FLIGHTS_SEARCH_ERROR}
        />
      );
    } else {
      results = (
        <FlightResults
          status="success"
          flights={flights}
          passengers={values.passengers}
        />
      );
    }
  }

  return (
    <section className={styles.page} data-testid="search-page">
      <SearchForm
        values={values}
        cities={cities}
        submitDisabled={!valuesError && status === 'loading'}
        onSubmit={submit}
      />
      {citiesNotice ? (
        <p className={styles.notice} data-testid="cities-fallback-notice" role="status">
          {citiesNotice}
        </p>
      ) : null}
      {results}
    </section>
  );
}
