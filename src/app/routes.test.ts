import { describe, expect, it } from 'vitest';
import {
  bookingHref,
  homeHref,
  lookupHref,
  routePaths,
} from './routes';

describe('app routes', () => {
  it('keeps route path patterns derived from the same segments as hrefs', () => {
    expect(routePaths.home).toBe(homeHref);
    expect(routePaths.lookup).toBe('lookup');
    expect(routePaths.booking).toBe('booking/:flightId');
    expect(lookupHref()).toBe('/lookup');
  });

  it('builds booking href', () => {
    expect(bookingHref('fl_1')).toBe('/booking/fl_1');
  });

  it('encodes flightId in booking href', () => {
    expect(bookingHref('fl/1')).toBe(
      `/booking/${encodeURIComponent('fl/1')}`,
    );
  });

  it('omits query when lookup options are absent', () => {
    expect(lookupHref()).toBe('/lookup');
  });

  it('includes code and lastName query for lookup', () => {
    expect(lookupHref({ code: 'AB12CD', lastName: 'Петров' })).toBe(
      `/lookup?code=AB12CD&lastName=${encodeURIComponent('Петров')}`,
    );
  });

  it('includes empty lastName when explicitly passed', () => {
    expect(lookupHref({ code: 'AB12CD', lastName: '' })).toBe(
      '/lookup?code=AB12CD&lastName=',
    );
  });

  it('encodes code and lastName', () => {
    expect(lookupHref({ code: 'A/B', lastName: 'Петров' })).toBe(
      `/lookup?code=${encodeURIComponent('A/B')}&lastName=${encodeURIComponent('Петров')}`,
    );
  });

  it('keeps legacy bookings path patterns for redirects', () => {
    expect(routePaths.bookingsLegacy).toBe('bookings');
    expect(routePaths.bookingViewLegacy).toBe('bookings/:code');
  });
});
