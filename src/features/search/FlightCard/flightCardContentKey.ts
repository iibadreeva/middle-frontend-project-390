import type { Flight } from '@entities/flight';

/**
 * Снимок отображаемых полей карточки (+ коды для TZ/стабильности).
 * Держите в синхроне с тем, что реально читает `FlightCard`.
 * TZ из `/api/cities` в ключ не входит — его добавляет `flightCardResetKeys`.
 */
export function flightCardContentKey(flight: Flight): string {
  return [
    flight.flightNumber,
    flight.airline.code,
    flight.airline.name,
    flight.origin.code,
    flight.origin.name,
    flight.destination.code,
    flight.destination.name,
    flight.departureAt,
    flight.arrivalAt,
    flight.durationMinutes,
    flight.price.amount,
    flight.price.currency,
    flight.seatsAvailable,
  ].join('\u0001');
}
