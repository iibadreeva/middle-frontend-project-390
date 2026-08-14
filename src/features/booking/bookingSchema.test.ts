import { describe, expect, it, vi } from 'vitest';
import { issueAt } from '@shared/test/zodIssueAt';
import {
  BOOKING_DOB_ERROR,
  BOOKING_DOB_INVALID_ERROR,
  BOOKING_EMAIL_ERROR,
  BOOKING_PASSENGERS_ERROR,
  BOOKING_PHONE_ERROR,
  BOOKING_REQUIRED_ERROR,
} from '@shared/lib/messages';
import * as format from '@shared/lib/format';
import { bookingSchema } from './bookingSchema';

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

describe('bookingSchema', () => {
  const schema = bookingSchema;

  it('accepts valid values and trims strings', () => {
    const result = schema.safeParse({
      email: ' ivan@example.com ',
      phone: ' +79991234567 ',
      passengers: [
        {
          firstName: ' Иван ',
          lastName: ' Петров ',
          dateOfBirth: '1990-05-20',
          documentNumber: ' 4509 123456 ',
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(valid);
    }
  });

  it('rejects empty required contact fields', () => {
    const result = schema.safeParse({ ...valid, email: '  ', phone: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'email')).toBe(BOOKING_REQUIRED_ERROR);
      expect(issueAt(result, 'phone')).toBe(BOOKING_REQUIRED_ERROR);
    }
  });

  it('rejects a malformed email', () => {
    const result = schema.safeParse({ ...valid, email: 'not-an-email' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'email')).toBe(BOOKING_EMAIL_ERROR);
    }
  });

  it('collects email format and passenger errors together', () => {
    const result = schema.safeParse({
      ...valid,
      email: 'not-an-email',
      passengers: [{ ...validPassenger, firstName: '' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'email')).toBe(BOOKING_EMAIL_ERROR);
      expect(issueAt(result, 'passengers.0.firstName')).toBe(
        BOOKING_REQUIRED_ERROR,
      );
    }
  });

  it('rejects a malformed phone', () => {
    const result = schema.safeParse({ ...valid, phone: '123' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'phone')).toBe(BOOKING_PHONE_ERROR);
    }
  });

  it('rejects empty passenger fields', () => {
    const result = schema.safeParse({
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

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'passengers.0.firstName')).toBe(
        BOOKING_REQUIRED_ERROR,
      );
      expect(issueAt(result, 'passengers.0.lastName')).toBe(
        BOOKING_REQUIRED_ERROR,
      );
      expect(issueAt(result, 'passengers.0.dateOfBirth')).toBe(
        BOOKING_REQUIRED_ERROR,
      );
      expect(issueAt(result, 'passengers.0.documentNumber')).toBe(
        BOOKING_REQUIRED_ERROR,
      );
    }
  });

  it('rejects an invalid date of birth', () => {
    const result = schema.safeParse({
      ...valid,
      passengers: [{ ...validPassenger, dateOfBirth: '1990-02-30' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'passengers.0.dateOfBirth')).toBe(
        BOOKING_DOB_INVALID_ERROR,
      );
    }
  });

  it('rejects a future date of birth', () => {
    const result = schema.safeParse({
      ...valid,
      passengers: [{ ...validPassenger, dateOfBirth: '2099-01-01' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'passengers.0.dateOfBirth')).toBe(BOOKING_DOB_ERROR);
    }
  });

  it('compares date of birth against the local calendar day', () => {
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const spy = vi.spyOn(format, 'todayIsoDate').mockReturnValue('2020-01-01');

    const result = schema.safeParse({
      ...valid,
      passengers: [{ ...validPassenger, dateOfBirth: '2020-01-02' }],
    });

    expect(spy).toHaveBeenCalledWith(localZone);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'passengers.0.dateOfBirth')).toBe(BOOKING_DOB_ERROR);
    }
    spy.mockRestore();
  });

  it('flags fields on the second passenger', () => {
    const result = schema.safeParse({
      ...valid,
      passengers: [validPassenger, { ...validPassenger, firstName: '' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'passengers.1.firstName')).toBe(
        BOOKING_REQUIRED_ERROR,
      );
    }
  });

  it('rejects an empty passengers list', () => {
    const result = schema.safeParse({ ...valid, passengers: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'passengers')).toBe(BOOKING_REQUIRED_ERROR);
    }
  });

  it('rejects more than nine passengers', () => {
    const passengers = Array.from({ length: 10 }, () => validPassenger);
    const result = schema.safeParse({ ...valid, passengers });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'passengers')).toBe(BOOKING_PASSENGERS_ERROR);
    }
  });

  it('does not enforce seatsAvailable in the schema (UI responsibility)', () => {
    const result = bookingSchema.safeParse({
      ...valid,
      passengers: [validPassenger, validPassenger],
    });

    expect(result.success).toBe(true);
  });
});
