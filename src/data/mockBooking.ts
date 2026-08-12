import type { BookingDetailsData } from '../components/BookingDetails/BookingDetails';
import type { BookingConfirmationData } from '../components/BookingConfirmation/BookingConfirmation';

export const mockBooking: BookingDetailsData = {
  code: '0S54B6',
  status: 'confirmed',
  flightLabel: 'Победа · DP1001: Москва → Санкт-Петербург',
  passengersLabel: 'Иван Петров',
  totalPriceLabel: '6 000 ₽',
};

export const mockConfirmation: BookingConfirmationData = {
  code: '0S54B6',
  routeLabel: 'Москва → Санкт-Петербург',
  flightNumber: 'DP1001',
  passengersCount: 1,
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

export function getMockConfirmation(
  code: string | undefined,
): BookingConfirmationData {
  if (!code || code === 'demo') {
    return mockConfirmation;
  }

  return {
    ...mockConfirmation,
    code,
  };
}
