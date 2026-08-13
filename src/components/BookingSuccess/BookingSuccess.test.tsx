import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { fixtureBooking } from '../../test/fixtures';
import { BookingSuccess } from './BookingSuccess';

describe('BookingSuccess', () => {
  it('links to booking lookup with code and last name', () => {
    const booking = fixtureBooking({
      code: 'AB12CD',
      passengers: [
        {
          firstName: 'Иван',
          lastName: 'Петров',
          dateOfBirth: '1990-05-20',
          documentNumber: '4509 123456',
        },
      ],
    });

    render(
      <MemoryRouter>
        <BookingSuccess booking={booking} />
      </MemoryRouter>,
    );

    const link = screen.getByTestId('booking-view-link');
    expect(link).toHaveAttribute(
      'href',
      `/bookings/AB12CD?lastName=${encodeURIComponent('Петров')}`,
    );
    expect(link).toHaveTextContent('Перейти к брони');
  });
});
