import { api, runQuery } from '@shared/store';
import { request } from '@shared/api';
import { FLIGHT_LOAD_ERROR, FLIGHTS_SEARCH_ERROR } from '@shared/lib/messages';
import type { Flight, FlightSearchArgs } from './model/types';
import { FlightSchema, FlightsResponseSchema } from './model/schemas';

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

  return request(`/api/flights?${query}`, {
    signal,
    schema: FlightsResponseSchema,
  });
}

export function getFlight(id: string, signal?: AbortSignal): Promise<Flight> {
  return request(`/api/flights/${encodeURIComponent(id)}`, {
    signal,
    schema: FlightSchema,
  });
}

export const flightApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFlights: build.query<Flight[], FlightSearchArgs>({
      queryFn: async (args, { signal }) =>
        runQuery(signal, () => getFlights(args, signal)),
      providesTags: [{ type: 'Flight', id: 'LIST' }],
      extraOptions: { errorPolicy: { message: FLIGHTS_SEARCH_ERROR } },
    }),
    getFlight: build.query<Flight, string>({
      queryFn: async (id, { signal }) =>
        runQuery(signal, () => getFlight(id, signal)),
      providesTags: (_result, _error, id) => [{ type: 'Flight', id }],
      extraOptions: { errorPolicy: { message: FLIGHT_LOAD_ERROR } },
    }),
  }),
});

export const { useGetFlightsQuery, useGetFlightQuery } = flightApi;
