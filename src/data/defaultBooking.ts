import type { BookingFormValues } from '../components/BookingForm/BookingForm';

export const defaultBookingValues: BookingFormValues = {
  email: 'ivan@example.com',
  phone: '+7 999 000-11-22',
  passengers: [
    {
      firstName: 'Иван',
      lastName: 'Петров',
      dateOfBirth: '',
      documentNumber: '4509 123456',
    },
  ],
};
