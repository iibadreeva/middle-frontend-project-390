/** Маршруты приложения — единственный источник путей для слоя app. */

const routeSegments = {
  flights: 'flights',
  booking: 'booking',
  lookup: 'lookup',
  /** Устаревший сегмент — только для редиректа на `/lookup`. */
  bookings: 'bookings',
} as const;

/** Относительные path-паттерны для `<Route path=…>` (внутри родителя `/`). */
export const routePaths = {
  home: '/',
  flights: routeSegments.flights,
  booking: `${routeSegments.booking}/:flightId`,
  lookup: routeSegments.lookup,
  bookingsLegacy: routeSegments.bookings,
  bookingViewLegacy: `${routeSegments.bookings}/:code`,
} as const;

/** Absolute href для Link / Navigate / NavLink. */
export const homeHref = routePaths.home;

export type LookupHrefOptions = {
  code?: string;
  lastName?: string;
};

/** `/lookup` или `/lookup?code=…&lastName=…` при переданных полях. */
export function lookupHref(options?: LookupHrefOptions): string {
  const base = `/${routeSegments.lookup}`;
  if (!options) {
    return base;
  }

  const search = new URLSearchParams();
  if (typeof options.code === 'string') {
    search.set('code', options.code);
  }
  if (typeof options.lastName === 'string') {
    search.set('lastName', options.lastName);
  }
  const query = search.size > 0 ? `?${search}` : '';
  return `${base}${query}`;
}

export function bookingHref(flightId: string): string {
  return `/${routeSegments.booking}/${encodeURIComponent(flightId)}`;
}
