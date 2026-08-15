import { api, runQuery } from '@shared/store';
import { request } from '@shared/api';
import type { Booking, CreateBookingRequest } from './model/types';

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
  }),
});

export const { useCreateBookingMutation } = bookingApi;
