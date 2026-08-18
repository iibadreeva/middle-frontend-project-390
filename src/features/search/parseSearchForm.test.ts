import { describe, expect, it } from 'vitest';
import type { City } from '@entities/city';
import { DEFAULT_CITY_TIME_ZONE } from '@shared/data/cityTimeZones';
import { todayIsoDate } from '@shared/lib/format';
import { resolveTimeZoneByCode } from '@shared/lib/resolveCityTimeZone';
import {
  parseSearchForm,
  searchFormResolverCacheKey,
  searchSchemaForCities,
} from './parseSearchForm';

const cities: City[] = [
  { code: 'MOW', name: 'Москва', country: 'Россия' },
  { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
];

describe('parseSearchForm', () => {
  const valid = {
    origin: 'MOW',
    destination: 'LED',
    date: todayIsoDate(DEFAULT_CITY_TIME_ZONE),
    passengers: 1,
  };

  it('accepts valid values using the origin city timezone', () => {
    expect(parseSearchForm(valid, cities).success).toBe(true);
  });

  it('accepts the same origin and destination', () => {
    expect(
      parseSearchForm({ ...valid, destination: 'MOW' }, cities).success,
    ).toBe(true);
  });

  it('shares the schema factory with searchSchemaForCities', () => {
    const schema = searchSchemaForCities(cities, 'MOW');
    expect(schema.safeParse(valid).success).toBe(true);
  });
});

describe('searchFormResolverCacheKey', () => {
  it('equals the origin city timeZone used by the schema', () => {
    expect(searchFormResolverCacheKey(cities, 'MOW')).toBe(
      resolveTimeZoneByCode(cities, 'MOW'),
    );
  });

  it('stays stable when the cities list grows but origin TZ is unchanged', () => {
    const withExtra: City[] = [
      ...cities,
      { code: 'SVX', name: 'Екатеринбург', country: 'Россия' },
    ];

    expect(searchFormResolverCacheKey(cities, 'MOW')).toBe(
      searchFormResolverCacheKey(withExtra, 'MOW'),
    );
  });

  it('changes when an explicit city timeZone overrides the dictionary', () => {
    const withApiZone: City[] = [
      { code: 'MOW', name: 'Москва', country: 'Россия', timeZone: 'UTC' },
      cities[1],
    ];

    expect(searchFormResolverCacheKey(cities, 'MOW')).not.toBe(
      searchFormResolverCacheKey(withApiZone, 'MOW'),
    );
  });
});
