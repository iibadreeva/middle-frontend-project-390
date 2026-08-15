import { CITIES_FALLBACK_NOTICE } from '@shared/lib/messages';
import { useGetCitiesQuery } from '../api';
import { FALLBACK_CITIES } from '../data/fallbackCities';
import type { City } from '../model/types';

export function useCities(): {
  cities: City[];
  notice: string | null;
  ready: boolean;
} {
  const query = useGetCitiesQuery();

  const apiCities = query.data;
  const cities =
    apiCities && apiCities.length > 0 ? apiCities : FALLBACK_CITIES;
  const failed =
    query.isError || (query.isSuccess && (apiCities?.length ?? 0) === 0);

  return {
    cities,
    notice: failed ? CITIES_FALLBACK_NOTICE : null,
    ready: query.isSuccess || query.isError,
  };
}
