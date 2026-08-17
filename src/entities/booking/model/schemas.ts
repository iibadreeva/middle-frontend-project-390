import { FlightSchema, MoneySchema } from '@entities/flight';
import { z } from 'zod';

export const BookingStatusSchema = z.enum(['confirmed', 'cancelled']);

export const PassengerSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  documentNumber: z.string(),
});

export const ContactSchema = z.object({
  email: z.string(),
  phone: z.string(),
});

export const BookingSchema = z.object({
  code: z.string(),
  status: BookingStatusSchema,
  flight: FlightSchema,
  passengers: z.array(PassengerSchema),
  contact: ContactSchema,
  totalPrice: MoneySchema,
  createdAt: z.string(),
});

export type BookingStatus = z.infer<typeof BookingStatusSchema>;
export type Passenger = z.infer<typeof PassengerSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Booking = z.infer<typeof BookingSchema>;
