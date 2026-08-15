import { describe, expect, it } from 'vitest';
import type { City } from '@entities/city';
import { DEFAULT_CITY_TIME_ZONE } from '@shared/data/cityTimeZones';
import { fixtureCities, futureIsoDate, pastIsoDate } from '@shared/test/fixtures';
import { todayIsoDate } from '@shared/lib/format';
import { resolveSearchValues } from './resolveSearchValues';

describe('resolveSearchValues', () => {
  it('falls back to today when date param is invalid', () => {
    const values = resolveSearchValues(
      new URLSearchParams('origin=MOW&destination=LED&date=abc&passengers=1'),
      fixtureCities,
    );

    expect(values.date).toBe(todayIsoDate(DEFAULT_CITY_TIME_ZONE));
  });

  it('keeps a valid future date from the URL', () => {
    const future = futureIsoDate();
    const values = resolveSearchValues(
      new URLSearchParams(
        `origin=MOW&destination=LED&date=${future}&passengers=2`,
      ),
      fixtureCities,
    );

    expect(values.date).toBe(future);
  });

  it('keeps today as a valid date', () => {
    const today = todayIsoDate(DEFAULT_CITY_TIME_ZONE);
    const values = resolveSearchValues(
      new URLSearchParams(`origin=MOW&destination=LED&date=${today}`),
      fixtureCities,
    );

    expect(values.date).toBe(today);
  });

  it('rewrites a past date from the URL to today in the origin timezone', () => {
    const values = resolveSearchValues(
      new URLSearchParams(
        `origin=MOW&destination=LED&date=${pastIsoDate()}&passengers=1`,
      ),
      fixtureCities,
    );

    expect(values.date).toBe(todayIsoDate(DEFAULT_CITY_TIME_ZONE));
  });

  it('uses the origin city timezone for today when origin is SVX', () => {
    const values = resolveSearchValues(
      new URLSearchParams('origin=SVX&destination=MOW&date=abc&passengers=1'),
      fixtureCities,
    );

    expect(values.date).toBe(todayIsoDate('Asia/Yekaterinburg'));
  });

  it('uses the only available city for destination when list has one item', () => {
    const single: City[] = [{ code: 'MOW', name: 'Москва', country: 'Россия' }];
    const values = resolveSearchValues(new URLSearchParams(), single);

    expect(values.origin).toBe('MOW');
    expect(values.destination).toBe('MOW');
  });
});
