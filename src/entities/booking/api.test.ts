import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixtureBooking } from '@shared/test/fixtures';
import { cancelBooking, getBooking } from './api';

describe('booking HTTP client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getBooking requests booking by code and lastName query', async () => {
    const booking = fixtureBooking();
    const fetchMock = vi.fn(async () => Response.json(booking));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getBooking('AB12CD', 'Петров')).resolves.toEqual(booking);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bookings/AB12CD?lastName=%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B2',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  it('getBooking encodes code in the path', async () => {
    const booking = fixtureBooking({ code: 'A/B' });
    const fetchMock = vi.fn(async () => Response.json(booking));
    vi.stubGlobal('fetch', fetchMock);

    await getBooking('A/B', 'Ivanov');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bookings/A%2FB?lastName=Ivanov',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  it('cancelBooking posts lastName in the body', async () => {
    const booking = fixtureBooking({ status: 'cancelled' });
    const fetchMock = vi.fn(async () => Response.json(booking));
    vi.stubGlobal('fetch', fetchMock);

    await expect(cancelBooking('AB12CD', 'Петров')).resolves.toEqual(booking);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bookings/AB12CD/cancel',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ lastName: 'Петров' }),
      }),
    );
  });
});
