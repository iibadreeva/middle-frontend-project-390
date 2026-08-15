import type { Flight, Money } from '@entities/flight';

export type Passenger = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentNumber: string;
};

export type Contact = {
  email: string;
  phone: string;
};

export type BookingStatus = 'confirmed' | 'cancelled';

export type Booking = {
  code: string;
  status: BookingStatus;
  flight: Flight;
  passengers: Passenger[];
  contact: Contact;
  totalPrice: Money;
  createdAt: string;
};

export type CreateBookingRequest = {
  flightId: string;
  passengers: Passenger[];
  contact: Contact;
};
