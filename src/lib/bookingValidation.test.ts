import { describe, expect, it, vi } from 'vitest';
import {
  BOOKING_DOB_ERROR,
  BOOKING_EMAIL_ERROR,
  BOOKING_PASSENGERS_ERROR,
  BOOKING_PHONE_ERROR,
  BOOKING_REQUIRED_ERROR,
  BOOKING_SEATS_ERROR,
} from './messages';
import * as format from './format';
import { validateBooking } from './bookingValidation';

const validPassenger = {
  firstName: 'Иван',
  lastName: 'Петров',
  dateOfBirth: '1990-05-20',
  documentNumber: '4509 123456',
};

const valid = {
  email: 'ivan@example.com',
  phone: '+79991234567',
  passengers: [validPassenger],
};

describe('validateBooking', () => {
  it('accepts valid values', () => {
    expect(validateBooking(valid)).toEqual({
      message: null,
      invalidFields: [],
    });
  });

  it('rejects empty required contact fields', () => {
    expect(validateBooking({ ...valid, email: '  ', phone: '' })).toEqual({
      message: BOOKING_REQUIRED_ERROR,
      invalidFields: ['email', 'phone'],
    });
  });

  it('rejects a malformed email', () => {
    expect(validateBooking({ ...valid, email: 'not-an-email' })).toEqual({
      message: BOOKING_EMAIL_ERROR,
      invalidFields: ['email'],
    });
  });

  it('collects email format and passenger errors together', () => {
    const result = validateBooking({
      ...valid,
      email: 'not-an-email',
      passengers: [{ ...validPassenger, firstName: '' }],
    });

    expect(result.message).toBe(BOOKING_REQUIRED_ERROR);
    expect(result.invalidFields).toEqual([
      'email',
      'passengers.0.firstName',
    ]);
  });

  it('rejects a malformed phone', () => {
    expect(validateBooking({ ...valid, phone: '123' })).toEqual({
      message: BOOKING_PHONE_ERROR,
      invalidFields: ['phone'],
    });
  });

  it('rejects empty passenger fields', () => {
    const result = validateBooking({
      ...valid,
      passengers: [
        {
          firstName: '',
          lastName: '  ',
          dateOfBirth: '',
          documentNumber: '',
        },
      ],
    });

    expect(result.message).toBe(BOOKING_REQUIRED_ERROR);
    expect(result.invalidFields).toEqual([
      'passengers.0.firstName',
      'passengers.0.lastName',
      'passengers.0.dateOfBirth',
      'passengers.0.documentNumber',
    ]);
  });

  it('rejects an invalid date of birth', () => {
    const result = validateBooking({
      ...valid,
      passengers: [{ ...validPassenger, dateOfBirth: '1990-02-30' }],
    });

    expect(result.message).toBe(BOOKING_REQUIRED_ERROR);
    expect(result.invalidFields).toEqual(['passengers.0.dateOfBirth']);
  });

  it('rejects a future date of birth', () => {
    const result = validateBooking({
      ...valid,
      passengers: [{ ...validPassenger, dateOfBirth: '2099-01-01' }],
    });

    expect(result.message).toBe(BOOKING_DOB_ERROR);
    expect(result.invalidFields).toEqual(['passengers.0.dateOfBirth']);
  });

  it('compares date of birth against the local calendar day', () => {
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const spy = vi.spyOn(format, 'todayIsoDate').mockReturnValue('2020-01-01');

    const result = validateBooking({
      ...valid,
      passengers: [{ ...validPassenger, dateOfBirth: '2020-01-02' }],
    });

    expect(spy).toHaveBeenCalledWith(localZone);
    expect(result.message).toBe(BOOKING_DOB_ERROR);
    spy.mockRestore();
  });

  it('flags fields on the second passenger', () => {
    const result = validateBooking({
      ...valid,
      passengers: [validPassenger, { ...validPassenger, firstName: '' }],
    });

    expect(result.message).toBe(BOOKING_REQUIRED_ERROR);
    expect(result.invalidFields).toEqual(['passengers.1.firstName']);
  });

  it('rejects an empty passengers list', () => {
    expect(validateBooking({ ...valid, passengers: [] })).toEqual({
      message: BOOKING_REQUIRED_ERROR,
      invalidFields: [],
    });
  });

  it('rejects more than nine passengers', () => {
    const passengers = Array.from({ length: 10 }, () => validPassenger);

    expect(validateBooking({ ...valid, passengers })).toEqual({
      message: BOOKING_PASSENGERS_ERROR,
      invalidFields: [],
    });
  });

  it('rejects when passengers exceed available seats', () => {
    const passengers = [validPassenger, validPassenger];

    expect(
      validateBooking({ ...valid, passengers }, { seatsAvailable: 1 }),
    ).toEqual({
      message: BOOKING_SEATS_ERROR,
      invalidFields: [],
    });
  });

  it('accepts passengers within available seats', () => {
    expect(
      validateBooking(
        { ...valid, passengers: [validPassenger, validPassenger] },
        { seatsAvailable: 2 },
      ),
    ).toEqual({
      message: null,
      invalidFields: [],
    });
  });
});
