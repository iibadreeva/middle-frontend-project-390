/** Маршруты приложения — единственный источник путей для слоя app. */

const routeSegments = {
  flights: 'flights',
  booking: 'booking',
  bookings: 'bookings',
} as const;

/** Относительные path-паттерны для `<Route path=…>` (внутри родителя `/`). */
export const routePaths = {
  home: '/',
  flights: routeSegments.flights,
  booking: `${routeSegments.booking}/:flightId`,
  bookings: routeSegments.bookings,
  bookingView: `${routeSegments.bookings}/:code`,
} as const;

/** Absolute href для Link / Navigate / NavLink. */
export const homeHref = routePaths.home;

export const bookingsHref = `/${routeSegments.bookings}`;

export function bookingHref(flightId: string): string {
  return `/${routeSegments.booking}/${encodeURIComponent(flightId)}`;
}

export type BookingViewHrefOptions = {
  /**
   * Если свойство передано (в т.ч. `''`) — в URL попадает `?lastName=…`.
   * Если свойства нет — query не добавляется.
   * Для success-экрана передавайте только непустую фамилию.
   */
  lastName?: string;
};

export function bookingViewHref(
  code: string,
  options?: BookingViewHrefOptions,
): string {
  const viewSearch = new URLSearchParams();
  if (options && 'lastName' in options) {
    viewSearch.set('lastName', options.lastName ?? '');
  }
  const query = viewSearch.size > 0 ? `?${viewSearch}` : '';
  return `/${routeSegments.bookings}/${encodeURIComponent(code)}${query}`;
}
