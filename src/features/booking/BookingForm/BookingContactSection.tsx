import { useId } from 'react';
import {
  useFormContext,
  useFormState,
  type RegisterOptions,
} from 'react-hook-form';
import { contactSectionMessage } from '../contactSectionError';
import type { BookingFormValues } from '../bookingSchema';
import { FieldError } from '@shared/ui/FieldError';
import { FormInput } from '@shared/ui/form';
import { bookingFormFieldClassNames } from './bookingFormFieldClassNames';
import styles from './BookingForm.module.css';

type BookingContactSectionProps = {
  headingId: string;
  submitting: boolean;
  fieldRegisterOptions?: RegisterOptions<BookingFormValues>;
};

/** Своя подписка на email/phone — секция пассажиров не ре-рендерится на каждый символ. */
export function BookingContactSection({
  headingId,
  submitting,
  fieldRegisterOptions,
}: BookingContactSectionProps) {
  const contactErrorId = useId();
  const { control } = useFormContext<BookingFormValues>();
  const { errors } = useFormState({
    control,
    name: ['email', 'phone'],
  });
  const contactAlert = contactSectionMessage(
    errors.email?.message,
    errors.phone?.message,
  );

  return (
    <div
      className={styles.section}
      data-testid="booking-contact"
      role="group"
      aria-labelledby={headingId}
    >
      <div className={styles.sectionHeading}>
        <h3 className={styles.sectionTitle} id={headingId}>
          Контакты
        </h3>
      </div>

      <FieldError
        className={styles.sectionAlert}
        id={contactErrorId}
        testId="booking-contact-error"
      >
        {contactAlert}
      </FieldError>

      <div className={styles.contact}>
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
    </div>
  );
}
