import type { City, Flight } from '../api';
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
