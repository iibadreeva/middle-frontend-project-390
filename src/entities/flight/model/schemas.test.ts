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
});

describe('FlightsResponseSchema', () => {
  it('accepts a flight list', () => {
    expect(FlightsResponseSchema.safeParse(fixtureFlights).success).toBe(true);
  });
});
