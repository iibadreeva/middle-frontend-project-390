import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatDateTime,
  formatDuration,
  formatPrice,
  isValidIsoDate,
  todayIsoDate,
  totalMoney,
} from './format';
import { clearWarnedTimeZones } from './timeZoneSupport';

describe('formatPrice', () => {
  it('formats rubles with the currency symbol', () => {
    const formatted = formatPrice({ amount: 5400, currency: 'RUB' });
    const normalized = formatted.replace(/\u00a0|\u202f/g, ' ');
    expect(normalized).toBe('5 400 ₽');
  });

  it('keeps non-RUB currency codes as-is', () => {
    const formatted = formatPrice({ amount: 100, currency: 'USD' });
    const normalized = formatted.replace(/\u00a0|\u202f/g, ' ');
    expect(normalized).toBe('100 USD');
  });
});

describe('totalMoney', () => {
  it('multiplies the unit amount by passenger count', () => {
    expect(totalMoney({ amount: 5400, currency: 'RUB' }, 3)).toEqual({
      amount: 16200,
      currency: 'RUB',
    });
  });
});

describe('formatDateTime', () => {
  const instant = '2026-07-01T08:00:00Z';

  afterEach(() => {
    vi.restoreAllMocks();
    clearWarnedTimeZones();
  });

  it('formats the same instant differently across timezones', () => {
    const moscow = formatDateTime(instant, 'Europe/Moscow');
    const yekaterinburg = formatDateTime(instant, 'Asia/Yekaterinburg');

    expect(moscow).toMatch(/01\.07\.2026/);
    expect(yekaterinburg).toMatch(/01\.07\.2026/);
    expect(moscow).not.toBe(yekaterinburg);
  });

  it('appends a short timezone abbreviation for known zones', () => {
    expect(formatDateTime(instant, 'Europe/Moscow')).toMatch(/MSK$/);
    expect(formatDateTime(instant, 'Asia/Yekaterinburg')).toMatch(/YEKT$/);
  });

  it('falls back to UTC±H when the zone has no abbreviation', () => {
    expect(formatDateTime(instant, 'UTC')).toMatch(/UTC$/);
    expect(formatDateTime(instant, 'Etc/UTC')).toMatch(/UTC$/);
    expect(formatDateTime(instant, 'Asia/Kolkata')).toMatch(/UTC\+5:30$/);
  });

  it('warns only once for the same unsupported zone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    formatDateTime(instant, 'Fake/FormatOnce');
    formatDateTime(instant, 'Fake/FormatOnce');

    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('returns a placeholder for invalid timestamps instead of throwing', () => {
    expect(() => formatDateTime('oops', 'Europe/Moscow')).not.toThrow();
    expect(formatDateTime('oops', 'Europe/Moscow')).toBe('время неизвестно');
    expect(formatDateTime('', 'Europe/Moscow')).toBe('время неизвестно');
  });

  it('falls back to Moscow when the timezone is unsupported', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => formatDateTime(instant, 'Not/AZone')).not.toThrow();
    expect(formatDateTime(instant, 'Not/AZone')).toBe(
      formatDateTime(instant, 'Europe/Moscow'),
    );
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe('formatDuration', () => {
  it('splits minutes into hours and minutes', () => {
    expect(formatDuration(85)).toBe('1 ч 25 мин');
  });

  it('keeps sub-hour durations in minutes', () => {
    expect(formatDuration(45)).toBe('45 мин');
    expect(formatDuration(0)).toBe('0 мин');
  });

  it('drops the minutes part for whole hours', () => {
    expect(formatDuration(120)).toBe('2 ч');
  });

  it('returns a placeholder for unusable values', () => {
    expect(formatDuration(Number.NaN)).toBe('длительность неизвестна');
    expect(formatDuration(-5)).toBe('длительность неизвестна');
  });
});

describe('todayIsoDate', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    clearWarnedTimeZones();
  });

  it('returns YYYY-MM-DD for the given timezone', () => {
    expect(todayIsoDate('Europe/Moscow')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('uses the timezone calendar day near a UTC day boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-12T22:30:00Z'));

    expect(todayIsoDate('Europe/Moscow')).toBe('2026-08-13');
    expect(todayIsoDate('UTC')).toBe('2026-08-12');
  });

  it('falls back to Moscow for an unsupported timezone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(todayIsoDate('Not/AZone')).toBe(todayIsoDate('Europe/Moscow'));
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe('isValidIsoDate', () => {
  it('accepts a real calendar date', () => {
    expect(isValidIsoDate('2026-08-15')).toBe(true);
  });

  it('rejects empty, malformed and impossible dates', () => {
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate('abc')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-8-1')).toBe(false);
  });
});
