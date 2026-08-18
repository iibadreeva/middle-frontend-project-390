import { api, runQuery } from '@shared/store';
import { request } from '@shared/api';
import type { City } from './model/types';
import { CitiesResponseSchema } from './model/schemas';

export function getCities(signal?: AbortSignal): Promise<City[]> {
  return request('/api/cities', { signal, schema: CitiesResponseSchema });
}

const CITIES_CACHE_SECONDS = 60 * 60;

export const cityApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCities: build.query<City[], void>({
      queryFn: async (_arg, { signal }) =>
        runQuery(signal, () => getCities(signal)),
      providesTags: ['City'],
      keepUnusedDataFor: CITIES_CACHE_SECONDS,
      extraOptions: {
        // Fallback-notice на поиске; Layout тянет города на всех страницах.
        errorPolicy: { silent: true },
      },
    }),
  }),
});

export const { useGetCitiesQuery } = cityApi;
