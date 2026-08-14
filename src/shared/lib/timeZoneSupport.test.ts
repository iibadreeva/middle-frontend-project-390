import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearWarnedTimeZones,
  getCachedDateTimeFormat,
  parseGmtOffsetMinutes,
  resolveSupportedTimeZone,
} from './timeZoneSupport';

describe('parseGmtOffsetMinutes', () => {
  it('parses GMT, signed hours and minutes', () => {
    expect(parseGmtOffsetMinutes('GMT')).toBe(0);
    expect(parseGmtOffsetMinutes('GMT+5')).toBe(300);
    expect(parseGmtOffsetMinutes('GMT-5')).toBe(-300);
    expect(parseGmtOffsetMinutes('GMT+05:30')).toBe(330);
    expect(parseGmtOffsetMinutes('GMT-05:30')).toBe(-330);
  });

  it('returns 0 for empty or unrecognized values', () => {
    expect(parseGmtOffsetMinutes('')).toBe(0);
    expect(parseGmtOffsetMinutes('MSK')).toBe(0);
    expect(parseGmtOffsetMinutes('UTC+3')).toBe(0);
  });
});

describe('resolveSupportedTimeZone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearWarnedTimeZones();
  });

  it('keeps a supported zone', () => {
    expect(
      resolveSupportedTimeZone('Europe/Moscow', 'UTC', 'unused'),
    ).toBe('Europe/Moscow');
  });

  it('falls back and warns once for an unsupported zone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(
      resolveSupportedTimeZone('Not/AZone', 'Europe/Moscow', 'bad zone'),
    ).toBe('Europe/Moscow');
    expect(
      resolveSupportedTimeZone('Not/AZone', 'Europe/Moscow', 'bad zone'),
    ).toBe('Europe/Moscow');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('bad zone');
  });
});

describe('getCachedDateTimeFormat', () => {
  it('returns the same instance for identical locale and options', () => {
    const options = { timeZone: 'UTC', year: 'numeric' } as const;
    const first = getCachedDateTimeFormat('en-CA', options);
    const second = getCachedDateTimeFormat('en-CA', options);
    expect(second).toBe(first);
  });
});
