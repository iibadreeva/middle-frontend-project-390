import type { City } from '@shared/api';
import { resolveTimeZoneByCode } from '@shared/lib/resolveCityTimeZone';
import { createSearchSchema, type SearchFormValues } from './searchSchema';

/** Схема поиска для города вылета — общий вход для resolver и sync ошибок. */
export function searchSchemaForCities(cities: City[], origin: string) {
  return createSearchSchema({
    timeZone: resolveTimeZoneByCode(cities, origin),
  });
}

export function parseSearchForm(values: SearchFormValues, cities: City[]) {
  return searchSchemaForCities(cities, values.origin).safeParse(values);
}
