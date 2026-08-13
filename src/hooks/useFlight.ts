import { useEffect, useState } from 'react';
import { getFlight, type Flight } from '../api';
import { ApiError } from '../lib/errors';

export type FlightLoadStatus = 'loading' | 'success' | 'not-found' | 'error';

type FlightResult = {
  flightId: string;
  status: Exclude<FlightLoadStatus, 'loading'>;
  flight: Flight | null;
};

export function useFlight(flightId: string | undefined): {
  status: FlightLoadStatus;
  flight: Flight | null;
  reload: () => void;
} {
  const [result, setResult] = useState<FlightResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!flightId) {
      return;
    }

    const controller = new AbortController();

    getFlight(flightId, controller.signal)
      .then((flight) => {
        if (controller.signal.aborted) {
          return;
        }
        setResult({ flightId, status: 'success', flight });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setResult({ flightId, status: 'not-found', flight: null });
          return;
        }
        console.error(error);
        setResult({ flightId, status: 'error', flight: null });
      });

    return () => controller.abort();
  }, [flightId, reloadToken]);

  function reload() {
    if (!flightId) {
      return;
    }
    setResult(null);
    setReloadToken((token) => token + 1);
  }

  if (!flightId) {
    return { status: 'not-found', flight: null, reload };
  }

  if (result?.flightId !== flightId) {
    return { status: 'loading', flight: null, reload };
  }

  return {
    status: result.status,
    flight: result.flight,
    reload,
  };
}
