import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Flight } from '@entities/flight';
import { fixtureFlights } from '@shared/test/fixtures';
import { flightCardContentKey } from './flightCardContentKey';

const base = fixtureFlights[0];

/**
 * Сниппеты, которые FlightCard обязан читать из `flight`.
 * Коды origin/destination/airline в ключе есть для TZ/стабильности,
 * но в JSX карточки могут не фигурировать — их здесь не требуем.
 */
const flightCardSourceSnippets = [
  'flight.flightNumber',
  'flight.airline.name',
  'flight.origin.name',
  'flight.destination.name',
  'flight.departureAt',
  'flight.arrivalAt',
  'flight.durationMinutes',
  'flight.price',
  'flight.seatsAvailable',
] as const;

/** Поля, от которых зависит UI FlightCard (+ коды для TZ/стабильности). */
const trackedMutations: Array<{ label: string; patch: (flight: Flight) => Flight }> =
  [
    {
      label: 'flightNumber',
      patch: (f) => ({ ...f, flightNumber: `${f.flightNumber}X` }),
    },
    {
      label: 'airline.code',
      patch: (f) => ({ ...f, airline: { ...f.airline, code: 'XX' } }),
    },
    {
      label: 'airline.name',
      patch: (f) => ({
        ...f,
        airline: { ...f.airline, name: `${f.airline.name} X` },
      }),
    },
    {
      label: 'origin.code',
      patch: (f) => ({ ...f, origin: { ...f.origin, code: 'XXX' } }),
    },
    {
      label: 'origin.name',
      patch: (f) => ({
        ...f,
        origin: { ...f.origin, name: `${f.origin.name} X` },
      }),
    },
    {
      label: 'destination.code',
      patch: (f) => ({ ...f, destination: { ...f.destination, code: 'YYY' } }),
    },
    {
      label: 'destination.name',
      patch: (f) => ({
        ...f,
        destination: { ...f.destination, name: `${f.destination.name} X` },
      }),
    },
    {
      label: 'departureAt',
      patch: (f) => ({ ...f, departureAt: '2099-01-01T00:00:00Z' }),
    },
    {
      label: 'arrivalAt',
      patch: (f) => ({ ...f, arrivalAt: '2099-01-01T03:00:00Z' }),
    },
    {
      label: 'durationMinutes',
      patch: (f) => ({ ...f, durationMinutes: f.durationMinutes + 1 }),
    },
    {
      label: 'price.amount',
      patch: (f) => ({
        ...f,
        price: { ...f.price, amount: f.price.amount + 1 },
      }),
    },
    {
      label: 'price.currency',
      patch: (f) => ({ ...f, price: { ...f.price, currency: 'USD' } }),
    },
    {
      label: 'seatsAvailable',
      patch: (f) => ({ ...f, seatsAvailable: f.seatsAvailable + 1 }),
    },
  ];

describe('flightCardContentKey', () => {
  it('is stable for the same flight snapshot', () => {
    expect(flightCardContentKey(base)).toBe(flightCardContentKey({ ...base }));
  });

  it.each(trackedMutations)(
    'changes when FlightCard-relevant field $label changes',
    ({ patch }) => {
      expect(flightCardContentKey(patch(base))).not.toBe(
        flightCardContentKey(base),
      );
    },
  );

  it('stays aligned with fields FlightCardContent actually reads', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'FlightCard.tsx'),
      'utf8',
    );

    expect(source).toContain('export function FlightCardContent');
    for (const snippet of flightCardSourceSnippets) {
      expect(source, `FlightCard should read ${snippet}`).toContain(snippet);
    }
  });
});
