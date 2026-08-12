import { FormEvent } from 'react';
import type { City } from '../../api';
import { todayIsoDate } from '../../lib/format';
import { resolveTimeZoneByCode } from '../../lib/resolveCityTimeZone';
import type { SearchFormValues } from '../../lib/resolveSearchValues';
import { CitySelect } from './CitySelect';
import styles from './SearchForm.module.css';
import { useSearchFormDraft } from './useSearchFormDraft';

type SearchFormProps = {
  values: SearchFormValues;
  cities: City[];
  submitDisabled?: boolean;
  externalError?: string | null;
  onSubmit?: (values: SearchFormValues) => void;
};

export function SearchForm({
  values,
  cities,
  submitDisabled = false,
  externalError = null,
  onSubmit,
}: SearchFormProps) {
  const { draft, formError, updateDraft, commitDraft } = useSearchFormDraft(
    values,
    cities,
  );

  const originZone = resolveTimeZoneByCode(cities, draft.origin);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextValues = commitDraft();
    if (nextValues) {
      onSubmit?.(nextValues);
    }
  }

  const visibleError = formError ?? externalError;

  return (
    <form
      className={styles.form}
      data-testid="flight-search-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <CitySelect
        label="Откуда"
        name="origin"
        value={draft.origin}
        cities={cities}
        testId="search-origin"
        onChange={(code) => updateDraft('origin', code)}
      />

      <CitySelect
        label="Куда"
        name="destination"
        value={draft.destination}
        cities={cities}
        testId="search-destination"
        onChange={(code) => updateDraft('destination', code)}
      />

      <label className={styles.field}>
        <span className={styles.label}>Дата</span>
        <input
          className={styles.input}
          type="date"
          name="date"
          min={todayIsoDate(originZone)}
          value={draft.date}
          onChange={(event) => updateDraft('date', event.target.value)}
          data-testid="search-date"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Пассажиры</span>
        <input
          className={styles.input}
          type="number"
          name="passengers"
          min={1}
          max={9}
          value={Number.isFinite(draft.passengers) ? draft.passengers : ''}
          onChange={(event) =>
            updateDraft(
              'passengers',
              event.target.value === '' ? Number.NaN : Number(event.target.value),
            )
          }
          data-testid="search-passengers"
        />
      </label>

      <button
        className={styles.submit}
        type="submit"
        disabled={submitDisabled}
        data-testid="search-submit"
      >
        Найти
      </button>

      {visibleError ? (
        <p className={styles.error} data-testid="search-form-error" role="alert">
          {visibleError}
        </p>
      ) : null}
    </form>
  );
}
