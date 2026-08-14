import { useId } from 'react';
import { Controller } from 'react-hook-form';
import type { City } from '@shared/api';
import { todayIsoDate } from '@shared/lib/format';
import type { SearchFormValues } from '../resolveSearchValues';
import { FieldError } from '@shared/ui/FieldError';
import { CitySelect } from './CitySelect';
import styles from './SearchForm.module.css';
import { useSearchForm } from './useSearchForm';

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
  const { form, originZone, submit } = useSearchForm(values, cities, onSubmit);
  const {
    control,
    register,
    trigger,
    formState: { errors },
  } = form;

  function onCityChange(
    onChange: (code: string) => void,
    code: string,
  ) {
    onChange(code);
    // date тоже: смена origin меняет TZ и границу «сегодня».
    void trigger(['origin', 'destination', 'date']);
  }

  const dateErrorId = useId();
  const passengersErrorId = useId();
  const originErrorId = useId();
  const destinationErrorId = useId();
  const externalErrorId = useId();

  const dateError = errors.date?.message;
  const passengersError = errors.passengers?.message;

  return (
    <form
      className={styles.form}
      data-testid="flight-search-form"
      noValidate
      onSubmit={(event) => {
        if (submitDisabled) {
          event.preventDefault();
          return;
        }
        void submit(event);
      }}
      aria-describedby={externalError ? externalErrorId : undefined}
    >
      <Controller
        name="origin"
        control={control}
        render={({ field, fieldState }) => (
          <CitySelect
            ref={field.ref}
            label="Откуда"
            name={field.name}
            value={field.value}
            cities={cities}
            testId="search-origin"
            onChange={(code) => onCityChange(field.onChange, code)}
            onBlur={field.onBlur}
            invalid={Boolean(fieldState.error)}
            errorId={originErrorId}
            errorMessage={fieldState.error?.message}
            errorTestId="search-origin-error"
          />
        )}
      />

      <Controller
        name="destination"
        control={control}
        render={({ field, fieldState }) => (
          <CitySelect
            ref={field.ref}
            label="Куда"
            name={field.name}
            value={field.value}
            cities={cities}
            testId="search-destination"
            onChange={(code) => onCityChange(field.onChange, code)}
            onBlur={field.onBlur}
            invalid={Boolean(fieldState.error)}
            errorId={destinationErrorId}
            errorMessage={fieldState.error?.message}
            errorTestId="search-destination-error"
          />
        )}
      />

      <label className={styles.field}>
        <span className={styles.label}>Дата</span>
        <input
          className={styles.input}
          type="date"
          min={todayIsoDate(originZone)}
          aria-invalid={Boolean(dateError) || undefined}
          aria-describedby={dateError ? dateErrorId : undefined}
          data-testid="search-date"
          {...register('date', {
            // mode onSubmit: ошибки от sync/trigger иначе залипают до submit.
            onChange: () => {
              void trigger('date');
            },
          })}
        />
        <FieldError
          className={styles.fieldError}
          id={dateErrorId}
          testId="search-date-error"
        >
          {dateError}
        </FieldError>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Пассажиры</span>
        <input
          className={styles.input}
          type="number"
          min={1}
          max={9}
          aria-invalid={Boolean(passengersError) || undefined}
          aria-describedby={passengersError ? passengersErrorId : undefined}
          data-testid="search-passengers"
          {...register('passengers', {
            valueAsNumber: true,
            onChange: () => {
              void trigger('passengers');
            },
          })}
        />
        <FieldError
          className={styles.fieldError}
          id={passengersErrorId}
          testId="search-passengers-error"
        >
          {passengersError}
        </FieldError>
      </label>

      <button
        className={styles.submit}
        type="submit"
        disabled={submitDisabled}
        data-testid="search-submit"
      >
        Найти
      </button>

      <FieldError
        className={styles.formError}
        id={externalErrorId}
        testId="search-form-error"
        live="assertive"
      >
        {externalError}
      </FieldError>
    </form>
  );
}
