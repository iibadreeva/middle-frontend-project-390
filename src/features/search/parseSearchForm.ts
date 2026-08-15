import type { City } from '@entities/city';
import { resolveTimeZoneByCode } from '@shared/lib/resolveCityTimeZone';
import { createSearchSchema, type SearchFormValues } from './searchSchema';

/** Схема поиска для города вылета — общий вход для resolver и sync ошибок. */
export function searchSchemaForCities(cities: City[], origin: string) {
  return createSearchSchema({
    timeZone: resolveTimeZoneByCode(cities, origin),
  });
}

/**
 * Ключ кэша resolver = TZ схемы (`createSearchSchema` зависит только от неё).
 */
export function searchFormResolverCacheKey(
  cities: readonly City[],
  origin: string,
): string {
  return resolveTimeZoneByCode(cities, origin);
}

export function parseSearchForm(values: SearchFormValues, cities: City[]) {
  return searchSchemaForCities(cities, values.origin).safeParse(values);
}
