export type City = {
  code: string;
  name: string;
  country?: string;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody && typeof errorBody === 'object' && 'message' in errorBody
        ? String(errorBody.message)
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getCities(): Promise<City[]> {
  return request<City[]>('/api/cities');
}

export function getFlights(params: {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}): Promise<Flight[]> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    passengers: String(params.passengers),
  });

  return request<Flight[]>(`/api/flights?${query}`);
}

export function getFlight(id: string): Promise<Flight> {
  return request<Flight>(`/api/flights/${encodeURIComponent(id)}`);
}

export function createBooking(body: CreateBookingRequest): Promise<Booking> {
  return request<Booking>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getBooking(code: string, lastName: string): Promise<Booking> {
  const query = new URLSearchParams({ lastName });
  return request<Booking>(
    `/api/bookings/${encodeURIComponent(code)}?${query}`,
  );
}

export function cancelBooking(code: string, lastName: string): Promise<Booking> {
  return request<Booking>(
    `/api/bookings/${encodeURIComponent(code)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ lastName }),
    },
  );
}
