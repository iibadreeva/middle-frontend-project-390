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
  // `query.error` сохраняется и на время refetch после rejected — иначе
  // notice/ready мигают, поиск уходит в skip и карточки снова subscribe → цикл.
  const failed =
    query.isError ||
    Boolean(query.error) ||
    (query.isSuccess && (apiCities?.length ?? 0) === 0);

  return {
    cities,
    notice: failed ? CITIES_FALLBACK_NOTICE : null,
    ready: query.isSuccess || failed,
  };
}
