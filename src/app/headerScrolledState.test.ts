import { describe, expect, it } from 'vitest';
import {
  HEADER_COMPACT_AFTER_PX,
  HEADER_EXPAND_BELOW_PX,
  nextHeaderScrolled,
} from './headerScrolledState';

describe('nextHeaderScrolled', () => {
  it('stays expanded during a light nudge', () => {
    expect(nextHeaderScrolled(20, false)).toBe(false);
    expect(nextHeaderScrolled(HEADER_COMPACT_AFTER_PX, false)).toBe(false);
  });

  it('marks scrolled only after a real scroll past the compact threshold', () => {
    expect(nextHeaderScrolled(HEADER_COMPACT_AFTER_PX + 1, false)).toBe(true);
  });

  it('stays scrolled when settling between thresholds', () => {
    expect(nextHeaderScrolled(20, true)).toBe(true);
    expect(nextHeaderScrolled(HEADER_EXPAND_BELOW_PX + 1, true)).toBe(true);
  });

  it('clears scrolled only after returning near the top', () => {
    expect(nextHeaderScrolled(HEADER_EXPAND_BELOW_PX, true)).toBe(false);
    expect(nextHeaderScrolled(0, true)).toBe(false);
  });
});
