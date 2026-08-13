import type { BookingFormValues } from '../lib/bookingValidation';

export const emptyPassenger = (): BookingFormValues['passengers'][number] => ({
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  documentNumber: '',
});

export function createEmptyBookingValues(): BookingFormValues {
  return {
    email: '',
    phone: '',
    passengers: [emptyPassenger()],
  };
}
