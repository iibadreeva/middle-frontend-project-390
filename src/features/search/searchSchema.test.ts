import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CITY_TIME_ZONE } from '@shared/data/cityTimeZones';
import { futureIsoDate, pastIsoDate } from '@shared/test/fixtures';
import { issueAt } from '@shared/test/zodIssueAt';
import { todayIsoDate } from '@shared/lib/format';
import {
  SEARCH_CITY_REQUIRED_ERROR,
  SEARCH_DATE_PAST_ERROR,
  SEARCH_DATE_REQUIRED_ERROR,
  SEARCH_PASSENGERS_ERROR,
  SEARCH_SAME_CITIES_ERROR,
} from '@shared/lib/messages';
import { createSearchSchema } from './searchSchema';

describe('createSearchSchema', () => {
  const zone = DEFAULT_CITY_TIME_ZONE;
  const schema = createSearchSchema({ timeZone: zone });
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
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('accepts a future date', () => {
    expect(
      schema.safeParse({ ...valid, date: futureIsoDate() }).success,
    ).toBe(true);
  });

  it('rejects the same origin and destination', () => {
    const result = schema.safeParse({ ...valid, destination: 'MOW' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'destination')).toBe(SEARCH_SAME_CITIES_ERROR);
    }
  });

  it('rejects empty origin and destination', () => {
    const result = schema.safeParse({
      ...valid,
      origin: '',
      destination: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'origin')).toBe(SEARCH_CITY_REQUIRED_ERROR);
      expect(issueAt(result, 'destination')).toBe(SEARCH_CITY_REQUIRED_ERROR);
    }
  });

  it('rejects an empty date', () => {
    const result = schema.safeParse({ ...valid, date: '  ' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'date')).toBe(SEARCH_DATE_REQUIRED_ERROR);
    }
  });

  it('rejects a malformed date', () => {
    const bad = schema.safeParse({ ...valid, date: 'not-a-date' });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(issueAt(bad, 'date')).toBe(SEARCH_DATE_REQUIRED_ERROR);
    }

    const impossible = schema.safeParse({ ...valid, date: '2026-02-30' });
    expect(impossible.success).toBe(false);
    if (!impossible.success) {
      expect(issueAt(impossible, 'date')).toBe(SEARCH_DATE_REQUIRED_ERROR);
    }
  });

  it('rejects a departure date in the past for the given timezone', () => {
    const result = schema.safeParse({ ...valid, date: pastIsoDate(1) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issueAt(result, 'date')).toBe(SEARCH_DATE_PAST_ERROR);
    }
  });

  it('uses the provided timezone for the past-date boundary', () => {
    // 2026-08-12 22:30 UTC — ещё 12 августа в UTC, но уже 13-е в Москве.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-12T22:30:00Z'));

    const values = {
      origin: 'MOW',
      destination: 'LED',
      date: '2026-08-12',
      passengers: 1,
    };

    expect(createSearchSchema({ timeZone: 'UTC' }).safeParse(values).success).toBe(
      true,
    );

    const moscow = createSearchSchema({ timeZone: 'Europe/Moscow' }).safeParse(
      values,
    );
    expect(moscow.success).toBe(false);
    if (!moscow.success) {
      expect(issueAt(moscow, 'date')).toBe(SEARCH_DATE_PAST_ERROR);
    }
  });

  it('rejects passengers outside 1..9', () => {
    for (const passengers of [0, 10, 1.5, Number.NaN]) {
      const result = schema.safeParse({ ...valid, passengers });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(issueAt(result, 'passengers')).toBe(SEARCH_PASSENGERS_ERROR);
      }
    }
  });
});
