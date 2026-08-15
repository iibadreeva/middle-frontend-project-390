import { api, runQuery } from '@shared/store';
import { request } from '@shared/api';
import type { City } from './model/types';

export function getCities(signal?: AbortSignal): Promise<City[]> {
  return request<City[]>('/api/cities', { signal });
}

const CITIES_CACHE_SECONDS = 60 * 60;

export const cityApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCities: build.query<City[], void>({
      queryFn: async (_arg, { signal }) =>
        runQuery(signal, () => getCities(signal)),
      providesTags: ['City'],
      keepUnusedDataFor: CITIES_CACHE_SECONDS,
    }),
  }),
});

export const { useGetCitiesQuery } = cityApi;
