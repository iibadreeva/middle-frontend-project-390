import type { BookingFormValues } from '../lib/bookingSchema';

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
