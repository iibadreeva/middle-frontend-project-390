import type { FieldErrors } from 'react-hook-form';
import { BOOKING_SEATS_ERROR } from '@shared/lib/messages';
import type { BookingFormValues } from './bookingSchema';

/** Корневое сообщение массива `passengers` (Zod/RHF: `.root` или `.message`). */
export function passengersRootMessage(
  passengers: FieldErrors<BookingFormValues>['passengers'],
): string | undefined {
  if (!passengers) {
    return undefined;
  }

  if ('root' in passengers && passengers.root?.message) {
    return passengers.root.message;
  }

  if (!Array.isArray(passengers) && typeof passengers.message === 'string') {
    return passengers.message;
  }

  return undefined;
}

export type PassengersSectionErrorOptions = {
  /** При shortage seats-текст показывает `seatsWarning`, не `passengers-error`. */
  seatsShortage: boolean;
};

/**
 * Root-ошибка секции пассажиров для UI.
 * При `seatsShortage` скрывает дубликат `BOOKING_SEATS_ERROR` (он уже в seatsWarning).
 */
export function passengersSectionError(
  passengers: FieldErrors<BookingFormValues>['passengers'],
  { seatsShortage }: PassengersSectionErrorOptions,
): string | undefined {
  const message = passengersRootMessage(passengers);
  if (seatsShortage && message === BOOKING_SEATS_ERROR) {
    return undefined;
  }
  return message;
}
