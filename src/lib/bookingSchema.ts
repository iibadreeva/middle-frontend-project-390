import { z } from 'zod';
import { isValidIsoDate, todayIsoDate } from './format';
import {
  BOOKING_DOB_ERROR,
  BOOKING_DOB_INVALID_ERROR,
  BOOKING_EMAIL_ERROR,
  BOOKING_PASSENGERS_ERROR,
  BOOKING_PHONE_ERROR,
  BOOKING_REQUIRED_ERROR,
} from './messages';

export const MAX_BOOKING_PASSENGERS = 9;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function isFutureIsoDate(value: string): boolean {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return value > todayIsoDate(localZone);
}

const requiredTrimmed = z
  .string()
  .trim()
  .min(1, { message: BOOKING_REQUIRED_ERROR });

const passengerSchema = z.object({
  firstName: requiredTrimmed,
  lastName: requiredTrimmed,
  dateOfBirth: z
    .string()
    .trim()
    .min(1, { message: BOOKING_REQUIRED_ERROR })
    .refine((value) => isValidIsoDate(value), {
      message: BOOKING_DOB_INVALID_ERROR,
    })
    .refine((value) => !isFutureIsoDate(value), {
      message: BOOKING_DOB_ERROR,
    }),
  documentNumber: requiredTrimmed,
});

/**
 * Схема полей брони. Лимит свободных мест — в UI (`seatsShortage`):
 * `seatsAvailable` часто приходит уже после mount формы.
 */
export const bookingSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: BOOKING_REQUIRED_ERROR })
    .refine((value) => EMAIL_PATTERN.test(value), {
      message: BOOKING_EMAIL_ERROR,
    }),
  phone: z
    .string()
    .trim()
    .min(1, { message: BOOKING_REQUIRED_ERROR })
    .refine((value) => isValidPhone(value), {
      message: BOOKING_PHONE_ERROR,
    }),
  passengers: z
    .array(passengerSchema)
    .min(1, { message: BOOKING_REQUIRED_ERROR })
    .max(MAX_BOOKING_PASSENGERS, { message: BOOKING_PASSENGERS_ERROR }),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
export type BookingPassengerValues = BookingFormValues['passengers'][number];
