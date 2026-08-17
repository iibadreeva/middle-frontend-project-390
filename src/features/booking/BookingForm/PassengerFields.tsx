import { useId } from 'react';
import type { RegisterOptions } from 'react-hook-form';
import { todayIsoDate } from '@shared/lib/format';
import { bookingPassengerLabel } from '@shared/lib/messages';
import { FormInput } from '@shared/ui/form';
import type { BookingFormValues } from '../bookingSchema';
import { bookingFormFieldClassNames } from './bookingFormFieldClassNames';
import styles from './BookingForm.module.css';

type PassengerFieldsProps = {
  index: number;
  canRemove: boolean;
  disabled?: boolean;
  registerOptions?: RegisterOptions<BookingFormValues>;
  onRemove: () => void;
};

export function PassengerFields({
  index,
  canRemove,
  disabled = false,
  registerOptions,
  onRemove,
}: PassengerFieldsProps) {
  const idPrefix = useId();
  const dobMax = todayIsoDate(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  return (
    <li className={styles.passengerCard} data-testid="passenger-item">
      <div className={styles.passengerHeader}>
        <p className={styles.passengerTitle}>{bookingPassengerLabel(index)}</p>
        {canRemove ? (
          <button
            className={styles.remove}
            type="button"
            data-testid={`remove-passenger-${index}`}
            aria-label={`Удалить пассажира ${index + 1}`}
            disabled={disabled}
            onClick={onRemove}
          >
            Удалить
          </button>
        ) : null}
      </div>

      <div className={styles.passengerFields}>
        <FormInput<BookingFormValues>
          name={`passengers.${index}.firstName`}
          label="Имя"
          type="text"
          autoComplete="given-name"
          disabled={disabled}
          id={`${idPrefix}-firstName`}
          data-testid={`passenger-${index}-firstName`}
          errorTestId={`passenger-${index}-firstName-error`}
          classNames={bookingFormFieldClassNames}
          registerOptions={registerOptions}
        />

        <FormInput<BookingFormValues>
          name={`passengers.${index}.lastName`}
          label="Фамилия"
          type="text"
          autoComplete="family-name"
          disabled={disabled}
          id={`${idPrefix}-lastName`}
          data-testid={`passenger-${index}-lastName`}
          errorTestId={`passenger-${index}-lastName-error`}
          classNames={bookingFormFieldClassNames}
          registerOptions={registerOptions}
        />

        <FormInput<BookingFormValues>
          name={`passengers.${index}.dateOfBirth`}
          label="Дата рождения"
          type="date"
          max={dobMax}
          today={dobMax}
          disabled={disabled}
          id={`${idPrefix}-dob`}
          data-testid={`passenger-${index}-dob`}
          errorTestId={`passenger-${index}-dob-error`}
          classNames={bookingFormFieldClassNames}
          registerOptions={registerOptions}
        />

        <FormInput<BookingFormValues>
          name={`passengers.${index}.documentNumber`}
          label="Документ"
          type="text"
          disabled={disabled}
          id={`${idPrefix}-document`}
          data-testid={`passenger-${index}-document`}
          errorTestId={`passenger-${index}-document-error`}
          classNames={bookingFormFieldClassNames}
          registerOptions={registerOptions}
        />
      </div>
    </li>
  );
}
