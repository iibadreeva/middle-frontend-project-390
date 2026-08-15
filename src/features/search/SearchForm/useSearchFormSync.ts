import { useLayoutEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { City } from '@entities/city';
import { reconcileSearchDraft } from '../reconcileSearchDraft';
import {
  toSearchKey,
  type SearchFormValues,
} from '../resolveSearchValues';
import { citiesKeyOf, syncSearchFormErrors } from './syncSearchFormErrors';

/**
 * До paint: иначе один кадр с устаревшим городом в <select>
 * (после смены cities/values опции уже другие).
 * syncSearchFormErrors — синхронно, чтобы невалидный URL сразу дал ошибки полей
 * (та же parseSearchForm / searchSchemaForCities, что у resolver в useSearchForm).
 */
export function useSearchFormSync(
  form: UseFormReturn<SearchFormValues>,
  values: SearchFormValues,
  cities: City[],
) {
  const { reset, getValues, clearErrors, setError } = form;
  const valuesKey = toSearchKey(values);
  const citiesKey = citiesKeyOf(cities);
  // null до первого layout: отличить mount (нужен sync ошибок из URL/props)
  // от повторных рендеров с тем же ключом (не дёргать sync).
  const syncRef = useRef<{ valuesKey: string; citiesKey: string } | null>(null);

  useLayoutEffect(() => {
    const previous = syncRef.current;
    if (
      previous !== null &&
      previous.valuesKey === valuesKey &&
      previous.citiesKey === citiesKey
    ) {
      return;
    }

    if (previous !== null) {
      const nextDraft = reconcileSearchDraft(
        getValues(),
        values,
        cities,
        previous.valuesKey,
      );
      reset(nextDraft);
    }

    syncRef.current = { valuesKey, citiesKey };
    syncSearchFormErrors(getValues, clearErrors, setError, cities);
  }, [
    valuesKey,
    citiesKey,
    values,
    cities,
    getValues,
    reset,
    clearErrors,
    setError,
  ]);
}
