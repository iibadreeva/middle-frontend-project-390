import type { City } from '../api';
import {
  FALLBACK_DESTINATION,
  FALLBACK_ORIGIN,
} from '../data/fallbackCities';
import { isValidIsoDate, todayIsoDate } from './format';
import { resolveTimeZoneByCode } from './resolveCityTimeZone';

export type SearchFormValues = {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
};

export function resolveSearchValues(
  params: URLSearchParams,
  cities: City[],
): SearchFormValues {
  const cityCodes = new Set(cities.map((city) => city.code));
  const originParam = params.get('origin');
  const destinationParam = params.get('destination');

  const defaultOrigin =
    cities.find((city) => city.code === FALLBACK_ORIGIN)?.code ??
    cities[0]?.code ??
    FALLBACK_ORIGIN;

  const defaultDestination =
    cities.find((city) => city.code === FALLBACK_DESTINATION)?.code ??
    cities.find((city) => city.code !== defaultOrigin)?.code ??
    cities[0]?.code ??
    defaultOrigin;

  const origin =
    originParam && cityCodes.has(originParam) ? originParam : defaultOrigin;
  const destination =
    destinationParam && cityCodes.has(destinationParam)
      ? destinationParam
      : defaultDestination;

  const today = todayIsoDate(resolveTimeZoneByCode(cities, origin));

  const passengersRaw = Number(params.get('passengers') ?? 1);
  const dateParam = params.get('date');
  const dateIsUsable =
    dateParam !== null && isValidIsoDate(dateParam) && dateParam >= today;

  return {
    origin,
    destination,
    date: dateIsUsable ? dateParam : today,
    passengers:
      Number.isFinite(passengersRaw) && passengersRaw >= 1
        ? Math.min(9, Math.floor(passengersRaw))
        : 1,
  };
}

export function toSearchKey(values: SearchFormValues): string {
  return `${values.origin}|${values.destination}|${values.date}|${values.passengers}`;
}

export function toSearchParamsRecord(
  values: SearchFormValues,
): Record<string, string> {
  return {
    origin: values.origin,
    destination: values.destination,
    date: values.date,
    passengers: String(values.passengers),
  };
}

export function searchParamsMatchValues(
  params: URLSearchParams,
  values: SearchFormValues,
): boolean {
  return (
    params.get('origin') === values.origin &&
    params.get('destination') === values.destination &&
    params.get('date') === values.date &&
    params.get('passengers') === String(values.passengers)
  );
}
