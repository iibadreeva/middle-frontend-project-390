import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BookingsLegacyRedirect } from './BookingsLegacyRedirect';
import { routePaths } from '../routes';

function renderLegacy(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path={routePaths.bookingsLegacy}
          element={<BookingsLegacyRedirect />}
        />
        <Route
          path={routePaths.bookingViewLegacy}
          element={<BookingsLegacyRedirect />}
        />
        <Route
          path={routePaths.lookup}
          element={<div data-testid="lookup-target" />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BookingsLegacyRedirect', () => {
  it('redirects /bookings to /lookup', () => {
    renderLegacy('/bookings');
    expect(screen.getByTestId('lookup-target')).toBeInTheDocument();
  });

  it('redirects /bookings/:code with lastName to lookup query', () => {
    renderLegacy(
      `/bookings/AB12CD?lastName=${encodeURIComponent('Петров')}`,
    );
    expect(screen.getByTestId('lookup-target')).toBeInTheDocument();
  });
});
