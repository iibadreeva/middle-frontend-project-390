export type {
  Booking,
  BookingStatus,
  Contact,
  CreateBookingRequest,
  Passenger,
} from './model/types';
/**
 * Money живёт в flight (цена рейса); booking реэкспортирует тип и форматтеры,
 * чтобы UI брони не импортировал @entities/flight только ради цены.
 * При росте VO лучше вынести Money в нейтральный слайс/shared value-object.
 */
export type { Money } from '@entities/flight';
export { formatPrice, totalMoney } from '@entities/flight';
export {
  bookingApi,
  cancelBooking,
  createBooking,
  getBooking,
  useCancelBookingMutation,
  useCreateBookingMutation,
  useGetBookingQuery,
  type BookingLookupArgs,
} from './api';
