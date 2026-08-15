import { useId, type ReactNode } from 'react';
import { FormProvider, useFormState } from 'react-hook-form';
import { formatPrice, totalMoney, type Money } from '@entities/booking';
import type { BookingFormValues, BookingPassengerValues } from '../bookingSchema';
import { passengersSectionError } from '../passengersSectionError';
import { BOOKING_SEATS_ERROR } from '@shared/lib/messages';
import { FieldError } from '@shared/ui/FieldError';
import { FormInput } from '@shared/ui/form';
import { bookingFormFieldClassNames } from './bookingFormFieldClassNames';
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

  // Только `passengers` — email/phone ошибки живут в FormInput.
  const { errors } = useFormState({
    control: form.control,
    name: 'passengers',
  });
  const passengersError = passengersSectionError(errors.passengers, {
    seatsShortage,
  });
  const passengersDescribedBy = passengersError
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

        <div className={styles.contact} data-testid="booking-contact">
          <FormInput<BookingFormValues>
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            disabled={submitting}
            data-testid="contact-email"
            errorTestId="contact-email-error"
            classNames={bookingFormFieldClassNames}
            registerOptions={fieldRegisterOptions}
          />

          <FormInput<BookingFormValues>
            name="phone"
            label="Телефон"
            type="tel"
            autoComplete="tel"
            disabled={submitting}
            data-testid="contact-phone"
            errorTestId="contact-phone-error"
            classNames={bookingFormFieldClassNames}
            registerOptions={fieldRegisterOptions}
          />
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
