import { useLayoutEffect, useRef, useState } from 'react';
import type { City } from '../../api';
import { reconcileSearchDraft } from '../../lib/reconcileSearchDraft';
import { resolveTimeZoneByCode } from '../../lib/resolveCityTimeZone';
import {
  toSearchKey,
  type SearchFormValues,
} from '../../lib/resolveSearchValues';
import { validateSearchValues } from '../../lib/searchValidation';

function citiesKeyOf(cities: City[]): string {
  return cities.map((city) => city.code).join('|');
}

export function useSearchFormDraft(
  values: SearchFormValues,
  cities: City[],
): {
  draft: SearchFormValues;
  formError: string | null;
  updateDraft: <K extends keyof SearchFormValues>(
    field: K,
    value: SearchFormValues[K],
  ) => void;
  commitDraft: () => SearchFormValues | null;
} {
  const [draft, setDraft] = useState(values);
  const [formError, setFormError] = useState<string | null>(null);

  const valuesKey = toSearchKey(values);
  const citiesKey = citiesKeyOf(cities);
  const syncRef = useRef({ valuesKey, citiesKey });

  // До paint: иначе один кадр с устаревшим городом в <select>
  // (после смены cities/values опции уже другие).
  useLayoutEffect(() => {
    const previous = syncRef.current;
    if (
      previous.valuesKey === valuesKey &&
      previous.citiesKey === citiesKey
    ) {
      return;
    }

    setFormError(null);
    setDraft((current) =>
      reconcileSearchDraft(current, values, cities, previous.valuesKey),
    );
    syncRef.current = { valuesKey, citiesKey };
  }, [valuesKey, citiesKey, values, cities]);

  function updateDraft<K extends keyof SearchFormValues>(
    field: K,
    value: SearchFormValues[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }

  function commitDraft(): SearchFormValues | null {
    const nextValues: SearchFormValues = {
      origin: draft.origin,
      destination: draft.destination,
      date: draft.date,
      passengers: Number(draft.passengers),
    };

    const error = validateSearchValues(
      nextValues,
      resolveTimeZoneByCode(cities, nextValues.origin),
    );
    if (error) {
      setFormError(error);
      return null;
    }

    setFormError(null);
    return nextValues;
  }

  return { draft, formError, updateDraft, commitDraft };
}
