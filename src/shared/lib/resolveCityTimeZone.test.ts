import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearWarnedTimeZones } from './timeZoneSupport';
import {
  resolveCityTimeZone,
  resolveFlightCityTimeZone,
  resolveTimeZoneByCode,
} from './resolveCityTimeZone';

describe('resolveCityTimeZone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearWarnedTimeZones();
  });

  it('prefers API timeZone over the dictionary', () => {
    expect(
      resolveCityTimeZone({ code: 'MOW', timeZone: 'Asia/Yekaterinburg' }),
    ).toBe('Asia/Yekaterinburg');
  });

  it('uses the dictionary when API omits timeZone', () => {
    expect(resolveCityTimeZone({ code: 'SVX' })).toBe('Asia/Yekaterinburg');
  });

  it('falls back to Europe/Moscow for unknown codes', () => {
    expect(resolveCityTimeZone({ code: 'XXX' })).toBe('Europe/Moscow');
  });

  it('ignores empty API timeZone', () => {
    expect(resolveCityTimeZone({ code: 'SVX', timeZone: '  ' })).toBe(
      'Asia/Yekaterinburg',
    );
  });

  it('rejects unsupported API timeZone and falls back to the dictionary', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(
      resolveCityTimeZone({ code: 'SVX', timeZone: 'Not/AZone' }),
    ).toBe('Asia/Yekaterinburg');
    expect(warn).toHaveBeenCalled();
  });

  it('warns only once for the same unsupported zone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveCityTimeZone({ code: 'SVX', timeZone: 'Fake/Once' });
    resolveCityTimeZone({ code: 'MOW', timeZone: 'Fake/Once' });

    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('resolveTimeZoneByCode', () => {
  it('prefers the city from the list over a bare code', () => {
    expect(
      resolveTimeZoneByCode(
        [{ code: 'SVX', timeZone: 'Asia/Vladivostok' }],
        'SVX',
      ),
    ).toBe('Asia/Vladivostok');
  });

  it('falls back to the dictionary when the code is missing from the list', () => {
    expect(resolveTimeZoneByCode([], 'SVX')).toBe('Asia/Yekaterinburg');
  });
});

describe('resolveFlightCityTimeZone', () => {
  it('prefers /api/cities timeZone over the embedded flight city', () => {
    expect(
      resolveFlightCityTimeZone(
        [{ code: 'SVX', timeZone: 'Asia/Vladivostok' }],
        { code: 'SVX', timeZone: 'Europe/Moscow' },
      ),
    ).toBe('Asia/Vladivostok');
  });

  it('uses embedded timeZone when the cities list has the code but no zone', () => {
    expect(
      resolveFlightCityTimeZone([{ code: 'SVX' }], {
        code: 'SVX',
        timeZone: 'Asia/Vladivostok',
      }),
    ).toBe('Asia/Vladivostok');
  });

  it('uses the embedded city when the list has no match', () => {
    expect(
      resolveFlightCityTimeZone([], {
        code: 'XXX',
        timeZone: 'Asia/Vladivostok',
      }),
    ).toBe('Asia/Vladivostok');
  });
});
