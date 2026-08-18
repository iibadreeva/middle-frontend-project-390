import { describe, expect, it } from 'vitest';
import { fixtureBooking } from '@shared/test/fixtures';
import { BookingSchema, type Booking } from './schemas';

describe('BookingSchema', () => {
  it('accepts a valid booking fixture', () => {
    expect(BookingSchema.safeParse(fixtureBooking()).success).toBe(true);
  });

  it('rejects booking with invalid status', () => {
    expect(
      BookingSchema.safeParse(
        fixtureBooking({ status: 'pending' as 'confirmed' }),
      ).success,
    ).toBe(false);
  });

  it('rejects booking without passengers', () => {
    const broken: Partial<Booking> = { ...fixtureBooking() };
    delete broken.passengers;
    expect(BookingSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects a non-date passenger dateOfBirth', () => {
    expect(
      BookingSchema.safeParse(
        fixtureBooking({
          passengers: [
            {
              firstName: 'Иван',
              lastName: 'Петров',
              dateOfBirth: '20.05.1990',
              documentNumber: '4509 123456',
            },
          ],
        }),
      ).success,
    ).toBe(false);
  });

  it('rejects a non-datetime createdAt', () => {
    expect(
      BookingSchema.safeParse(fixtureBooking({ createdAt: '2026-06-25' }))
        .success,
    ).toBe(false);
  });
});
