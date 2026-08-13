import { FormEvent, useId, useRef, useState, type ReactNode } from 'react';
import type { Money } from '../../api';
import {
  createEmptyBookingValues,
  emptyPassenger,
} from '../../data/defaultBooking';
import {
  MAX_BOOKING_PASSENGERS,
  validateBooking,
  type BookingFormValues,
  type BookingPassengerValues,
} from '../../lib/bookingValidation';
import { formatPrice, totalMoney } from '../../lib/format';
import { BOOKING_SEATS_ERROR } from '../../lib/messages';
import { BookingFormActions } from './BookingFormActions';
import styles from './BookingForm.module.css';
import { PassengerFields } from './PassengerFields';

export type { BookingFormValues, BookingPassengerValues };

type PassengerRow = BookingPassengerValues & { id: string };

type FormFeedback = {
  message: string | null;
  invalidFields: ReadonlySet<string>;
};

type BookingFormProps = {
  flightSlot?: (passengerCount: number) => ReactNode;
  unitPrice?: Money;
  initialValues?: BookingFormValues;
  seatsAvailable?: number;
  submitDisabled?: boolean;
  submitting?: boolean;
  externalError?: string | null;
  onDismissExternalError?: () => void;
  onSubmit?: (values: BookingFormValues) => void;
};

function createEmptyFeedback(): FormFeedback {
  return {
    message: null,
    invalidFields: new Set(),
  };
}

function trimPassenger(
  passenger: BookingPassengerValues,
): BookingPassengerValues {
  return {
    firstName: passenger.firstName.trim(),
    lastName: passenger.lastName.trim(),
    dateOfBirth: passenger.dateOfBirth.trim(),
    documentNumber: passenger.documentNumber.trim(),
  };
}

function withoutId(row: PassengerRow): BookingPassengerValues {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    documentNumber: row.documentNumber,
  };
}

export function BookingForm({
  flightSlot,
  unitPrice,
  initialValues,
  seatsAvailable,
  submitDisabled = false,
  submitting = false,
  externalError = null,
  onDismissExternalError,
  onSubmit,
}: BookingFormProps) {
  const idSeed = useRef(0);
  const allocateId = () => {
    idSeed.current += 1;
    return `passenger-${idSeed.current}`;
  };

  const [values, setValues] = useState(() => {
    const initial = initialValues ?? createEmptyBookingValues();
    return {
      email: initial.email,
      phone: initial.phone,
      passengers: initial.passengers.map((passenger, index) => ({
        id: `passenger-init-${index}`,
        ...passenger,
      })),
    };
  });
  const { email, phone, passengers } = values;
  const [feedback, setFeedback] = useState<FormFeedback>(createEmptyFeedback);
  const formInstanceId = useId();
  const errorId = useId();

  const passengerLimit = Math.min(
    MAX_BOOKING_PASSENGERS,
    seatsAvailable ?? MAX_BOOKING_PASSENGERS,
  );
  const canAddPassenger = passengers.length < passengerLimit;
  const seatsShortage =
    seatsAvailable != null && passengers.length > seatsAvailable;

  function clearFieldError(fieldKey: string) {
    onDismissExternalError?.();
    setFeedback((current) => {
      if (!current.invalidFields.has(fieldKey)) {
        return current;
      }

      const nextFields = new Set(current.invalidFields);
      nextFields.delete(fieldKey);
      return {
        message: nextFields.size === 0 ? null : current.message,
        invalidFields: nextFields,
      };
    });
  }

  function updatePassenger(
    index: number,
    field: keyof BookingPassengerValues,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      passengers: current.passengers.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger,
      ),
    }));
    clearFieldError(`passengers.${index}.${field}`);
  }

  function removePassenger(index: number) {
    setValues((current) => ({
      ...current,
      passengers: current.passengers.filter((_, i) => i !== index),
    }));
    setFeedback(createEmptyFeedback());
    onDismissExternalError?.();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled || submitting || seatsShortage) {
      return;
    }

    const nextValues: BookingFormValues = {
      email: email.trim(),
      phone: phone.trim(),
      passengers: passengers.map((row) => trimPassenger(withoutId(row))),
    };

    const { message, invalidFields: nextInvalid } = validateBooking(
      nextValues,
      { seatsAvailable },
    );
    if (message) {
      setFeedback({
        message,
        invalidFields: new Set(nextInvalid),
      });
      return;
    }

    setFeedback(createEmptyFeedback());
    onSubmit?.(nextValues);
  }

  const visibleError = feedback.message ?? externalError;
  const errorDescribedBy = visibleError ? errorId : undefined;
  const { invalidFields } = feedback;
  const totalLabel =
    unitPrice && passengers.length > 1
      ? `Итого: ${formatPrice(totalMoney(unitPrice, passengers.length))}`
      : null;

  return (
    <form
      className={styles.form}
      data-testid="booking-form"
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby={formInstanceId}
    >
      <h2
        className={styles.heading}
        data-testid="booking-heading"
        id={formInstanceId}
      >
        Оформление бронирования
      </h2>

      {flightSlot?.(passengers.length)}

      <div className={styles.contact} data-testid="booking-contact">
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            type="email"
            name="email"
            value={email}
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                email: event.target.value,
              }));
              clearFieldError('email');
            }}
            autoComplete="email"
            disabled={submitting}
            aria-invalid={invalidFields.has('email') || undefined}
            aria-describedby={
              invalidFields.has('email') ? errorDescribedBy : undefined
            }
            data-testid="contact-email"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <input
            className={styles.input}
            type="tel"
            name="phone"
            value={phone}
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                phone: event.target.value,
              }));
              clearFieldError('phone');
            }}
            autoComplete="tel"
            disabled={submitting}
            aria-invalid={invalidFields.has('phone') || undefined}
            aria-describedby={
              invalidFields.has('phone') ? errorDescribedBy : undefined
            }
            data-testid="contact-phone"
          />
        </label>
      </div>

      <div className={styles.divider} role="separator">
        Пассажиры
      </div>

      {seatsShortage ? (
        <p
          className={styles.seatsWarning}
          data-testid="booking-seats-warning"
          role="alert"
        >
          {BOOKING_SEATS_ERROR}
        </p>
      ) : null}

      <ul className={styles.passengers} data-testid="passengers-list">
        {passengers.map((passenger, index) => (
          <PassengerFields
            key={passenger.id}
            index={index}
            value={withoutId(passenger)}
            invalidFields={invalidFields}
            errorId={errorDescribedBy}
            canRemove={passengers.length > 1}
            disabled={submitting}
            onChange={(field, value) => updatePassenger(index, field, value)}
            onRemove={() => removePassenger(index)}
          />
        ))}
      </ul>

      <BookingFormActions
        canAddPassenger={canAddPassenger}
        submitting={submitting}
        submitDisabled={submitDisabled}
        seatsShortage={seatsShortage}
        totalLabel={totalLabel}
        onAddPassenger={() => {
          if (!canAddPassenger || submitting) {
            return;
          }
          setValues((current) => ({
            ...current,
            passengers: [
              ...current.passengers,
              { id: allocateId(), ...emptyPassenger() },
            ],
          }));
        }}
      />

      {visibleError ? (
        <p
          className={styles.error}
          data-testid="booking-error"
          id={errorId}
          role="alert"
        >
          {visibleError}
        </p>
      ) : null}
    </form>
  );
}
