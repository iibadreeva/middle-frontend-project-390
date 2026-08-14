import type { BookingDetailsData } from '@features/booking';

export const mockBooking: BookingDetailsData = {
  code: '0S54B6',
  status: 'confirmed',
  flightLabel: 'Победа · DP1001: Москва → Санкт-Петербург',
  passengersLabel: 'Иван Петров',
  totalPriceLabel: '6 000 ₽',
};

export const defaultLookupValues = {
  code: '0S54B6',
  lastName: 'Петров',
};

export function getMockBooking(code: string | undefined): BookingDetailsData {
  if (!code || code === 'demo') {
    return mockBooking;
  }

  return {
    ...mockBooking,
    code,
  };
}
