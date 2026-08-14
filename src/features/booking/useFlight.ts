import { skipToken } from '@reduxjs/toolkit/query/react';
import { useEffect, useRef, useState } from 'react';
import type { Flight } from '@shared/api';
import { getQueryErrorStatus, useGetFlightQuery } from '@shared/store/api';

export type FlightLoadStatus = 'loading' | 'success' | 'not-found' | 'error';

export function useFlight(flightId: string | undefined): {
  status: FlightLoadStatus;
  flight: Flight | null;
  reload: () => void;
} {
  const [reloading, setReloading] = useState(false);
  const mountedRef = useRef(true);
  const query = useGetFlightQuery(flightId ?? skipToken);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function reload() {
    if (!flightId) {
      return;
    }
    setReloading(true);
    void query.refetch().finally(() => {
      if (mountedRef.current) {
        setReloading(false);
      }
    });
  }

  if (!flightId) {
    return { status: 'not-found', flight: null, reload };
  }

  if (reloading) {
    return { status: 'loading', flight: null, reload };
  }

  if (query.isError) {
    return {
      status: getQueryErrorStatus(query.error) === 404 ? 'not-found' : 'error',
      flight: null,
      reload,
    };
  }

  if (query.isSuccess) {
    return {
      status: 'success',
      flight: query.data ?? null,
      reload,
    };
  }

  return { status: 'loading', flight: null, reload };
}
