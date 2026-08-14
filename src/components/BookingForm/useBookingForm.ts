import { useMemo, type BaseSyntheticEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useFieldArray,
  useForm,
  type FieldArrayWithId,
  type UseFormReturn,
} from 'react-hook-form';
import { emptyPassenger, createEmptyBookingValues } from '../../data/defaultBooking';
import {
  bookingSchema,
  MAX_BOOKING_PASSENGERS,
  type BookingFormValues,
} from '../../lib/bookingSchema';

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
  addPassenger: () => void;
  removePassenger: (index: number) => void;
  submit: (event?: BaseSyntheticEvent) => Promise<void>;
  onFieldEdit: () => void;
};

export function useBookingForm({
  initialValues,
  seatsAvailable,
  onDismissExternalError,
  onSubmit,
}: UseBookingFormOptions): UseBookingFormResult {
  // Resolver создаём один раз: лимит мест — в UI + guard ниже
  // (`seatsShortage`), а не в Zod — seatsAvailable приходит уже после mount.
  const resolver = useMemo(() => zodResolver(bookingSchema), []);

  const form = useForm<BookingFormValues>({
    resolver,
    defaultValues: initialValues ?? createEmptyBookingValues(),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'passengers',
  });

  const passengerCount = fields.length;
  const passengerLimit = Math.min(
    MAX_BOOKING_PASSENGERS,
    seatsAvailable ?? MAX_BOOKING_PASSENGERS,
  );
  const canAddPassenger = passengerCount < passengerLimit;
  const seatsShortage =
    seatsAvailable != null && passengerCount > seatsAvailable;

  function onFieldEdit() {
    onDismissExternalError?.();
  }

  function addPassenger() {
    if (!canAddPassenger) {
      return;
    }
    onDismissExternalError?.();
    append(emptyPassenger());
  }

  function removePassenger(index: number) {
    if (fields.length <= 1) {
      return;
    }
    onDismissExternalError?.();
    remove(index);
  }

  // Seats shortage не в Zod: disabled submit в UI + этот guard (на случай
  // прямого вызова submit / обхода disabled).
  const submit = form.handleSubmit((values) => {
    if (
      seatsAvailable != null &&
      values.passengers.length > seatsAvailable
    ) {
      return;
    }
    onSubmit?.(values);
  });

  return {
    form,
    fields,
    passengerCount,
    canAddPassenger,
    seatsShortage,
    addPassenger,
    removePassenger,
    submit,
    onFieldEdit,
  };
}
