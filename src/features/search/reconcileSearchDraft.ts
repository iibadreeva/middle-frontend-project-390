import type { City } from '@shared/api';
import { toSearchKey, type SearchFormValues } from './resolveSearchValues';

function pickValidCityCode(
  code: string,
  cities: City[],
  fallback: string,
): string {
  return cities.some((city) => city.code === code) ? code : fallback;
}

/**
 * Сверяет черновик формы с новыми resolved-значениями.
 * Чистый черновик (или уже совпадающий с новыми values — типичный
 * пост-submit) заменяется целиком; иначе сохраняет дату/пассажиров
 * и подтягивает коды городов к актуальному списку.
 */
export function reconcileSearchDraft(
  draft: SearchFormValues,
  values: SearchFormValues,
  cities: City[],
  previousValuesKey: string,
): SearchFormValues {
  const draftKey = toSearchKey(draft);
  const nextKey = toSearchKey(values);
  const dirty = draftKey !== previousValuesKey && draftKey !== nextKey;
  if (!dirty) {
    return values;
  }

  return {
    origin: pickValidCityCode(draft.origin, cities, values.origin),
    destination: pickValidCityCode(
      draft.destination,
      cities,
      values.destination,
    ),
    date: draft.date,
    passengers: draft.passengers,
  };
}
