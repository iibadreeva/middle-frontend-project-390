import { describe, expect, it } from 'vitest';
import {
  bookingHref,
  bookingsHref,
  bookingViewHref,
  homeHref,
  routePaths,
} from './routes';

describe('app routes', () => {
  it('keeps route path patterns derived from the same segments as hrefs', () => {
    expect(routePaths.home).toBe(homeHref);
    expect(routePaths.bookings).toBe(bookingsHref.slice(1));
    expect(routePaths.booking).toBe('booking/:flightId');
    expect(routePaths.bookingView).toBe('bookings/:code');
    expect(bookingsHref).toBe('/bookings');
  });

  it('builds booking href', () => {
    expect(bookingHref('fl_1')).toBe('/booking/fl_1');
  });

  it('encodes flightId in booking href', () => {
    expect(bookingHref('fl/1')).toBe(
      `/booking/${encodeURIComponent('fl/1')}`,
    );
  });

  it('omits query when lastName option is absent', () => {
    expect(bookingViewHref('AB12CD')).toBe('/bookings/AB12CD');
  });

  it('includes lastName query even when empty (lookup)', () => {
    expect(bookingViewHref('AB12CD', { lastName: '' })).toBe(
      '/bookings/AB12CD?lastName=',
    );
  });

  it('includes non-empty lastName (success)', () => {
    expect(bookingViewHref('AB12CD', { lastName: 'Петров' })).toBe(
      `/bookings/AB12CD?lastName=${encodeURIComponent('Петров')}`,
    );
  });

  it('encodes code and lastName', () => {
    expect(bookingViewHref('A/B', { lastName: 'Петров' })).toBe(
      `/bookings/${encodeURIComponent('A/B')}?lastName=${encodeURIComponent('Петров')}`,
    );
  });
});
