import { FormEvent, useState } from 'react';
import { defaultBookingValues } from '../../data/defaultBooking';
import styles from './BookingForm.module.css';

export type PassengerValues = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentNumber: string;
};

export type BookingFormValues = {
  email: string;
  phone: string;
  passengers: PassengerValues[];
};

type BookingFormProps = {
  flightLabel: string;
  initialValues?: BookingFormValues;
  submitDisabled?: boolean;
  onSubmit?: (values: BookingFormValues) => void;
};

const emptyPassenger = (): PassengerValues => ({
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  documentNumber: '',
});

export function BookingForm({
  flightLabel,
  initialValues = defaultBookingValues,
  submitDisabled = false,
  onSubmit,
}: BookingFormProps) {
  const [email, setEmail] = useState(initialValues.email);
  const [phone, setPhone] = useState(initialValues.phone);
  const [passengers, setPassengers] = useState(initialValues.passengers);

  function updatePassenger(
    index: number,
    field: keyof PassengerValues,
    value: string,
  ) {
    setPassengers((current) =>
      current.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger,
      ),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled) {
      return;
    }
    onSubmit?.({ email, phone, passengers });
  }

  return (
    <form
      className={styles.form}
      data-testid="booking-form"
      onSubmit={handleSubmit}
    >
      <h2 className={styles.heading} data-testid="booking-heading">
        Оформление бронирования
      </h2>

      <p className={styles.flightSummary} data-testid="booking-flight-summary">
        {flightLabel}
      </p>

      <div className={styles.contact} data-testid="booking-contact">
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            data-testid="contact-email"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <input
            className={styles.input}
            type="tel"
            name="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            data-testid="contact-phone"
          />
        </label>
      </div>

      <div className={styles.divider} role="separator">
        Пассажиры
      </div>

      <ul className={styles.passengers} data-testid="passengers-list">
        {passengers.map((passenger, index) => (
          <li
            key={index}
            className={styles.passengerCard}
            data-testid="passenger-item"
          >
            <label className={styles.field}>
              <span className={styles.label}>Имя</span>
              <input
                className={styles.input}
                type="text"
                name={`passengers.${index}.firstName`}
                value={passenger.firstName}
                onChange={(event) =>
                  updatePassenger(index, 'firstName', event.target.value)
                }
                autoComplete="given-name"
                data-testid="passenger-first-name"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Фамилия</span>
              <input
                className={styles.input}
                type="text"
                name={`passengers.${index}.lastName`}
                value={passenger.lastName}
                onChange={(event) =>
                  updatePassenger(index, 'lastName', event.target.value)
                }
                autoComplete="family-name"
                data-testid="passenger-last-name"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Дата рождения</span>
              <input
                className={styles.input}
                type="date"
                name={`passengers.${index}.dateOfBirth`}
                value={passenger.dateOfBirth}
                onChange={(event) =>
                  updatePassenger(index, 'dateOfBirth', event.target.value)
                }
                data-testid="passenger-birth-date"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Документ</span>
              <input
                className={styles.input}
                type="text"
                name={`passengers.${index}.documentNumber`}
                value={passenger.documentNumber}
                onChange={(event) =>
                  updatePassenger(index, 'documentNumber', event.target.value)
                }
                data-testid="passenger-document"
              />
            </label>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <button
          className={styles.secondary}
          type="button"
          data-testid="add-passenger-button"
          onClick={() => setPassengers((current) => [...current, emptyPassenger()])}
        >
          Добавить пассажира
        </button>
        <button
          className={styles.primary}
          type="submit"
          disabled={submitDisabled}
          data-testid="submit-booking-button"
        >
          Забронировать
        </button>
      </div>
    </form>
  );
}
