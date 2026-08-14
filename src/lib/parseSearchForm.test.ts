import { describe, expect, it } from 'vitest';
import type { City } from '../api';
import { DEFAULT_CITY_TIME_ZONE } from '../data/cityTimeZones';
import { todayIsoDate } from './format';
import { SEARCH_SAME_CITIES_ERROR } from './messages';
import { parseSearchForm, searchSchemaForCities } from './parseSearchForm';
import { issueAt } from '../test/zodIssueAt';

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

  it('rejects the same origin and destination', () => {
    const result = parseSearchForm(
      { ...valid, destination: 'MOW' },
      cities,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'destination')).toBe(SEARCH_SAME_CITIES_ERROR);
    }
  });

  it('shares the schema factory with searchSchemaForCities', () => {
    const schema = searchSchemaForCities(cities, 'MOW');
    expect(schema.safeParse(valid).success).toBe(true);
  });
});
