import type { BookingFormValues } from './bookingSchema';

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
