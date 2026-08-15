import { describe, expect, it } from 'vitest';
import { formatDuration, formatPrice, totalMoney } from './format';

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
