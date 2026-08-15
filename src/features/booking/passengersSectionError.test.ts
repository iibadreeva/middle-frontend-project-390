import { describe, expect, it } from 'vitest';
import type { FieldError, FieldErrors } from 'react-hook-form';
import {
  BOOKING_PASSENGERS_ERROR,
  BOOKING_SEATS_ERROR,
} from '@shared/lib/messages';
import type { BookingFormValues } from './bookingSchema';
import {
  passengersRootMessage,
  passengersSectionError,
} from './passengersSectionError';

type PassengersErrors = FieldErrors<BookingFormValues>['passengers'];

function rootMessage(message: string): PassengersErrors {
  return { root: { type: 'custom', message } satisfies FieldError };
}

function fieldMessage(message: string): PassengersErrors {
  return { type: 'custom', message } satisfies FieldError;
}

describe('passengersRootMessage', () => {
  it('reads message from root', () => {
    expect(passengersRootMessage(rootMessage(BOOKING_PASSENGERS_ERROR))).toBe(
      BOOKING_PASSENGERS_ERROR,
    );
  });

  it('reads message from non-array field error', () => {
    expect(passengersRootMessage(fieldMessage(BOOKING_SEATS_ERROR))).toBe(
      BOOKING_SEATS_ERROR,
    );
  });
});

describe('passengersSectionError', () => {
  it('hides only seats root while seatsShortage UX owns the alert', () => {
    expect(
      passengersSectionError(fieldMessage(BOOKING_SEATS_ERROR), {
        seatsShortage: true,
      }),
    ).toBeUndefined();
    expect(
      passengersSectionError(rootMessage(BOOKING_PASSENGERS_ERROR), {
        seatsShortage: true,
      }),
    ).toBe(BOOKING_PASSENGERS_ERROR);
  });

  it('keeps root passengers messages when seatsShortage is false', () => {
    expect(
      passengersSectionError(fieldMessage(BOOKING_PASSENGERS_ERROR), {
        seatsShortage: false,
      }),
    ).toBe(BOOKING_PASSENGERS_ERROR);
    expect(
      passengersSectionError(fieldMessage(BOOKING_SEATS_ERROR), {
        seatsShortage: false,
      }),
    ).toBe(BOOKING_SEATS_ERROR);
  });
});
