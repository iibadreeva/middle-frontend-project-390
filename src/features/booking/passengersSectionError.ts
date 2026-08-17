import type { FieldErrors } from 'react-hook-form';
import {
  BOOKING_REQUIRED_ERROR,
  BOOKING_SEATS_ERROR,
  bookingPassengerLabel,
} from '@shared/lib/messages';
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

const PASSENGER_FIELD_KEYS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'documentNumber',
] as const;

type PassengerFieldErrors = {
  [K in (typeof PASSENGER_FIELD_KEYS)[number]]?: { message?: unknown };
};

function passengerErrorEntries(
  passengers: FieldErrors<BookingFormValues>['passengers'],
): Array<{ index: number; passenger: PassengerFieldErrors }> {
  if (!passengers || typeof passengers !== 'object') {
    return [];
  }

  if (Array.isArray(passengers)) {
    return passengers.flatMap((passenger, index) =>
      passenger ? [{ index, passenger }] : [],
    );
  }

  return Object.keys(passengers)
    .filter((key) => /^\d+$/.test(key))
    .map((key) => {
      const index = Number(key);
      const passenger = (passengers as Record<string, unknown>)[key];
      if (!passenger || typeof passenger !== 'object') {
        return undefined;
      }
      return { index, passenger: passenger as PassengerFieldErrors };
    })
    .filter(
      (entry): entry is { index: number; passenger: PassengerFieldErrors } =>
        entry != null,
    )
    .sort((left, right) => left.index - right.index);
}

function messagesForPassenger(passenger: PassengerFieldErrors): string[] {
  const specific: string[] = [];
  let required: string | undefined;

  for (const key of PASSENGER_FIELD_KEYS) {
    const message = passenger[key]?.message;
    if (typeof message !== 'string' || !message) {
      continue;
    }
    if (message === BOOKING_REQUIRED_ERROR) {
      required ??= message;
      continue;
    }
    if (!specific.includes(message)) {
      specific.push(message);
    }
  }

  if (specific.length > 0) {
    return required ? [required, ...specific] : specific;
  }
  return required ? [required] : [];
}

function joinMessages(messages: string[]): string | undefined {
  if (messages.length === 0) {
    return undefined;
  }
  return messages.join('. ');
}

/** Сообщения полей; массив или объект с числовыми ключами RHF. */
function passengerFieldMessages(
  passengers: FieldErrors<BookingFormValues>['passengers'],
): string | undefined {
  const entries = passengerErrorEntries(passengers).flatMap(
    ({ index, passenger }) => {
      const joined = joinMessages(messagesForPassenger(passenger));
      return joined ? [{ index, joined }] : [];
    },
  );

  if (entries.length === 0) {
    return undefined;
  }

  const namePassenger =
    entries.length > 1 || entries.some(({ index }) => index > 0);

  if (!namePassenger) {
    return entries[0].joined;
  }

  return entries
    .map(({ index, joined }) => `${bookingPassengerLabel(index)}: ${joined}`)
    .join('. ');
}

/**
 * Сообщение для сводки секции пассажиров: root, иначе поля.
 */
export function passengersSectionAlert(
  passengers: FieldErrors<BookingFormValues>['passengers'],
  options: PassengersSectionErrorOptions,
): string | undefined {
  const root = passengersSectionError(passengers, options);
  if (root) {
    return root;
  }
  return passengerFieldMessages(passengers);
}
