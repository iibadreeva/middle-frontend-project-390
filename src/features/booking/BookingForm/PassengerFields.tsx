import { useId } from 'react';
import type { RegisterOptions } from 'react-hook-form';
import type { BookingFormValues } from '../bookingSchema';
import { FormInput } from '@shared/ui/form';
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

  return (
    <li className={styles.passengerCard} data-testid="passenger-item">
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
