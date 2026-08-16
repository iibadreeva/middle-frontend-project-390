import type { Booking } from '@entities/booking';
import { formatPrice } from '@entities/booking';
import type { BookingDetailsData } from './BookingDetails/BookingDetails';

export function toBookingDetailsData(booking: Booking): BookingDetailsData {
  return {
    code: booking.code,
    status: booking.status,
    flightLabel: `${booking.flight.airline.name} · ${booking.flight.flightNumber}: ${booking.flight.origin.name} → ${booking.flight.destination.name}`,
    passengersLabel: booking.passengers
      .map((passenger) => `${passenger.firstName} ${passenger.lastName}`)
      .join(', '),
    totalPriceLabel: formatPrice(booking.totalPrice),
  };
}
