import { describe, expect, it } from 'vitest';
import { fixtureCities, fixtureFlights } from '@shared/test/fixtures';
import { flightCardResetKeys } from './flightCardResetKeys';

const flight = fixtureFlights[0];

describe('flightCardResetKeys', () => {
  it('is stable for the same flight, passengers, href and cities', () => {
    const a = flightCardResetKeys(flight, 1, '/booking/fl_1', fixtureCities);
    const b = flightCardResetKeys(
      { ...flight },
      1,
      '/booking/fl_1',
      [...fixtureCities],
    );
    expect(a).toEqual(b);
  });

  it('changes when the resolved origin city time zone changes', () => {
    const withoutTz = flightCardResetKeys(
      flight,
      1,
      '/booking/fl_1',
      fixtureCities,
    );
    const withTz = flightCardResetKeys(
      flight,
      1,
      '/booking/fl_1',
      fixtureCities.map((city) =>
        city.code === flight.origin.code
          ? { ...city, timeZone: 'Asia/Yekaterinburg' }
          : city,
      ),
    );

    expect(withTz).not.toEqual(withoutTz);
  });

  it('changes when the resolved destination city time zone changes', () => {
    const withoutTz = flightCardResetKeys(
      flight,
      1,
      '/booking/fl_1',
      fixtureCities,
    );
    const withTz = flightCardResetKeys(
      flight,
      1,
      '/booking/fl_1',
      fixtureCities.map((city) =>
        city.code === flight.destination.code
          ? { ...city, timeZone: 'Asia/Yekaterinburg' }
          : city,
      ),
    );

    expect(withTz).not.toEqual(withoutTz);
  });
});
