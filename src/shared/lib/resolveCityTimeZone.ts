import {
  CITY_TIME_ZONES,
  DEFAULT_CITY_TIME_ZONE,
} from '../data/cityTimeZones';
import { resolveSupportedTimeZone } from './timeZoneSupport';

export type CityTimeZoneSource = {
  code: string;
  timeZone?: string;
};

function fromDictionary(code: string): string {
  return CITY_TIME_ZONES[code] ?? DEFAULT_CITY_TIME_ZONE;
}

function hasExplicitTimeZone(
  city: CityTimeZoneSource | undefined,
): city is CityTimeZoneSource {
  return Boolean(city?.timeZone?.trim());
}

/**
 * Зона города: API → словарь → Europe/Moscow.
 * Неподдерживаемые IANA из API отбрасываются с предупреждением.
 */
export function resolveCityTimeZone(city: CityTimeZoneSource): string {
  const fromApi = city.timeZone?.trim();
  if (!fromApi) {
    return fromDictionary(city.code);
  }

  return resolveSupportedTimeZone(
    fromApi,
    fromDictionary(city.code),
    `Неизвестная IANA-зона «${fromApi}» для города ${city.code}; используем словарь.`,
  );
}

/**
 * Зона для карточки: первый источник с непустым timeZone
 * (список /api/cities важнее вложенного города в рейсе).
 */
export function resolveFlightCityTimeZone(
  cities: readonly CityTimeZoneSource[],
  embedded: CityTimeZoneSource,
): string {
  const fromList = cities.find((item) => item.code === embedded.code);
  const source = hasExplicitTimeZone(fromList) ? fromList : embedded;
  return resolveCityTimeZone(source);
}

/** Зона по коду: сначала город из списка (с возможным API timeZone), иначе словарь. */
export function resolveTimeZoneByCode(
  cities: readonly CityTimeZoneSource[],
  code: string,
): string {
  return resolveFlightCityTimeZone(cities, { code });
}
