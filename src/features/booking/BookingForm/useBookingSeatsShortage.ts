import { useLayoutEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { BookingFormValues } from '../bookingSchema';

/**
 * UI-флаг нехватки мест + сброс stale Zod seats-error после выхода из shortage.
 */
export function useBookingSeatsShortage(
  form: UseFormReturn<BookingFormValues>,
  seatsAvailable: number | undefined,
  passengerCount: number,
): boolean {
  const seatsShortage =
    seatsAvailable != null && passengerCount > seatsAvailable;

  const wasSeatsShortageRef = useRef(seatsShortage);
  useLayoutEffect(() => {
    if (wasSeatsShortageRef.current && !seatsShortage) {
      void form.trigger('passengers');
    }
    wasSeatsShortageRef.current = seatsShortage;
  }, [seatsShortage, form]);

  return seatsShortage;
}
