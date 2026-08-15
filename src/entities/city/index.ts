export type { City } from './model/types';
export {
  FALLBACK_CITIES,
  FALLBACK_DESTINATION,
  FALLBACK_ORIGIN,
} from './data/fallbackCities';
export { getCities, useGetCitiesQuery, cityApi } from './api';
export { useCities } from './hooks/useCities';
