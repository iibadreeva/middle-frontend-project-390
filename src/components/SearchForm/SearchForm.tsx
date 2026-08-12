import { FormEvent } from 'react';
import styles from './SearchForm.module.css';

export type SearchFormValues = {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
};

type SearchFormProps = {
  values: SearchFormValues;
  cities?: Array<{ code: string; name: string }>;
  onSubmit?: (values: SearchFormValues) => void;
};

const defaultCities = [
  { code: 'MOW', name: 'Москва' },
  { code: 'LED', name: 'Санкт-Петербург' },
];

export function SearchForm({
  values,
  cities = defaultCities,
  onSubmit,
}: SearchFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit?.({
      origin: String(formData.get('origin') ?? values.origin),
      destination: String(formData.get('destination') ?? values.destination),
      date: String(formData.get('date') ?? values.date),
      passengers: Number(formData.get('passengers') ?? values.passengers),
    });
  }

  return (
    <form
      className={styles.form}
      data-testid="search-form"
      onSubmit={handleSubmit}
    >
      <label className={styles.field}>
        <span className={styles.label}>Откуда</span>
        <select
          className={styles.select}
          name="origin"
          defaultValue={values.origin}
          data-testid="search-origin"
        >
          {cities.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Куда</span>
        <select
          className={styles.select}
          name="destination"
          defaultValue={values.destination}
          data-testid="search-destination"
        >
          {cities.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Дата</span>
        <input
          className={styles.input}
          type="date"
          name="date"
          defaultValue={values.date}
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
          defaultValue={values.passengers}
          data-testid="search-passengers"
        />
      </label>

      <button className={styles.submit} type="submit" data-testid="search-submit">
        Найти
      </button>
    </form>
  );
}
