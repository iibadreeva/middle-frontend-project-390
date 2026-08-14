import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { City, Flight } from '../api';
import { FLIGHTS_SEARCH_ERROR } from '../lib/messages';
import type { RequestStatus } from '../lib/requestStatus';
import { resolveTimeZoneByCode } from '../lib/resolveCityTimeZone';
import {
  resolveSearchValues,
  searchParamsMatchValues,
  toSearchParamsRecord,
  type SearchFormValues,
} from '../lib/resolveSearchValues';
import { validateSearchValues } from '../lib/searchValidation';
import { useGetFlightsQuery } from '../store/api';
import { useCities } from './useCities';

/**
 * Поиск рейсов стартует только после `citiesReady` — иначе первый запрос
 * ушёл бы по FALLBACK_CITIES и мог быть отброшен после ответа /api/cities.
 */
export function useFlightSearch(): {
  cities: City[];
  citiesNotice: string | null;
  values: SearchFormValues;
  valuesError: string | null;
  status: RequestStatus;
  flights: Flight[];
  errorMessage?: string;
  submit: (nextValues: SearchFormValues) => void;
} {
  const { cities, notice: citiesNotice, ready: citiesReady } = useCities();
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(
    () => resolveSearchValues(searchParams, cities),
    [searchParams, cities],
  );
  const valuesError = validateSearchValues(
    values,
    resolveTimeZoneByCode(cities, values.origin),
  );

  useEffect(() => {
    if (searchParamsMatchValues(searchParams, values)) {
      return;
    }

    setSearchParams(toSearchParamsRecord(values), { replace: true });
  }, [searchParams, values, setSearchParams]);

  const skip = !citiesReady || Boolean(valuesError);
  const query = useGetFlightsQuery(values, { skip });

  function submit(nextValues: SearchFormValues) {
    setSearchParams(toSearchParamsRecord(nextValues));
  }

  let status: RequestStatus = 'loading';
  if (valuesError) {
    status = 'success';
  } else if (query.isError) {
    status = 'error';
  } else if (!skip && query.isSuccess) {
    status = 'success';
  }

  return {
    cities,
    citiesNotice,
    values,
    valuesError,
    status,
    flights: query.isSuccess ? (query.data ?? []) : [],
    errorMessage: query.isError ? FLIGHTS_SEARCH_ERROR : undefined,
    submit,
  };
}
