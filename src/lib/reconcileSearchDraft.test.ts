import { describe, expect, it } from 'vitest';
import type { City } from '../api';
import { reconcileSearchDraft } from './reconcileSearchDraft';
import { toSearchKey, type SearchFormValues } from './resolveSearchValues';

const cities: City[] = [
  { code: 'MOW', name: 'Москва', country: 'Россия' },
  { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
  { code: 'AER', name: 'Сочи', country: 'Россия' },
];

const values: SearchFormValues = {
  origin: 'MOW',
  destination: 'LED',
  date: '2026-08-15',
  passengers: 2,
};

describe('reconcileSearchDraft', () => {
  it('returns resolved values when draft is clean', () => {
    const draft = {
      origin: 'MOW',
      destination: 'LED',
      date: '2026-08-15',
      passengers: 1,
    };
    const previousKey = toSearchKey(draft);

    expect(reconcileSearchDraft(draft, values, cities, previousKey)).toEqual(
      values,
    );
  });

  it('keeps dirty date and passengers and remaps invalid city codes', () => {
    const draft = {
      origin: 'AER',
      destination: 'XXX',
      date: '2026-09-01',
      passengers: 3,
    };
    const previousKey = toSearchKey({
      origin: 'MOW',
      destination: 'LED',
      date: '2026-08-15',
      passengers: 1,
    });

    expect(reconcileSearchDraft(draft, values, cities, previousKey)).toEqual({
      origin: 'AER',
      destination: 'LED',
      date: '2026-09-01',
      passengers: 3,
    });
  });

  it('returns the resolved values object when draft already matches them', () => {
    const draft = { ...values };
    const previousKey = toSearchKey({
      origin: 'MOW',
      destination: 'LED',
      date: '2026-08-15',
      passengers: 1,
    });

    expect(reconcileSearchDraft(draft, values, cities, previousKey)).toBe(
      values,
    );
  });
});
