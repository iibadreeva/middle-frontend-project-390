import { describe, expect, it } from 'vitest';
import {
  asIsoBound,
  buildMonthGrid,
  isMonthOutOfRange,
  isYearOutOfRange,
  localTodayIso,
  mergePopoverCoords,
  parseIsoDate,
  placePopover,
  POPOVER_FALLBACK_HEIGHT_PX,
  POPOVER_FALLBACK_WIDTH_PX,
  shiftIsoDate,
  shiftMonth,
  toClampedIsoDate,
  toIsoDate,
  yearPage,
  yearRange,
} from './calendar';

describe('toIsoDate / parseIsoDate', () => {
  it('round-trips a calendar date without timezone shift', () => {
    expect(toIsoDate(2026, 8, 1)).toBe('2026-08-01');
    expect(parseIsoDate('2026-08-01')).toEqual({
      year: 2026,
      month: 8,
      day: 1,
    });
  });

  it('returns null for an invalid ISO date', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });
});

describe('toClampedIsoDate', () => {
  it('keeps a day that exists in the month', () => {
    expect(toClampedIsoDate(2026, 8, 15)).toBe('2026-08-15');
  });

  it('clamps 29 February to 28 in a non-leap year', () => {
    expect(toClampedIsoDate(2025, 2, 29)).toBe('2025-02-28');
  });
});

describe('asIsoBound', () => {
  it('keeps a non-empty ISO string', () => {
    expect(asIsoBound('2026-08-15')).toBe('2026-08-15');
  });

  it('ignores empty strings, numbers, and arrays', () => {
    expect(asIsoBound('')).toBeUndefined();
    expect(asIsoBound(2026)).toBeUndefined();
    expect(asIsoBound(['2026-08-15'])).toBeUndefined();
    expect(asIsoBound(undefined)).toBeUndefined();
  });
});

describe('buildMonthGrid', () => {
  it('builds a 6-week Monday-first grid for August 2026', () => {
    const grid = buildMonthGrid(2026, 8);

    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({
      iso: '2026-07-27',
      day: 27,
      inMonth: false,
    });
    expect(grid[5]).toEqual({
      iso: '2026-08-01',
      day: 1,
      inMonth: true,
    });
    expect(grid[35]).toEqual({
      iso: '2026-08-31',
      day: 31,
      inMonth: true,
    });
    expect(grid[41]).toEqual({
      iso: '2026-09-06',
      day: 6,
      inMonth: false,
    });
  });
});

describe('shiftMonth', () => {
  it('wraps from January to the previous December', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it('wraps from December to the next January', () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
});

describe('yearRange', () => {
  it('uses min/max years when they are provided', () => {
    expect(yearRange('2026-08-17', '2027-01-01', 2026)).toEqual({
      start: 2026,
      end: 2027,
    });
  });

  it('falls back to 120 years back and 15 years forward', () => {
    expect(yearRange(undefined, undefined, 2026)).toEqual({
      start: 1906,
      end: 2041,
    });
  });
});

describe('yearPage', () => {
  it('returns a past-leaning page of years ending at the cursor', () => {
    expect(yearPage(1990, 1906, 2026)).toEqual(
      Array.from({ length: 24 }, (_, i) => 1967 + i),
    );
  });

  it('does not start before the lower bound', () => {
    expect(yearPage(1906, 1906, 2026)[0]).toBe(1906);
    expect(yearPage(1910, 1906, 2026)[0]).toBe(1906);
    expect(yearPage(1910, 1906, 2026)).not.toContain(1887);
  });

  it('does not continue past the upper bound', () => {
    const page = yearPage(2041, 1906, 2041);
    expect(page[page.length - 1]).toBe(2041);
    expect(page).not.toContain(2042);
  });
});

describe('isMonthOutOfRange / isYearOutOfRange', () => {
  it('disables months that cannot contain a date inside min/max', () => {
    expect(isMonthOutOfRange(2026, 7, '2026-08-17', undefined)).toBe(true);
    expect(isMonthOutOfRange(2026, 8, '2026-08-17', undefined)).toBe(false);
    expect(isMonthOutOfRange(2026, 9, undefined, '2026-08-17')).toBe(true);
  });

  it('disables years outside min/max', () => {
    expect(isYearOutOfRange(2025, '2026-08-17', undefined)).toBe(true);
    expect(isYearOutOfRange(2026, '2026-08-17', undefined)).toBe(false);
    expect(isYearOutOfRange(2027, undefined, '2026-08-17')).toBe(true);
  });
});

describe('localTodayIso', () => {
  it('returns YYYY-MM-DD from the local calendar date', () => {
    expect(localTodayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('shiftIsoDate', () => {
  it('moves a calendar date by whole days without timezone shift', () => {
    expect(shiftIsoDate('2026-08-31', 1)).toBe('2026-09-01');
    expect(shiftIsoDate('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('placePopover', () => {
  const popover = {
    width: POPOVER_FALLBACK_WIDTH_PX,
    height: POPOVER_FALLBACK_HEIGHT_PX,
  };

  it('opens below the input when there is room', () => {
    expect(
      placePopover(
        { top: 40, left: 16, bottom: 72, right: 200, width: 184 },
        popover,
        { width: 800, height: 600 },
        4,
      ),
    ).toEqual({ top: 76, left: 16 });
  });

  it('flips above and aligns to the right when the viewport is tight', () => {
    expect(
      placePopover(
        { top: 500, left: 600, bottom: 532, right: 784, width: 184 },
        popover,
        { width: 800, height: 600 },
        4,
      ),
    ).toEqual({ top: 176, left: 504 });
  });
});

describe('mergePopoverCoords', () => {
  it('returns the previous object when the pixel position did not change', () => {
    const prev = { top: 76, left: 16 };
    expect(mergePopoverCoords(prev, { top: 76, left: 16 })).toBe(prev);
  });

  it('returns the next object when the position changed', () => {
    const prev = { top: 76, left: 16 };
    const next = { top: 80, left: 16 };
    expect(mergePopoverCoords(prev, next)).toBe(next);
  });
});
