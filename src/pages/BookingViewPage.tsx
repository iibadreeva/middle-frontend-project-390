import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BookingDetails,
  type BookingDetailsData,
} from '../components/BookingDetails/BookingDetails';
import {
  BookingLookupForm,
  type BookingLookupValues,
} from '../components/BookingLookupForm/BookingLookupForm';
import {
  defaultLookupValues,
  getMockBooking,
} from '../data/mockBooking';
import styles from './Page.module.css';

export function BookingViewPage() {
  const navigate = useNavigate();
  const { code: routeCode } = useParams();
  const [params] = useSearchParams();

  const lookupValues: BookingLookupValues = {
    code: routeCode ?? params.get('code') ?? defaultLookupValues.code,
    lastName: params.get('lastName') ?? defaultLookupValues.lastName,
  };

  const [booking, setBooking] = useState<BookingDetailsData>(() =>
    getMockBooking(lookupValues.code),
  );

  function handleLookup(values: BookingLookupValues) {
    const query = new URLSearchParams({ lastName: values.lastName });
    const nextBooking = getMockBooking(values.code);
    setBooking(nextBooking);
    navigate(`/bookings/${encodeURIComponent(values.code)}?${query}`);
  }

  function handleCancel() {
    setBooking((current) => ({ ...current, status: 'cancelled' }));
  }

  return (
    <section className={styles.page} data-testid="booking-view-page">
      <h2 className={styles.sectionTitle} data-testid="my-booking-heading">
        Моя бронь
      </h2>

      <BookingLookupForm
        key={`${lookupValues.code}-${lookupValues.lastName}`}
        values={lookupValues}
        onSubmit={handleLookup}
      />

      <BookingDetails booking={booking} onCancel={handleCancel} />
    </section>
  );
}
