import { FlightResults } from '../components/FlightResults/FlightResults';
import { SearchForm } from '../components/SearchForm/SearchForm';
import { useCities } from '../hooks/useCities';
import { useFlightSearch } from '../hooks/useFlightSearch';
import { FLIGHTS_SEARCH_ERROR } from '../lib/messages';
import styles from './Page.module.css';

export function SearchPage() {
  const { cities, notice: citiesNotice, ready: citiesReady } = useCities();
  const {
    values,
    valuesError,
    status,
    flights,
    errorMessage,
    submit,
  } = useFlightSearch(cities, citiesReady);

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
          cities={cities}
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
        externalError={valuesError}
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
