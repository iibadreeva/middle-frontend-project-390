import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFlights, type City, type Flight } from '../api';
import { FLIGHTS_SEARCH_ERROR } from '../lib/messages';
import type { RequestStatus } from '../lib/requestStatus';
import { resolveTimeZoneByCode } from '../lib/resolveCityTimeZone';
import {
  resolveSearchValues,
  searchParamsMatchValues,
  toSearchKey,
  toSearchParamsRecord,
  type SearchFormValues,
} from '../lib/resolveSearchValues';
import { validateSearchValues } from '../lib/searchValidation';

type FlightResultState = {
  key: string;
  flights: Flight[];
  errorMessage?: string;
};

function useFlightsQuery(
  values: SearchFormValues,
  enabled: boolean,
): {
  status: RequestStatus;
  flights: Flight[];
  errorMessage?: string;
} {
  const [result, setResult] = useState<FlightResultState | null>(null);
  const searchKey = toSearchKey(values);
  const { origin, destination, date, passengers } = values;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    const key = toSearchKey({ origin, destination, date, passengers });

    getFlights({ origin, destination, date, passengers }, controller.signal)
      .then((nextFlights) => {
        if (controller.signal.aborted) {
          return;
        }
        setResult({ key, flights: nextFlights });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error(error);
        setResult({
          key,
          flights: [],
          errorMessage: FLIGHTS_SEARCH_ERROR,
        });
      });

    return () => controller.abort();
  }, [origin, destination, date, passengers, enabled]);

  const status: RequestStatus =
    result?.key === searchKey
      ? result.errorMessage
        ? 'error'
        : 'success'
      : 'loading';

  return {
    status,
    flights: result?.key === searchKey ? result.flights : [],
    errorMessage:
      result?.key === searchKey ? result.errorMessage : undefined,
  };
}

/**
 * Поиск рейсов стартует только после `citiesReady` — иначе первый запрос
 * ушёл бы по FALLBACK_CITIES и мог быть отброшен после ответа /api/cities.
 */
export function useFlightSearch(
  cities: City[],
  citiesReady: boolean,
): {
  values: SearchFormValues;
  valuesError: string | null;
  status: RequestStatus;
  flights: Flight[];
  errorMessage?: string;
  submit: (nextValues: SearchFormValues) => void;
} {
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

  const query = useFlightsQuery(values, citiesReady && !valuesError);

  function submit(nextValues: SearchFormValues) {
    setSearchParams(toSearchParamsRecord(nextValues));
  }

  return {
    values,
    valuesError,
    status: query.status,
    flights: query.flights,
    errorMessage: query.errorMessage,
    submit,
  };
}
