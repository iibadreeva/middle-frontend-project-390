import { FormEvent } from 'react';
import styles from './BookingLookupForm.module.css';

export type BookingLookupValues = {
  code: string;
  lastName: string;
};

type BookingLookupFormProps = {
  values: BookingLookupValues;
  onSubmit?: (values: BookingLookupValues) => void;
};

export function BookingLookupForm({ values, onSubmit }: BookingLookupFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit?.({
      code: String(formData.get('code') ?? values.code).trim(),
      lastName: String(formData.get('lastName') ?? values.lastName).trim(),
    });
  }

  return (
    <form
      className={styles.form}
      data-testid="booking-lookup-form"
      onSubmit={handleSubmit}
    >
      <label className={styles.field}>
        <span className={styles.label}>Код брони</span>
        <input
          className={styles.input}
          type="text"
          name="code"
          defaultValue={values.code}
          autoComplete="off"
          data-testid="booking-lookup-code"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Фамилия</span>
        <input
          className={styles.input}
          type="text"
          name="lastName"
          defaultValue={values.lastName}
          autoComplete="family-name"
          data-testid="booking-lookup-lastname"
        />
      </label>

      <button
        className={styles.submit}
        type="submit"
        data-testid="booking-lookup-submit"
      >
        Найти
      </button>
    </form>
  );
}
