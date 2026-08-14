import { vi } from 'vitest';
import { fixtureCities, fixtureFlights } from './fixtures';

type FlightHandler = (id: string) => Response | Promise<Response>;
type BookingHandler = () => Response | Promise<Response>;

export function stubBookingApiFetch(options?: {
  flightById?: FlightHandler;
  createBooking?: BookingHandler;
  cities?: Response | (() => Response | Promise<Response>);
}) {
  const flightById =
    options?.flightById ??
    ((id: string) => {
      const flight = fixtureFlights.find((item) => item.id === id);
      if (flight) {
        return Response.json(flight);
      }
      return Response.json(
        { code: 'not_found', message: 'missing' },
        { status: 404 },
      );
    });

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();

    if (url.includes('/api/cities')) {
      const cities = options?.cities;
      if (typeof cities === 'function') {
        return cities();
      }
      return cities ?? Response.json(fixtureCities);
    }

    const flightMatch = url.match(/\/api\/flights\/([^/?]+)/);
    if (flightMatch) {
      return flightById(decodeURIComponent(flightMatch[1]));
    }

    if (url.includes('/api/bookings') && method === 'POST') {
      return (
        options?.createBooking?.() ??
        new Response('not found', { status: 404 })
      );
    }

    return new Response('not found', { status: 404 });
  });
}
