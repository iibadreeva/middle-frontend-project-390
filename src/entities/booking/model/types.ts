import type { Contact, Passenger } from './schemas';

export type {
  Booking,
  BookingStatus,
  Contact,
  Passenger,
} from './schemas';

export type CreateBookingRequest = {
  flightId: string;
  passengers: Passenger[];
  contact: Contact;
};
