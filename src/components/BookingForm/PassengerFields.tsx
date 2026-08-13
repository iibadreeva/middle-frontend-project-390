import type { BookingPassengerValues } from '../../lib/bookingValidation';
import styles from './BookingForm.module.css';

type PassengerFieldsProps = {
  index: number;
  value: BookingPassengerValues;
  invalidFields: ReadonlySet<string>;
  errorId?: string;
  canRemove: boolean;
  disabled?: boolean;
  onChange: (field: keyof BookingPassengerValues, next: string) => void;
  onRemove: () => void;
};

function describedBy(
  invalid: boolean,
  errorId: string | undefined,
): string | undefined {
  return invalid && errorId ? errorId : undefined;
}

export function PassengerFields({
  index,
  value,
  invalidFields,
  errorId,
  canRemove,
  disabled = false,
  onChange,
  onRemove,
}: PassengerFieldsProps) {
  const prefix = `passengers.${index}`;

  return (
    <li className={styles.passengerCard} data-testid="passenger-item">
      <label className={styles.field}>
        <span className={styles.label}>Имя</span>
        <input
          className={styles.input}
          type="text"
          name={`${prefix}.firstName`}
          value={value.firstName}
          onChange={(event) => onChange('firstName', event.target.value)}
          autoComplete="given-name"
          disabled={disabled}
          aria-invalid={invalidFields.has(`${prefix}.firstName`) || undefined}
          aria-describedby={describedBy(
            invalidFields.has(`${prefix}.firstName`),
            errorId,
          )}
          data-testid={`passenger-${index}-firstName`}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Фамилия</span>
        <input
          className={styles.input}
          type="text"
          name={`${prefix}.lastName`}
          value={value.lastName}
          onChange={(event) => onChange('lastName', event.target.value)}
          autoComplete="family-name"
          disabled={disabled}
          aria-invalid={invalidFields.has(`${prefix}.lastName`) || undefined}
          aria-describedby={describedBy(
            invalidFields.has(`${prefix}.lastName`),
            errorId,
          )}
          data-testid={`passenger-${index}-lastName`}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Дата рождения</span>
        <input
          className={styles.input}
          type="date"
          name={`${prefix}.dateOfBirth`}
          value={value.dateOfBirth}
          onChange={(event) => onChange('dateOfBirth', event.target.value)}
          disabled={disabled}
          aria-invalid={invalidFields.has(`${prefix}.dateOfBirth`) || undefined}
          aria-describedby={describedBy(
            invalidFields.has(`${prefix}.dateOfBirth`),
            errorId,
          )}
          data-testid={`passenger-${index}-dob`}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Документ</span>
        <input
          className={styles.input}
          type="text"
          name={`${prefix}.documentNumber`}
          value={value.documentNumber}
          onChange={(event) => onChange('documentNumber', event.target.value)}
          disabled={disabled}
          aria-invalid={
            invalidFields.has(`${prefix}.documentNumber`) || undefined
          }
          aria-describedby={describedBy(
            invalidFields.has(`${prefix}.documentNumber`),
            errorId,
          )}
          data-testid={`passenger-${index}-document`}
        />
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
