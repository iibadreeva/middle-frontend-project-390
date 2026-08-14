import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FLIGHTS_SEARCH_ERROR, SEARCH_SAME_CITIES_ERROR } from '../lib/messages';
import { fixtureCities, fixtureFlights, futureIsoDate } from '../test/fixtures';
import { createTestStore } from '../test/store';
import { TestProviders } from '../test/providers';
import { useFlightSearch } from './useFlightSearch';

const cities = fixtureCities;
const searchDate = futureIsoDate();
const otherDate = futureIsoDate(35);
const searchQuery = `/?origin=MOW&destination=LED&date=${searchDate}&passengers=1`;

function createWrapper(
  initialEntry: string,
  options?: { preloadCities?: boolean },
) {
  const store = createTestStore(
    options?.preloadCities === false ? undefined : { cities },
  );

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProviders store={store}>
        <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
      </TestProviders>
    );
  };
}

function flightsFetchCalls() {
  return vi
    .mocked(fetch)
    .mock.calls.filter((call) => String(call[0]).includes('/api/flights'));
}

describe('useFlightSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not request flights until cities are ready', () => {
    const fetchMock = vi.mocked(fetch).mockImplementation(
      () => new Promise(() => {}),
    );

    const { result } = renderHook(() => useFlightSearch(), {
      wrapper: createWrapper(searchQuery, { preloadCities: false }),
    });

    expect(result.current.status).toBe('loading');
    expect(flightsFetchCalls()).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('canonicalizes invalid URL params into resolved values', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(fixtureFlights));

    const { result } = renderHook(() => useFlightSearch(), {
      wrapper: createWrapper(
        `/?origin=XXX&destination=YYY&date=${searchDate}&passengers=0`,
      ),
    });

    await waitFor(() => {
      expect(result.current.values).toMatchObject({
        origin: 'MOW',
        destination: 'LED',
        date: searchDate,
        passengers: 1,
      });
    });
  });

  it('goes from loading to success with flights', async () => {
    let release!: (response: Response) => void;
    const gate = new Promise<Response>((resolve) => {
      release = resolve;
    });
    vi.mocked(fetch).mockImplementation(() => gate);

    const { result } = renderHook(() => useFlightSearch(), {
      wrapper: createWrapper(searchQuery),
    });

    expect(result.current.status).toBe('loading');

    await act(async () => {
      release(Response.json(fixtureFlights));
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.flights).toEqual(fixtureFlights);
    expect(result.current.errorMessage).toBeUndefined();
  });

  it('sets error status when flights request fails', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'server_error', message: 'boom' },
        { status: 500 },
      ),
    );

    const { result } = renderHook(() => useFlightSearch(), {
      wrapper: createWrapper(searchQuery),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.flights).toEqual([]);
    expect(result.current.errorMessage).toBe(FLIGHTS_SEARCH_ERROR);
  });

  it('treats AbortError as search failure when the request was not cancelled', async () => {
    vi.mocked(fetch).mockRejectedValue(
      new DOMException('aborted', 'AbortError'),
    );

    const { result } = renderHook(() => useFlightSearch(), {
      wrapper: createWrapper(searchQuery),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe(FLIGHTS_SEARCH_ERROR);
  });

  it('logs the underlying error when flights request fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('network down');
    vi.mocked(fetch).mockRejectedValue(failure);

    renderHook(() => useFlightSearch(), {
      wrapper: createWrapper(searchQuery),
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(failure);
    });
    consoleError.mockRestore();
  });

  it('ignores a late success after the request was cancelled', async () => {
    let resolveFlights!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFlights = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useFlightSearch(), {
      wrapper: createWrapper(searchQuery),
    });

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(flightsFetchCalls().length).toBeGreaterThan(0);
    });

    unmount();

    await act(async () => {
      resolveFlights(Response.json(fixtureFlights));
    });

    // После unmount поздний success не должен перевести статус в success.
    expect(result.current.status).toBe('loading');
  });

  it('does not request flights when origin and destination match', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(Response.json([]));

    const { result } = renderHook(() => useFlightSearch(), {
      wrapper: createWrapper(
        `/?origin=MOW&destination=MOW&date=${searchDate}&passengers=1`,
      ),
    });

    await waitFor(() => {
      expect(result.current.valuesError).toBe(SEARCH_SAME_CITIES_ERROR);
    });
    expect(result.current.status).toBe('success');
    expect(flightsFetchCalls()).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('updates search params on submit', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(fixtureFlights));

    const { result } = renderHook(() => useFlightSearch(), {
      wrapper: createWrapper(searchQuery),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.submit({
        origin: 'LED',
        destination: 'AER',
        date: otherDate,
        passengers: 3,
      });
    });

    await waitFor(() => {
      expect(result.current.values).toMatchObject({
        origin: 'LED',
        destination: 'AER',
        date: otherDate,
        passengers: 3,
      });
    });

    await waitFor(() => {
      const lastCallUrl = String(flightsFetchCalls().at(-1)?.[0] ?? '');
      const query = new URL(lastCallUrl, 'http://localhost').searchParams;

      expect(query.get('origin')).toBe('LED');
      expect(query.get('destination')).toBe('AER');
      expect(query.get('date')).toBe(otherDate);
      expect(query.get('passengers')).toBe('3');
    });
  });
});
