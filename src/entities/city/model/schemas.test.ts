import { describe, expect, it } from 'vitest';
import { fixtureCities, fixtureFlights } from '@shared/test/fixtures';
import { CitiesResponseSchema, CitySchema } from './schemas';

describe('CitySchema', () => {
  it('accepts valid city fixtures', () => {
    for (const city of fixtureCities) {
      expect(CitySchema.safeParse(city).success).toBe(true);
    }
  });

  it('accepts optional timeZone from API', () => {
    expect(
      CitySchema.safeParse({
        code: 'MOW',
        name: 'Москва',
        timeZone: 'Europe/Moscow',
      }).success,
    ).toBe(true);
  });

  it('rejects city without required name', () => {
    expect(CitySchema.safeParse({ code: 'MOW' }).success).toBe(false);
  });
});

describe('CitiesResponseSchema', () => {
  it('accepts a non-empty cities list', () => {
    expect(CitiesResponseSchema.safeParse(fixtureCities).success).toBe(true);
  });

  it('accepts an empty list', () => {
    expect(CitiesResponseSchema.safeParse([]).success).toBe(true);
  });
});

describe('Flight schemas via fixtures', () => {
  it('validates fixture flights when imported through city list', () => {
    expect(fixtureFlights.length).toBeGreaterThan(0);
    for (const flight of fixtureFlights) {
      expect(CitySchema.safeParse(flight.origin).success).toBe(true);
      expect(CitySchema.safeParse(flight.destination).success).toBe(true);
    }
  });
});
