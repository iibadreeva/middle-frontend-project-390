import { useId, type ReactNode } from 'react';
import type { FieldErrors } from 'react-hook-form';
import type { Money } from '@shared/api';
import type { BookingFormValues, BookingPassengerValues } from '../bookingSchema';
import { formatPrice, totalMoney } from '@shared/lib/format';
import { BOOKING_SEATS_ERROR } from '@shared/lib/messages';
import { FieldError } from '@shared/ui/FieldError';
import { BookingFormActions } from './BookingFormActions';
import styles from './BookingForm.module.css';
import { PassengerFields } from './PassengerFields';
import { useBookingForm } from './useBookingForm';

export type { BookingFormValues, BookingPassengerValues };

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

function passengersRootMessage(
  passengers: FieldErrors<BookingFormValues>['passengers'],
): string | undefined {
  if (!passengers) {
    return undefined;
  }

  if ('root' in passengers && passengers.root?.message) {
    return passengers.root.message;
  }

  if (!Array.isArray(passengers) && typeof passengers.message === 'string') {
    return passengers.message;
  }

  return undefined;
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
  const formInstanceId = useId();
  const emailErrorId = useId();
  const phoneErrorId = useId();
  const passengersErrorId = useId();
  const externalErrorId = useId();

  const {
    form,
    fields,
    passengerCount,
    canAddPassenger,
    seatsShortage,
    addPassenger,
    removePassenger,
    submit,
    onFieldEdit,
  } = useBookingForm({
    initialValues,
    seatsAvailable,
    onDismissExternalError,
    onSubmit,
  });

  const {
    register,
    formState: { errors },
  } = form;

  const emailError = errors.email?.message;
  const phoneError = errors.phone?.message;
  const passengersError = passengersRootMessage(errors.passengers);
  const passengersDescribedBy = passengersError
    ? passengersErrorId
    : undefined;
  const totalLabel =
    unitPrice && passengerCount > 1
      ? `Итого: ${formatPrice(totalMoney(unitPrice, passengerCount))}`
      : null;

  return (
    <form
      className={styles.form}
      data-testid="booking-form"
      noValidate
      onSubmit={(event) => {
        if (submitDisabled || submitting || seatsShortage) {
          event.preventDefault();
          return;
        }
        void submit(event);
      }}
      aria-labelledby={formInstanceId}
      aria-describedby={externalError ? externalErrorId : undefined}
    >
      <h2
        className={styles.heading}
        data-testid="booking-heading"
        id={formInstanceId}
      >
        Оформление бронирования
      </h2>

      {flightSlot?.(passengerCount)}

      <div className={styles.contact} data-testid="booking-contact">
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            type="email"
            autoComplete="email"
            disabled={submitting}
            aria-invalid={Boolean(emailError) || undefined}
            aria-describedby={emailError ? emailErrorId : undefined}
            data-testid="contact-email"
            {...register('email', { onChange: () => onFieldEdit() })}
          />
          <FieldError
            className={styles.error}
            id={emailErrorId}
            testId="contact-email-error"
          >
            {emailError}
          </FieldError>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <input
            className={styles.input}
            type="tel"
            autoComplete="tel"
            disabled={submitting}
            aria-invalid={Boolean(phoneError) || undefined}
            aria-describedby={phoneError ? phoneErrorId : undefined}
            data-testid="contact-phone"
            {...register('phone', { onChange: () => onFieldEdit() })}
          />
          <FieldError
            className={styles.error}
            id={phoneErrorId}
            testId="contact-phone-error"
          >
            {phoneError}
          </FieldError>
        </label>
      </div>

      <div
        data-testid="passengers-section"
        role="group"
        aria-label="Пассажиры"
        aria-describedby={passengersDescribedBy}
      >
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

        <FieldError
          className={styles.error}
          id={passengersErrorId}
          testId="passengers-error"
        >
          {passengersError}
        </FieldError>

        <ul className={styles.passengers} data-testid="passengers-list">
          {fields.map((field, index) => (
            <PassengerFields
              key={field.id}
              index={index}
              register={register}
              errors={errors}
              canRemove={fields.length > 1}
              disabled={submitting}
              onFieldEdit={onFieldEdit}
              onRemove={() => removePassenger(index)}
            />
          ))}
        </ul>
      </div>

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
          addPassenger();
        }}
      />

      <FieldError
        className={styles.error}
        id={externalErrorId}
        testId="booking-error"
        live="assertive"
      >
        {externalError}
      </FieldError>
    </form>
  );
}
