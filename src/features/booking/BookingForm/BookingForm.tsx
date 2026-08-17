import { useId, type ReactNode } from 'react';
import { FormProvider, useFormState } from 'react-hook-form';
import { formatPrice, totalMoney, type Money } from '@entities/booking';
import type { BookingFormValues, BookingPassengerValues } from '../bookingSchema';
import {
  passengersSectionAlert,
  passengersSectionError,
} from '../passengersSectionError';
import {
  BOOKING_PASSENGERS_HINT,
  BOOKING_SEATS_ERROR,
} from '@shared/lib/messages';
import { FieldError } from '@shared/ui/FieldError';
import { BookingContactSection } from './BookingContactSection';
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
  /** Live-region для sticky-ошибки; выключайте, если ошибку уже объявляет toast. */
  announceExternalError?: boolean;
  onDismissExternalError?: () => void;
  onSubmit?: (values: BookingFormValues) => void;
};

export function BookingForm({
  flightSlot,
  unitPrice,
  initialValues,
  seatsAvailable,
  submitDisabled = false,
  submitting = false,
  externalError = null,
  announceExternalError = true,
  onDismissExternalError,
  onSubmit,
}: BookingFormProps) {
  const formInstanceId = useId();
  const passengersErrorId = useId();
  const externalErrorId = useId();

  const {
    form,
    fields,
    passengerCount,
    canAddPassenger,
    seatsShortage,
    fieldRegisterOptions,
    addPassenger,
    removePassenger,
    submit,
  } = useBookingForm({
    initialValues,
    seatsAvailable,
    onDismissExternalError,
    onSubmit,
  });

  const { errors } = useFormState({
    control: form.control,
    name: 'passengers',
  });

  const passengersRoot = passengersSectionError(errors.passengers, {
    seatsShortage,
  });
  const passengersAlert = passengersSectionAlert(errors.passengers, {
    seatsShortage,
  });
  const passengersDescribedBy = passengersRoot
    ? passengersErrorId
    : undefined;
  const totalLabel =
    unitPrice && passengerCount > 1
      ? `Итого: ${formatPrice(totalMoney(unitPrice, passengerCount))}`
      : null;

  return (
    <FormProvider {...form}>
      <form
        className={styles.form}
        data-testid="booking-form"
        noValidate
        onSubmit={(event) => {
          // seatsShortage: short-circuit — seatsWarning уже на экране.
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

        <BookingContactSection
          headingId={`${formInstanceId}-contacts`}
          submitting={submitting}
          fieldRegisterOptions={fieldRegisterOptions}
        />

        <div
          className={styles.section}
          data-testid="passengers-section"
          role="group"
          aria-labelledby={`${formInstanceId}-passengers`}
          aria-describedby={passengersDescribedBy}
        >
          <div className={styles.sectionHeading}>
            <h3
              className={styles.sectionTitle}
              id={`${formInstanceId}-passengers`}
            >
              Пассажиры
            </h3>
            <p className={styles.sectionHint}>{BOOKING_PASSENGERS_HINT}</p>
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
            className={styles.sectionAlert}
            id={passengersErrorId}
            testId="passengers-error"
          >
            {passengersAlert}
          </FieldError>

          <ul className={styles.passengers} data-testid="passengers-list">
            {fields.map((field, index) => (
              <PassengerFields
                key={field.id}
                index={index}
                canRemove={fields.length > 1}
                disabled={submitting}
                registerOptions={fieldRegisterOptions}
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
          live={announceExternalError ? 'assertive' : undefined}
        >
          {externalError}
        </FieldError>
      </form>
    </FormProvider>
  );
}
