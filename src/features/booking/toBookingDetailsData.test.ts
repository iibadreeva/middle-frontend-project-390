import { describe, expect, it } from 'vitest';
import { fixtureBooking } from '@shared/test/fixtures';
import { toBookingDetailsData } from './toBookingDetailsData';

describe('toBookingDetailsData', () => {
  it('maps booking fields into display labels', () => {
    const booking = fixtureBooking();
    const details = toBookingDetailsData(booking);

    expect(details.code).toBe('AB12CD');
    expect(details.status).toBe('confirmed');
    expect(details.flightLabel).toBe(
      'Аэрофлот · SU1234: Москва → Санкт-Петербург',
    );
    expect(details.passengersLabel).toBe('Иван Петров');
    expect(details.totalPriceLabel.replace(/\u00a0|\u202f/g, ' ')).toBe(
      '5 400 ₽',
    );
  });
});
