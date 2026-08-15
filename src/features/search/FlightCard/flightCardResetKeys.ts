import type { Flight } from '@entities/flight';
import {
  resolveFlightCityTimeZone,
  type CityTimeZoneSource,
} from '@shared/lib/resolveCityTimeZone';
import { flightCardContentKey } from './flightCardContentKey';

/**
 * Ключи сброса ErrorBoundary карточки.
 * Включает отображаемые поля рейса и TZ из списка городов (как в FlightCard).
 */
export function flightCardResetKeys(
  flight: Flight,
  passengers: number,
  bookHref: string,
  cities: readonly CityTimeZoneSource[],
): unknown[] {
  return [
    flight.id,
    passengers,
    bookHref,
    flightCardContentKey(flight),
    resolveFlightCityTimeZone(cities, flight.origin),
    resolveFlightCityTimeZone(cities, flight.destination),
  ];
}
