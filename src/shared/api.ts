import { mergeAbortSignals } from './lib/abortSignals';
import { ApiError } from './lib/errors';

export type City = {
  code: string;
  name: string;
  country?: string;
  /** IANA-зона, напр. Europe/Moscow. Опционально; если нет — клиентский словарь. */
  timeZone?: string;
};

export type Money = {
  amount: number;
  currency: string;
};

export type Airline = {
  code: string;
  name: string;
};

export type Flight = {
  id: string;
  flightNumber: string;
  airline: Airline;
  origin: City;
  destination: City;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  /** Цена за одного пассажира, см. contract/openapi.yaml. */
  price: Money;
  seatsAvailable: number;
};

export type Passenger = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentNumber: string;
};

export type Contact = {
  email: string;
  phone: string;
};

export type BookingStatus = 'confirmed' | 'cancelled';

export type Booking = {
  code: string;
  status: BookingStatus;
  flight: Flight;
  passengers: Passenger[];
  contact: Contact;
  totalPrice: Money;
  createdAt: string;
};

export type CreateBookingRequest = {
  flightId: string;
  passengers: Passenger[];
  contact: Contact;
};

/** Таймаут сетевых запросов, чтобы UI не зависал навечно. */
const REQUEST_TIMEOUT_MS = 15_000;

export function mergeRequestHeaders(
  initHeaders?: HeadersInit,
  options?: { hasBody?: boolean },
): Headers {
  const headers = new Headers(initHeaders);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (options?.hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, signal, ...restInit } = init ?? {};
  const hasBody = restInit.body != null;
  const merged = mergeAbortSignals(
    signal ?? undefined,
    AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  );

  try {
    const response = await fetch(path, {
      ...restInit,
      signal: merged?.signal,
      headers: mergeRequestHeaders(initHeaders, { hasBody }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message =
        errorBody && typeof errorBody === 'object' && 'message' in errorBody
          ? String(errorBody.message)
          : `Request failed: ${response.status}`;
      throw new ApiError(message, response.status, {
        cause: errorBody ?? undefined,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    merged?.dispose();
  }
}

export function getCities(signal?: AbortSignal): Promise<City[]> {
  return request<City[]>('/api/cities', { signal });
}

export function getFlights(
  params: {
    origin: string;
    destination: string;
    date: string;
    passengers: number;
  },
  signal?: AbortSignal,
): Promise<Flight[]> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    passengers: String(params.passengers),
  });

  return request<Flight[]>(`/api/flights?${query}`, { signal });
}

export function getFlight(id: string, signal?: AbortSignal): Promise<Flight> {
  return request<Flight>(`/api/flights/${encodeURIComponent(id)}`, { signal });
}

export function createBooking(
  body: CreateBookingRequest,
  signal?: AbortSignal,
): Promise<Booking> {
  return request<Booking>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
}

export function getBooking(
  code: string,
  lastName: string,
  signal?: AbortSignal,
): Promise<Booking> {
  const query = new URLSearchParams({ lastName });
  return request<Booking>(
    `/api/bookings/${encodeURIComponent(code)}?${query}`,
    { signal },
  );
}

export function cancelBooking(
  code: string,
  lastName: string,
  signal?: AbortSignal,
): Promise<Booking> {
  return request<Booking>(
    `/api/bookings/${encodeURIComponent(code)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ lastName }),
      signal,
    },
  );
}
