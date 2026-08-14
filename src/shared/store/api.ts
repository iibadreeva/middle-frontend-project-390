import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  createBooking,
  getCities,
  getFlight,
  getFlights,
  type Booking,
  type City,
  type CreateBookingRequest,
  type Flight,
} from '../api';
import { ApiError } from '../lib/errors';

export type ApiQueryError = {
  status?: number;
  message: string;
  name?: string;
};

export type FlightSearchArgs = {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
};

const CITIES_CACHE_SECONDS = 60 * 60;

export function toQueryError(error: unknown): ApiQueryError {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
  }
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: String(error) };
}

export function getQueryErrorStatus(error: unknown): number | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return error.status;
  }
  return undefined;
}

export function getQueryErrorMessage(error: unknown): string | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return undefined;
}

async function runQuery<T>(
  signal: AbortSignal,
  execute: () => Promise<T>,
): Promise<{ data: T } | { error: ApiQueryError }> {
  try {
    return { data: await execute() };
  } catch (error: unknown) {
    if (signal.aborted) {
      throw error;
    }
    console.error(error);
    return { error: toQueryError(error) };
  }
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<ApiQueryError>(),
  tagTypes: ['City', 'Flight'],
  endpoints: (build) => ({
    getCities: build.query<City[], void>({
      queryFn: async (_arg, { signal }) =>
        runQuery(signal, () => getCities(signal)),
      providesTags: ['City'],
      keepUnusedDataFor: CITIES_CACHE_SECONDS,
    }),
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
    createBooking: build.mutation<Booking, CreateBookingRequest>({
      queryFn: async (body, { signal }) =>
        runQuery(signal, () => createBooking(body, signal)),
      invalidatesTags: [{ type: 'Flight', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCitiesQuery,
  useGetFlightsQuery,
  useGetFlightQuery,
  useCreateBookingMutation,
} = api;
