import { useId } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { BookingFormValues } from '../bookingSchema';
import { FieldError } from '@shared/ui/FieldError';
import styles from './BookingForm.module.css';

type PassengerFieldsProps = {
  index: number;
  register: UseFormRegister<BookingFormValues>;
  errors: FieldErrors<BookingFormValues>;
  canRemove: boolean;
  disabled?: boolean;
  onFieldEdit: () => void;
  onRemove: () => void;
};

export function PassengerFields({
  index,
  register,
  errors,
  canRemove,
  disabled = false,
  onFieldEdit,
  onRemove,
}: PassengerFieldsProps) {
  const idPrefix = useId();
  const passengerErrors = errors.passengers?.[index];

  function bind(field: 'firstName' | 'lastName' | 'dateOfBirth' | 'documentNumber') {
    const error = passengerErrors?.[field];
    const errorId = `${idPrefix}-${field}-error`;
    const registration = register(`passengers.${index}.${field}`, {
      onChange: () => onFieldEdit(),
    });

    return {
      registration,
      invalid: Boolean(error),
      errorMessage: error?.message,
      errorId,
    };
  }

  const firstName = bind('firstName');
  const lastName = bind('lastName');
  const dateOfBirth = bind('dateOfBirth');
  const documentNumber = bind('documentNumber');

  return (
    <li className={styles.passengerCard} data-testid="passenger-item">
      <label className={styles.field}>
        <span className={styles.label}>Имя</span>
        <input
          className={styles.input}
          type="text"
          autoComplete="given-name"
          disabled={disabled}
          aria-invalid={firstName.invalid || undefined}
          aria-describedby={firstName.invalid ? firstName.errorId : undefined}
          data-testid={`passenger-${index}-firstName`}
          {...firstName.registration}
        />
        <FieldError
          className={styles.error}
          id={firstName.errorId}
          testId={`passenger-${index}-firstName-error`}
        >
          {firstName.errorMessage}
        </FieldError>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Фамилия</span>
        <input
          className={styles.input}
          type="text"
          autoComplete="family-name"
          disabled={disabled}
          aria-invalid={lastName.invalid || undefined}
          aria-describedby={lastName.invalid ? lastName.errorId : undefined}
          data-testid={`passenger-${index}-lastName`}
          {...lastName.registration}
        />
        <FieldError
          className={styles.error}
          id={lastName.errorId}
          testId={`passenger-${index}-lastName-error`}
        >
          {lastName.errorMessage}
        </FieldError>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Дата рождения</span>
        <input
          className={styles.input}
          type="date"
          disabled={disabled}
          aria-invalid={dateOfBirth.invalid || undefined}
          aria-describedby={
            dateOfBirth.invalid ? dateOfBirth.errorId : undefined
          }
          data-testid={`passenger-${index}-dob`}
          {...dateOfBirth.registration}
        />
        <FieldError
          className={styles.error}
          id={dateOfBirth.errorId}
          testId={`passenger-${index}-dob-error`}
        >
          {dateOfBirth.errorMessage}
        </FieldError>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Документ</span>
        <input
          className={styles.input}
          type="text"
          disabled={disabled}
          aria-invalid={documentNumber.invalid || undefined}
          aria-describedby={
            documentNumber.invalid ? documentNumber.errorId : undefined
          }
          data-testid={`passenger-${index}-document`}
          {...documentNumber.registration}
        />
        <FieldError
          className={styles.error}
          id={documentNumber.errorId}
          testId={`passenger-${index}-document-error`}
        >
          {documentNumber.errorMessage}
        </FieldError>
      </label>

      {canRemove ? (
        <button
          className={styles.secondary}
          type="button"
          data-testid={`remove-passenger-${index}`}
          disabled={disabled}
          onClick={onRemove}
        >
          Удалить
        </button>
      ) : null}
    </li>
  );
}
