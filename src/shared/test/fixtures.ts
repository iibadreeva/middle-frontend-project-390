import type { Booking } from '@entities/booking';
import type { City } from '@entities/city';
import type { Flight } from '@entities/flight';
import { DEFAULT_CITY_TIME_ZONE } from '../data/cityTimeZones';
import { todayIsoDate } from '../lib/format';

export const fixtureCities: City[] = [
  { code: 'MOW', name: 'Москва', country: 'Россия' },
  { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
  { code: 'AER', name: 'Сочи', country: 'Россия' },
  { code: 'SVX', name: 'Екатеринбург', country: 'Россия' },
];

export const fixtureFlights: Flight[] = [
  {
    id: 'fl_1',
    flightNumber: 'SU1234',
    airline: { code: 'SU', name: 'Аэрофлот' },
    origin: { code: 'MOW', name: 'Москва', country: 'Россия' },
    destination: { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
    departureAt: '2026-07-01T08:00:00Z',
    arrivalAt: '2026-07-01T09:25:00Z',
    durationMinutes: 85,
    price: { amount: 5400, currency: 'RUB' },
    seatsAvailable: 42,
  },
  {
    id: 'fl_2',
    flightNumber: 'DP202',
    airline: { code: 'DP', name: 'Победа' },
    origin: { code: 'MOW', name: 'Москва', country: 'Россия' },
    destination: { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
    departureAt: '2026-07-01T13:30:00Z',
    arrivalAt: '2026-07-01T15:00:00Z',
    durationMinutes: 90,
    price: { amount: 3200, currency: 'RUB' },
    seatsAvailable: 18,
  },
];

export function fixtureBooking(overrides: Partial<Booking> = {}): Booking {
  const flight = fixtureFlights[0];

  return {
    code: 'AB12CD',
    status: 'confirmed',
    flight,
    passengers: [
      {
        firstName: 'Иван',
        lastName: 'Петров',
        dateOfBirth: '1990-05-20',
        documentNumber: '4509 123456',
      },
    ],
    contact: {
      email: 'ivan@example.com',
      phone: '+79991234567',
    },
    totalPrice: {
      amount: flight.price.amount,
      currency: flight.price.currency,
    },
    createdAt: '2026-06-25T12:00:00Z',
    ...overrides,
  };
}

export function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/** Даты в тестах считаются от «сегодня», иначе они гниют вместе с календарём. */
export function futureIsoDate(days = 20): string {
  return shiftIsoDate(todayIsoDate(DEFAULT_CITY_TIME_ZONE), days);
}

export function pastIsoDate(days = 10): string {
  return shiftIsoDate(todayIsoDate(DEFAULT_CITY_TIME_ZONE), -days);
}
