import { api, runQuery } from '@shared/store';
import { request } from '@shared/api';
import type { Booking, CreateBookingRequest } from './model/types';

export type BookingLookupArgs = {
  code: string;
  lastName: string;
};

export function createBooking(
  body: CreateBookingRequest,
  signal?: AbortSignal,
): Promise<Booking> {
  return request<Booking>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
}

export function getBooking(
  code: string,
  lastName: string,
  signal?: AbortSignal,
): Promise<Booking> {
  const query = new URLSearchParams({ lastName });
  return request<Booking>(
    `/api/bookings/${encodeURIComponent(code)}?${query}`,
    { signal },
  );
}

export function cancelBooking(
  code: string,
  lastName: string,
  signal?: AbortSignal,
): Promise<Booking> {
  return request<Booking>(
    `/api/bookings/${encodeURIComponent(code)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ lastName }),
      signal,
    },
  );
}

export const bookingApi = api.injectEndpoints({
  endpoints: (build) => ({
    createBooking: build.mutation<Booking, CreateBookingRequest>({
      queryFn: async (body, { signal }) =>
        runQuery(signal, () => createBooking(body, signal)),
      invalidatesTags: [{ type: 'Flight', id: 'LIST' }],
    }),
    getBooking: build.query<Booking, BookingLookupArgs>({
      queryFn: async ({ code, lastName }, { signal }) =>
        runQuery(signal, () => getBooking(code, lastName, signal)),
      providesTags: (_result, _error, { code }) => [
        { type: 'Booking', id: code },
      ],
    }),
    cancelBooking: build.mutation<Booking, BookingLookupArgs>({
      queryFn: async ({ code, lastName }, { signal }) =>
        runQuery(signal, () => cancelBooking(code, lastName, signal)),
      invalidatesTags: (_result, _error, { code }) => [
        { type: 'Flight', id: 'LIST' },
        { type: 'Booking', id: code },
      ],
      async onQueryStarted({ code, lastName }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            bookingApi.util.updateQueryData(
              'getBooking',
              { code, lastName },
              () => data,
            ),
          );
        } catch {
          // Ошибку обрабатывает UI через result.error mutation.
        }
      },
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetBookingQuery,
  useCancelBookingMutation,
} = bookingApi;
