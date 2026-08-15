import { useMemo, type BaseSyntheticEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useFieldArray,
  useForm,
  type FieldArrayWithId,
  type RegisterOptions,
  type UseFormReturn,
} from 'react-hook-form';
import { useLatestRef } from '@shared/hooks/useLatestRef';
import { createCachedResolver } from '@shared/lib/createCachedResolver';
import { emptyPassenger, createEmptyBookingValues } from '../defaultBooking';
import {
  createBookingSchema,
  MAX_BOOKING_PASSENGERS,
  type BookingFormValues,
} from '../bookingSchema';
import { useBookingSeatsShortage } from './useBookingSeatsShortage';

export type UseBookingFormOptions = {
  initialValues?: BookingFormValues;
  seatsAvailable?: number;
  onDismissExternalError?: () => void;
  onSubmit?: (values: BookingFormValues) => void;
};

export type UseBookingFormResult = {
  form: UseFormReturn<BookingFormValues>;
  fields: FieldArrayWithId<BookingFormValues, 'passengers', 'id'>[];
  passengerCount: number;
  canAddPassenger: boolean;
  seatsShortage: boolean;
  /** Стабильные options для `register` / `FormInput` (dismiss external error). */
  fieldRegisterOptions: RegisterOptions<BookingFormValues>;
  addPassenger: () => void;
  removePassenger: (index: number) => void;
  submit: (event?: BaseSyntheticEvent) => Promise<void>;
};

export function useBookingForm({
  initialValues,
  seatsAvailable,
  onDismissExternalError,
  onSubmit,
}: UseBookingFormOptions): UseBookingFormResult {
  // Prop → ref: resolver видит актуальный seatsAvailable (useForm берёт resolver на mount).
  const seatsAvailableRef = useLatestRef(seatsAvailable);
  const onDismissExternalErrorRef = useLatestRef(onDismissExternalError);
  const onSubmitRef = useLatestRef(onSubmit);

  const resolver = useMemo(
    () =>
      createCachedResolver<BookingFormValues, number | undefined>(
        // Ref читается при validate, не при render.
        // eslint-disable-next-line react-hooks/refs -- deferred read in RHF resolver
        () => seatsAvailableRef.current,
        // eslint-disable-next-line react-hooks/refs -- deferred read in RHF resolver
        () =>
          zodResolver(
            createBookingSchema({ seatsAvailable: seatsAvailableRef.current }),
          ),
      ),
    [seatsAvailableRef],
  );

  const form = useForm<BookingFormValues>({
    defaultValues: initialValues ?? createEmptyBookingValues(),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    resolver,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'passengers',
  });

  const passengerCount = fields.length;
  const canAddPassenger =
    passengerCount <
    Math.min(MAX_BOOKING_PASSENGERS, seatsAvailable ?? MAX_BOOKING_PASSENGERS);
  const seatsShortage = useBookingSeatsShortage(
    form,
    seatsAvailable,
    passengerCount,
  );

  const fieldRegisterOptions = useMemo(
    () => ({
      onChange: () => {
        onDismissExternalErrorRef.current?.();
      },
    }),
    [onDismissExternalErrorRef],
  );

  function addPassenger() {
    if (!canAddPassenger) {
      return;
    }
    onDismissExternalErrorRef.current?.();
    append(emptyPassenger());
  }

  function removePassenger(index: number) {
    if (fields.length <= 1) {
      return;
    }
    onDismissExternalErrorRef.current?.();
    remove(index);
  }

  // eslint-disable-next-line react-hooks/refs -- handleSubmit calls this on submit, not render
  const submit = form.handleSubmit((values) => {
    onSubmitRef.current?.(values);
  });

  return {
    form,
    fields,
    passengerCount,
    canAddPassenger,
    seatsShortage,
    fieldRegisterOptions,
    addPassenger,
    removePassenger,
    submit,
  };
}
