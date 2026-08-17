import type { FormFieldClassNames } from '@shared/ui/form';
import styles from './BookingForm.module.css';

export const bookingFormFieldClassNames: FormFieldClassNames = {
  field: styles.field,
  label: styles.label,
  control: styles.input,
  error: styles.fieldErrorSr,
};
