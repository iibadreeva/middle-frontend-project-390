import { describe, expect, it } from 'vitest';
import { fixtureFlights } from '@shared/test/fixtures';
import { FlightSchema, FlightsResponseSchema, type Flight } from './schemas';

describe('FlightSchema', () => {
  it('accepts valid flight fixtures', () => {
    for (const flight of fixtureFlights) {
      expect(FlightSchema.safeParse(flight).success).toBe(true);
    }
  });

  it('rejects flight without price', () => {
    const broken: Partial<Flight> = { ...fixtureFlights[0] };
    delete broken.price;
    expect(FlightSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects fractional money, duration, and seats', () => {
    const flight = fixtureFlights[0];
    expect(
      FlightSchema.safeParse({
        ...flight,
        price: { ...flight.price, amount: 5400.5 },
      }).success,
    ).toBe(false);
    expect(
      FlightSchema.safeParse({ ...flight, durationMinutes: 85.5 }).success,
    ).toBe(false);
    expect(
      FlightSchema.safeParse({ ...flight, seatsAvailable: 1.5 }).success,
    ).toBe(false);
  });

  it('rejects negative seats and duration', () => {
    const flight = fixtureFlights[0];
    expect(
      FlightSchema.safeParse({ ...flight, seatsAvailable: -1 }).success,
    ).toBe(false);
    expect(
      FlightSchema.safeParse({ ...flight, durationMinutes: -5 }).success,
    ).toBe(false);
  });

  it('rejects non-datetime departure and arrival', () => {
    const flight = fixtureFlights[0];
    expect(
      FlightSchema.safeParse({ ...flight, departureAt: '2026-07-01' }).success,
    ).toBe(false);
    expect(
      FlightSchema.safeParse({ ...flight, arrivalAt: 'not-a-date' }).success,
    ).toBe(false);
  });
});

describe('FlightsResponseSchema', () => {
  it('accepts a flight list', () => {
    expect(FlightsResponseSchema.safeParse(fixtureFlights).success).toBe(true);
  });
});
