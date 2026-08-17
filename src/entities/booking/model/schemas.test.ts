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
});
