import { api, runQuery } from '@shared/store';
import { request } from '@shared/api';
import type { Flight, FlightSearchArgs } from './model/types';

export function getFlights(
  params: FlightSearchArgs,
  signal?: AbortSignal,
): Promise<Flight[]> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    passengers: String(params.passengers),
  });

  return request<Flight[]>(`/api/flights?${query}`, { signal });
}

export function getFlight(id: string, signal?: AbortSignal): Promise<Flight> {
  return request<Flight>(`/api/flights/${encodeURIComponent(id)}`, { signal });
}

export const flightApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFlights: build.query<Flight[], FlightSearchArgs>({
      queryFn: async (args, { signal }) =>
        runQuery(signal, () => getFlights(args, signal)),
      providesTags: [{ type: 'Flight', id: 'LIST' }],
    }),
    getFlight: build.query<Flight, string>({
      queryFn: async (id, { signal }) =>
        runQuery(signal, () => getFlight(id, signal)),
      providesTags: (_result, _error, id) => [{ type: 'Flight', id }],
    }),
  }),
});

export const { useGetFlightsQuery, useGetFlightQuery } = flightApi;
