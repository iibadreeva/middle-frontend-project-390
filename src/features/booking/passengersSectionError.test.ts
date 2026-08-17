import { describe, expect, it } from 'vitest';
import type { FieldError, FieldErrors } from 'react-hook-form';
import {
  BOOKING_DOB_ERROR,
  BOOKING_DOB_INVALID_ERROR,
  BOOKING_PASSENGERS_ERROR,
  BOOKING_REQUIRED_ERROR,
  BOOKING_SEATS_ERROR,
  bookingPassengerLabel,
} from '@shared/lib/messages';
import type { BookingFormValues } from './bookingSchema';
import {
  passengersRootMessage,
  passengersSectionAlert,
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

describe('passengersSectionAlert', () => {
  it('numbers passengers from one', () => {
    expect(bookingPassengerLabel(0)).toBe('Пассажир 1');
    expect(bookingPassengerLabel(1)).toBe('Пассажир 2');
  });

  it('prefers root over field messages', () => {
    expect(
      passengersSectionAlert(
        {
          ...rootMessage(BOOKING_PASSENGERS_ERROR),
          0: {
            firstName: {
              type: 'custom',
              message: BOOKING_REQUIRED_ERROR,
            } satisfies FieldError,
          },
        } as PassengersErrors,
        { seatsShortage: false },
      ),
    ).toBe(BOOKING_PASSENGERS_ERROR);
  });

  it('shows required summary when only required field errors exist', () => {
    expect(
      passengersSectionAlert(
        [
          {
            firstName: {
              type: 'custom',
              message: BOOKING_REQUIRED_ERROR,
            } satisfies FieldError,
          },
        ],
        { seatsShortage: false },
      ),
    ).toBe(BOOKING_REQUIRED_ERROR);
  });

  it('keeps required together with specific field messages', () => {
    expect(
      passengersSectionAlert(
        [
          {
            firstName: {
              type: 'custom',
              message: BOOKING_REQUIRED_ERROR,
            } satisfies FieldError,
            dateOfBirth: {
              type: 'custom',
              message: BOOKING_DOB_ERROR,
            } satisfies FieldError,
          },
        ],
        { seatsShortage: false },
      ),
    ).toBe(`${BOOKING_REQUIRED_ERROR}. ${BOOKING_DOB_ERROR}`);
  });

  it('reads field messages from object-shaped RHF errors', () => {
    expect(
      passengersSectionAlert(
        {
          0: {
            dateOfBirth: {
              type: 'custom',
              message: BOOKING_DOB_ERROR,
            } satisfies FieldError,
          },
        } as PassengersErrors,
        { seatsShortage: false },
      ),
    ).toBe(BOOKING_DOB_ERROR);
  });

  it('joins distinct specific messages for one passenger', () => {
    expect(
      passengersSectionAlert(
        [
          {
            dateOfBirth: {
              type: 'custom',
              message: BOOKING_DOB_INVALID_ERROR,
            } satisfies FieldError,
            documentNumber: {
              type: 'custom',
              message: BOOKING_DOB_ERROR,
            } satisfies FieldError,
          },
        ],
        { seatsShortage: false },
      ),
    ).toBe(`${BOOKING_DOB_INVALID_ERROR}. ${BOOKING_DOB_ERROR}`);
  });

  it('names the passenger when several passengers have field errors', () => {
    expect(
      passengersSectionAlert(
        [
          {
            firstName: {
              type: 'custom',
              message: BOOKING_REQUIRED_ERROR,
            } satisfies FieldError,
          },
          {
            dateOfBirth: {
              type: 'custom',
              message: BOOKING_DOB_ERROR,
            } satisfies FieldError,
          },
        ],
        { seatsShortage: false },
      ),
    ).toBe(
      `${bookingPassengerLabel(0)}: ${BOOKING_REQUIRED_ERROR}. ${bookingPassengerLabel(1)}: ${BOOKING_DOB_ERROR}`,
    );
  });

  it('names a later passenger when only they have field errors', () => {
    expect(
      passengersSectionAlert(
        {
          1: {
            dateOfBirth: {
              type: 'custom',
              message: BOOKING_DOB_ERROR,
            } satisfies FieldError,
          },
        } as PassengersErrors,
        { seatsShortage: false },
      ),
    ).toBe(`${bookingPassengerLabel(1)}: ${BOOKING_DOB_ERROR}`);
  });
});
