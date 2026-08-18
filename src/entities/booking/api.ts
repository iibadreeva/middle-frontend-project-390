import { api, runQuery } from '@shared/store';
import { request } from '@shared/api';
import {
  BOOKING_CANCEL_ERROR,
  BOOKING_CREATE_ERROR,
  BOOKING_LOOKUP_ERROR,
} from '@shared/lib/messages';
import type { Booking, CreateBookingRequest } from './model/types';
import { BookingSchema } from './model/schemas';

export type BookingLookupArgs = {
  code: string;
  lastName: string;
};

export function createBooking(
  body: CreateBookingRequest,
  signal?: AbortSignal,
): Promise<Booking> {
  return request('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
    schema: BookingSchema,
  });
}

export function getBooking(
  code: string,
  lastName: string,
  signal?: AbortSignal,
): Promise<Booking> {
  const query = new URLSearchParams({ lastName });
  return request(`/api/bookings/${encodeURIComponent(code)}?${query}`, {
    signal,
    schema: BookingSchema,
  });
}

export function cancelBooking(
  code: string,
  lastName: string,
  signal?: AbortSignal,
): Promise<Booking> {
  return request(`/api/bookings/${encodeURIComponent(code)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ lastName }),
    signal,
    schema: BookingSchema,
  });
}

export const bookingApi = api.injectEndpoints({
  endpoints: (build) => ({
    createBooking: build.mutation<Booking, CreateBookingRequest>({
      queryFn: async (body, { signal }) =>
        runQuery(signal, () => createBooking(body, signal)),
      invalidatesTags: [{ type: 'Flight', id: 'LIST' }],
      extraOptions: { errorPolicy: { message: BOOKING_CREATE_ERROR } },
    }),
    getBooking: build.query<Booking, BookingLookupArgs>({
      queryFn: async ({ code, lastName }, { signal }) =>
        runQuery(signal, () => getBooking(code, lastName, signal)),
      providesTags: (_result, _error, { code }) => [
        { type: 'Booking', id: code },
      ],
      extraOptions: { errorPolicy: { message: BOOKING_LOOKUP_ERROR } },
    }),
    cancelBooking: build.mutation<Booking, BookingLookupArgs>({
      queryFn: async ({ code, lastName }, { signal }) =>
        runQuery(signal, () => cancelBooking(code, lastName, signal)),
      invalidatesTags: (_result, _error, { code }) => [
        { type: 'Flight', id: 'LIST' },
        { type: 'Booking', id: code },
      ],
      extraOptions: { errorPolicy: { message: BOOKING_CANCEL_ERROR } },
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
