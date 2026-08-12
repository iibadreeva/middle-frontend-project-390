import { useEffect, useState } from 'react';
import { getCities, type City } from '../api';
import { FALLBACK_CITIES } from '../data/fallbackCities';
import { CITIES_FALLBACK_NOTICE } from '../lib/messages';

export function useCities(): {
  cities: City[];
  notice: string | null;
  ready: boolean;
} {
  const [cities, setCities] = useState<City[]>(FALLBACK_CITIES);
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getCities(controller.signal)
      .then((nextCities) => {
        if (controller.signal.aborted) {
          return;
        }
        if (nextCities.length > 0) {
          setCities(nextCities);
          setNotice(null);
        } else {
          setNotice(CITIES_FALLBACK_NOTICE);
        }
        setReady(true);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error(error);
        setNotice(CITIES_FALLBACK_NOTICE);
        setReady(true);
      });

    return () => controller.abort();
  }, []);

  return { cities, notice, ready };
}
