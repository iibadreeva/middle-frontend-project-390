import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CITY_TIME_ZONE } from '../data/cityTimeZones';
import { futureIsoDate, pastIsoDate } from '../test/fixtures';
import { todayIsoDate } from './format';
import {
  SEARCH_DATE_PAST_ERROR,
  SEARCH_DATE_REQUIRED_ERROR,
  SEARCH_PASSENGERS_ERROR,
  SEARCH_SAME_CITIES_ERROR,
} from './messages';
import { validateSearchValues } from './searchValidation';

describe('validateSearchValues', () => {
  const zone = DEFAULT_CITY_TIME_ZONE;
  const valid = {
    origin: 'MOW',
    destination: 'LED',
    date: todayIsoDate(zone),
    passengers: 1,
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts valid values', () => {
    expect(validateSearchValues(valid, zone)).toBeNull();
  });

  it('accepts a future date', () => {
    expect(
      validateSearchValues({ ...valid, date: futureIsoDate() }, zone),
    ).toBeNull();
  });

  it('rejects the same origin and destination', () => {
    expect(
      validateSearchValues({ ...valid, destination: 'MOW' }, zone),
    ).toBe(SEARCH_SAME_CITIES_ERROR);
  });

  it('rejects an empty date', () => {
    expect(validateSearchValues({ ...valid, date: '  ' }, zone)).toBe(
      SEARCH_DATE_REQUIRED_ERROR,
    );
  });

  it('rejects a malformed date', () => {
    expect(validateSearchValues({ ...valid, date: 'not-a-date' }, zone)).toBe(
      SEARCH_DATE_REQUIRED_ERROR,
    );
    expect(validateSearchValues({ ...valid, date: '2026-02-30' }, zone)).toBe(
      SEARCH_DATE_REQUIRED_ERROR,
    );
  });

  it('rejects a departure date in the past for the given timezone', () => {
    expect(
      validateSearchValues({ ...valid, date: pastIsoDate(1) }, zone),
    ).toBe(SEARCH_DATE_PAST_ERROR);
  });

  it('uses the provided timezone for the past-date boundary', () => {
    // 2026-08-12 22:30 UTC — ещё 12 августа в UTC, но уже 13-е в Москве.
    // Дата 2026-08-12 для UTC — «сегодня», для Москвы — «вчера».
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-12T22:30:00Z'));

    const values = {
      origin: 'MOW',
      destination: 'LED',
      date: '2026-08-12',
      passengers: 1,
    };

    expect(validateSearchValues(values, 'UTC')).toBeNull();
    expect(validateSearchValues(values, 'Europe/Moscow')).toBe(
      SEARCH_DATE_PAST_ERROR,
    );
  });

  it('rejects passengers outside 1..9', () => {
    expect(validateSearchValues({ ...valid, passengers: 0 }, zone)).toBe(
      SEARCH_PASSENGERS_ERROR,
    );
    expect(validateSearchValues({ ...valid, passengers: 10 }, zone)).toBe(
      SEARCH_PASSENGERS_ERROR,
    );
    expect(validateSearchValues({ ...valid, passengers: 1.5 }, zone)).toBe(
      SEARCH_PASSENGERS_ERROR,
    );
  });
});
