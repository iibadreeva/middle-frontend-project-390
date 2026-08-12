import type { FlightCardData } from '../components/FlightCard/FlightCard';

export const mockFlights: FlightCardData[] = [
  {
    id: 'dp1001',
    airlineName: 'Победа',
    flightNumber: 'DP1001',
    originName: 'Москва',
    destinationName: 'Санкт-Петербург',
    departureLabel: '26.06.2026, 11:30',
    arrivalLabel: '26.06.2026, 12:59',
    durationMinutes: 89,
    priceLabel: '6 000 ₽',
  },
  {
    id: 's71002',
    airlineName: 'S7 Airlines',
    flightNumber: 'S71002',
    originName: 'Москва',
    destinationName: 'Санкт-Петербург',
    departureLabel: '26.06.2026, 16:30',
    arrivalLabel: '26.06.2026, 20:49',
    durationMinutes: 259,
    priceLabel: '5 000 ₽',
  },
];

export const defaultSearchValues = {
  origin: 'MOW',
  destination: 'LED',
  date: '2026-06-26',
  passengers: 1,
};
