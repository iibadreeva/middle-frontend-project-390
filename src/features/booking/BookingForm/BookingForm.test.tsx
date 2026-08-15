import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  BOOKING_PASSENGERS_ERROR,
  BOOKING_REQUIRED_ERROR,
  BOOKING_SEATS_ERROR,
} from '@shared/lib/messages';
import { BookingForm } from './BookingForm';

const validPassenger = {
  firstName: 'Иван',
  lastName: 'Петров',
  dateOfBirth: '1990-05-20',
  documentNumber: '4509 123456',
};

describe('BookingForm', () => {
  it('uses indexed passenger field test ids', () => {
    render(<BookingForm onSubmit={vi.fn()} />);

    expect(screen.getByTestId('passenger-0-firstName')).toBeInTheDocument();
    expect(screen.getByTestId('passenger-0-lastName')).toBeInTheDocument();
    expect(screen.getByTestId('passenger-0-dob')).toBeInTheDocument();
    expect(screen.getByTestId('passenger-0-document')).toBeInTheDocument();
    expect(screen.getByTestId('add-passenger')).toBeInTheDocument();
    expect(screen.getByTestId('booking-submit')).toBeInTheDocument();
  });

  it('adds another passenger with the next index', async () => {
    const user = userEvent.setup();
    render(<BookingForm onSubmit={vi.fn()} />);

    await user.click(screen.getByTestId('add-passenger'));

    expect(screen.getByTestId('passenger-1-firstName')).toBeInTheDocument();
    expect(screen.getByTestId('passenger-1-lastName')).toBeInTheDocument();
  });

  it('shows matching totals in flight slot and actions when passengers > 1', async () => {
    const user = userEvent.setup();
    const unitPrice = { amount: 5400, currency: 'RUB' };

    function normalize(value: string | null | undefined) {
      return (value ?? '').replace(/\u00a0|\u202f/g, ' ');
    }

    render(
      <BookingForm
        onSubmit={vi.fn()}
        unitPrice={unitPrice}
        flightSlot={(passengerCount) => (
          <div data-testid="booking-flight">
            {passengerCount > 1 ? (
              <p data-testid="booking-flight-total-price">
                Итого: stub {passengerCount}
              </p>
            ) : null}
          </div>
        )}
      />,
    );

    expect(
      screen.queryByTestId('booking-flight-total-price'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('booking-form-total-price'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId('add-passenger'));

    expect(screen.getByTestId('booking-flight-total-price')).toHaveTextContent(
      'Итого: stub 2',
    );
    expect(normalize(screen.getByTestId('booking-form-total-price').textContent)).toBe(
      'Итого: 10 800 ₽',
    );

    await user.click(screen.getByTestId('remove-passenger-1'));

    expect(
      screen.queryByTestId('booking-flight-total-price'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('booking-form-total-price'),
    ).not.toBeInTheDocument();
  });

  it('removes an extra passenger and keeps the first', async () => {
    const user = userEvent.setup();
    render(<BookingForm onSubmit={vi.fn()} />);

    await user.click(screen.getByTestId('add-passenger'));
    await user.type(screen.getByTestId('passenger-0-firstName'), 'Иван');
    await user.type(screen.getByTestId('passenger-1-firstName'), 'Анна');
    await user.click(screen.getByTestId('remove-passenger-1'));

    expect(screen.queryByTestId('passenger-1-firstName')).not.toBeInTheDocument();
    expect(screen.getByTestId('passenger-0-firstName')).toHaveValue('Иван');
  });

  it('does not call onSubmit when required fields are empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BookingForm onSubmit={onSubmit} />);

    await user.click(screen.getByTestId('booking-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('contact-email-error')).toHaveTextContent(
      BOOKING_REQUIRED_ERROR,
    );
    expect(screen.getByTestId('passenger-0-firstName-error')).toHaveTextContent(
      BOOKING_REQUIRED_ERROR,
    );
  });

  it('marks invalid fields with aria-invalid and describedby', async () => {
    const user = userEvent.setup();
    render(<BookingForm onSubmit={vi.fn()} />);

    await user.click(screen.getByTestId('booking-submit'));

    const error = screen.getByTestId('contact-email-error');
    const errorId = error.getAttribute('id');
    expect(errorId).toBeTruthy();

    expect(screen.getByTestId('contact-email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByTestId('contact-email')).toHaveAttribute(
      'aria-describedby',
      errorId,
    );
    expect(screen.getByTestId('passenger-0-firstName')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('gives each form instance unique field error ids', async () => {
    const user = userEvent.setup();
    render(
      <>
        <BookingForm onSubmit={vi.fn()} />
        <BookingForm onSubmit={vi.fn()} />
      </>,
    );

    const submits = screen.getAllByTestId('booking-submit');
    await user.click(submits[0]);
    await user.click(submits[1]);

    const emailErrors = screen.getAllByTestId('contact-email-error');
    const emailIds = emailErrors.map((node) => node.getAttribute('id'));
    expect(emailIds[0]).toBeTruthy();
    expect(emailIds[1]).toBeTruthy();
    expect(emailIds[0]).not.toBe(emailIds[1]);

    const passengerErrors = screen.getAllByTestId('passenger-0-firstName-error');
    const passengerIds = passengerErrors.map((node) => node.getAttribute('id'));
    expect(passengerIds[0]).toBeTruthy();
    expect(passengerIds[1]).toBeTruthy();
    expect(passengerIds[0]).not.toBe(passengerIds[1]);
  });

  it('clears only the edited field from invalid markers after it becomes valid', async () => {
    const user = userEvent.setup();
    render(<BookingForm onSubmit={vi.fn()} />);

    await user.click(screen.getByTestId('booking-submit'));
    expect(screen.getByTestId('contact-email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByTestId('contact-phone')).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    await user.type(screen.getByTestId('contact-email'), 'ivan@example.com');

    expect(screen.getByTestId('contact-email')).not.toHaveAttribute(
      'aria-invalid',
    );
    expect(screen.queryByTestId('contact-email-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('contact-phone')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByTestId('contact-phone-error')).toBeInTheDocument();
  });

  it('hides the field error after the invalid field is fixed', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        onSubmit={vi.fn()}
        initialValues={{
          email: 'ivan@example.com',
          phone: '+79991234567',
          passengers: [
            {
              firstName: '',
              lastName: 'Петров',
              dateOfBirth: '1990-05-20',
              documentNumber: '4509 123456',
            },
          ],
        }}
      />,
    );

    await user.click(screen.getByTestId('booking-submit'));
    expect(screen.getByTestId('passenger-0-firstName-error')).toBeInTheDocument();

    await user.type(screen.getByTestId('passenger-0-firstName'), 'И');

    expect(
      screen.queryByTestId('passenger-0-firstName-error'),
    ).not.toBeInTheDocument();
  });

  it('dismisses an external error when the user edits a field', async () => {
    const user = userEvent.setup();
    const onDismissExternalError = vi.fn();
    render(
      <BookingForm
        onSubmit={vi.fn()}
        externalError="Серверная ошибка"
        onDismissExternalError={onDismissExternalError}
      />,
    );

    expect(screen.getByTestId('booking-error')).toHaveTextContent(
      'Серверная ошибка',
    );

    await user.type(screen.getByTestId('contact-email'), 'a');

    expect(onDismissExternalError).toHaveBeenCalled();
  });

  it('disables add-passenger while submitting', () => {
    render(<BookingForm onSubmit={vi.fn()} submitting />);

    expect(screen.getByTestId('add-passenger')).toBeDisabled();
    expect(screen.getByTestId('booking-submit')).toBeDisabled();
  });

  it('disables contact and passenger fields while submitting', () => {
    render(
      <BookingForm
        onSubmit={vi.fn()}
        submitting
        initialValues={{
          email: 'ivan@example.com',
          phone: '+79991234567',
          passengers: [
            {
              firstName: 'Иван',
              lastName: 'Петров',
              dateOfBirth: '1990-05-20',
              documentNumber: '4509 123456',
            },
            {
              firstName: 'Анна',
              lastName: 'Сидорова',
              dateOfBirth: '1992-03-15',
              documentNumber: '4510 654321',
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('contact-email')).toBeDisabled();
    expect(screen.getByTestId('contact-phone')).toBeDisabled();
    expect(screen.getByTestId('passenger-0-firstName')).toBeDisabled();
    expect(screen.getByTestId('passenger-0-lastName')).toBeDisabled();
    expect(screen.getByTestId('passenger-0-dob')).toBeDisabled();
    expect(screen.getByTestId('passenger-0-document')).toBeDisabled();
    expect(screen.getByTestId('remove-passenger-1')).toBeDisabled();
  });

  it('disables add-passenger at the nine-passenger limit', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        onSubmit={vi.fn()}
        initialValues={{
          email: '',
          phone: '',
          passengers: Array.from({ length: 9 }, () => ({
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            documentNumber: '',
          })),
        }}
      />,
    );

    expect(screen.getByTestId('add-passenger')).toBeDisabled();
    await user.click(screen.getByTestId('add-passenger'));
    expect(screen.getAllByTestId('passenger-item')).toHaveLength(9);
  });

  it('disables add-passenger when seats are already filled', () => {
    render(
      <BookingForm
        onSubmit={vi.fn()}
        seatsAvailable={1}
        initialValues={{
          email: '',
          phone: '',
          passengers: [
            {
              firstName: '',
              lastName: '',
              dateOfBirth: '',
              documentNumber: '',
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('add-passenger')).toBeDisabled();
    expect(
      screen.queryByTestId('booking-seats-warning'),
    ).not.toBeInTheDocument();
  });

  it('disables submit when passengers exceed available seats', () => {
    const onSubmit = vi.fn();
    render(
      <BookingForm
        onSubmit={onSubmit}
        seatsAvailable={1}
        initialValues={{
          email: 'ivan@example.com',
          phone: '+79991234567',
          passengers: [
            validPassenger,
            {
              firstName: 'Анна',
              lastName: 'Сидорова',
              dateOfBirth: '1992-03-15',
              documentNumber: '4510 654321',
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('booking-seats-warning')).toBeInTheDocument();
    expect(screen.getByTestId('booking-seats-warning')).toHaveAttribute(
      'role',
      'alert',
    );
    expect(screen.getByTestId('booking-submit')).toBeDisabled();
    expect(screen.queryByTestId('booking-error')).not.toBeInTheDocument();
  });

  it('shows a root passengers error when initial count exceeds the schema max', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <BookingForm
        onSubmit={onSubmit}
        initialValues={{
          email: 'ivan@example.com',
          phone: '+79991234567',
          passengers: Array.from({ length: 10 }, () => validPassenger),
        }}
      />,
    );

    await user.click(screen.getByTestId('booking-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('passengers-error')).toHaveTextContent(
      BOOKING_PASSENGERS_ERROR,
    );
  });

  it('blocks forced submit while passengers exceed seats without a second seats alert', () => {
    const onSubmit = vi.fn();
    render(
      <BookingForm
        onSubmit={onSubmit}
        seatsAvailable={1}
        initialValues={{
          email: 'ivan@example.com',
          phone: '+79991234567',
          passengers: [
            validPassenger,
            {
              firstName: 'Анна',
              lastName: 'Сидорова',
              dateOfBirth: '1992-03-15',
              documentNumber: '4510 654321',
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('booking-seats-warning')).toHaveTextContent(
      BOOKING_SEATS_ERROR,
    );

    // UX: short-circuit до RHF (одно предупреждение). Zod seats — в хуке.
    fireEvent.submit(screen.getByTestId('booking-form'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByTestId('passengers-error')).not.toBeInTheDocument();
    expect(screen.getAllByText(BOOKING_SEATS_ERROR)).toHaveLength(1);
  });

  // UI short-circuit не создаёт Zod seats-error; stale Zod — в useBookingForm.test.
  it('clears seats warning after remove when submit was blocked by shortage UI', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        onSubmit={vi.fn()}
        seatsAvailable={1}
        initialValues={{
          email: 'ivan@example.com',
          phone: '+79991234567',
          passengers: [validPassenger, { ...validPassenger, firstName: 'Анна' }],
        }}
      />,
    );

    fireEvent.submit(screen.getByTestId('booking-form'));
    await user.click(screen.getByTestId('remove-passenger-1'));

    expect(
      screen.queryByTestId('booking-seats-warning'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('passengers-error')).not.toBeInTheDocument();
  });

  it('links the passengers group to the root passengers error for assistive tech', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        onSubmit={vi.fn()}
        initialValues={{
          email: 'ivan@example.com',
          phone: '+79991234567',
          passengers: Array.from({ length: 10 }, () => validPassenger),
        }}
      />,
    );

    await user.click(screen.getByTestId('booking-submit'));

    const error = screen.getByTestId('passengers-error');
    const errorId = error.getAttribute('id');
    expect(errorId).toBeTruthy();
    expect(screen.getByTestId('passengers-section')).toHaveAttribute(
      'aria-describedby',
      errorId,
    );
  });

  it('disables submit when the flight has no seats left', () => {
    render(
      <BookingForm
        onSubmit={vi.fn()}
        seatsAvailable={0}
        initialValues={{
          email: 'ivan@example.com',
          phone: '+79991234567',
          passengers: [
            {
              firstName: 'Иван',
              lastName: 'Петров',
              dateOfBirth: '1990-05-20',
              documentNumber: '4509 123456',
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('booking-seats-warning')).toBeInTheDocument();
    expect(screen.getByTestId('booking-submit')).toBeDisabled();
    expect(screen.getByTestId('add-passenger')).toBeDisabled();
  });

  it('hides seats warning after removing excess passengers', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        onSubmit={vi.fn()}
        seatsAvailable={1}
        initialValues={{
          email: 'ivan@example.com',
          phone: '+79991234567',
          passengers: [
            {
              firstName: 'Иван',
              lastName: 'Петров',
              dateOfBirth: '1990-05-20',
              documentNumber: '4509 123456',
            },
            {
              firstName: 'Анна',
              lastName: 'Сидорова',
              dateOfBirth: '1992-03-15',
              documentNumber: '4510 654321',
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('booking-seats-warning')).toBeInTheDocument();
    await user.click(screen.getByTestId('remove-passenger-1'));
    expect(
      screen.queryByTestId('booking-seats-warning'),
    ).not.toBeInTheDocument();
  });

  it('submits trimmed values when the form is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BookingForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('contact-email'), ' ivan@example.com ');
    await user.type(screen.getByTestId('contact-phone'), ' +79991234567 ');
    await user.type(screen.getByTestId('passenger-0-firstName'), ' Иван ');
    await user.type(screen.getByTestId('passenger-0-lastName'), ' Петров ');
    await user.type(screen.getByTestId('passenger-0-dob'), '1990-05-20');
    await user.type(screen.getByTestId('passenger-0-document'), ' 4509 123456 ');
    await user.click(screen.getByTestId('booking-submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'ivan@example.com',
      phone: '+79991234567',
      passengers: [
        {
          firstName: 'Иван',
          lastName: 'Петров',
          dateOfBirth: '1990-05-20',
          documentNumber: '4509 123456',
        },
      ],
    });
  });
});
