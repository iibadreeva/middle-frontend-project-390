import { FormEvent, useState } from 'react';
import { BOOKING_LOOKUP_REQUIRED_ERROR } from '@shared/lib/messages';
import styles from './BookingLookupForm.module.css';

export type BookingLookupValues = {
  code: string;
  lastName: string;
};

type BookingLookupFormProps = {
  values?: BookingLookupValues;
  onSubmit?: (values: BookingLookupValues) => void;
  disabled?: boolean;
};

export function BookingLookupForm({
  values = { code: '', lastName: '' },
  onSubmit,
  disabled = false,
}: BookingLookupFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const nextValues = {
      code: String(formData.get('code') ?? values.code).trim(),
      lastName: String(formData.get('lastName') ?? values.lastName).trim(),
    };

    if (!nextValues.code || !nextValues.lastName) {
      setFormError(BOOKING_LOOKUP_REQUIRED_ERROR);
      return;
    }

    setFormError(null);
    onSubmit?.(nextValues);
  }

  return (
    <form
      className={styles.form}
      data-testid="booking-lookup-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <label className={styles.field}>
        <span className={styles.label}>Код брони</span>
        <input
          className={styles.input}
          type="text"
          name="code"
          defaultValue={values.code}
          autoComplete="off"
          required
          disabled={disabled}
          data-testid="lookup-code"
          onChange={() => setFormError(null)}
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
          required
          disabled={disabled}
          data-testid="lookup-lastName"
          onChange={() => setFormError(null)}
        />
      </label>

      <button
        className={styles.submit}
        type="submit"
        disabled={disabled}
        data-testid="lookup-submit"
      >
        Найти
      </button>

      {formError ? (
        <p
          className={styles.error}
          data-testid="lookup-form-error"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
    </form>
  );
}
