import type { City } from '../model/types';

/** Запасной список, если /api/cities недоступен или отвечает медленно — форма остаётся рабочей. */
export const FALLBACK_CITIES: City[] = [
  { code: 'MOW', name: 'Москва', country: 'Россия' },
  { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
  { code: 'AER', name: 'Сочи', country: 'Россия' },
  { code: 'KZN', name: 'Казань', country: 'Россия' },
  { code: 'SVX', name: 'Екатеринбург', country: 'Россия' },
];

export const FALLBACK_ORIGIN = 'MOW';
export const FALLBACK_DESTINATION = 'LED';
