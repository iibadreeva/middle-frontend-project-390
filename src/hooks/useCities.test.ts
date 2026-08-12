import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_CITIES } from '../data/fallbackCities';
import { CITIES_FALLBACK_NOTICE } from '../lib/messages';
import { useCities } from './useCities';

describe('useCities', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts with fallback cities before the API responds', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useCities());

    expect(result.current.cities).toEqual(FALLBACK_CITIES);
    expect(result.current.notice).toBeNull();
    expect(result.current.ready).toBe(false);
  });

  it('replaces fallback cities with a non-empty API response', async () => {
    const apiCities = [
      { code: 'MOW', name: 'Москва', country: 'Россия' },
      { code: 'AER', name: 'Сочи', country: 'Россия' },
    ];
    vi.mocked(fetch).mockResolvedValue(Response.json(apiCities));

    const { result } = renderHook(() => useCities());

    await waitFor(() => {
      expect(result.current.cities).toEqual(apiCities);
    });
    expect(result.current.notice).toBeNull();
    expect(result.current.ready).toBe(true);
  });

  it('keeps fallback cities and sets notice when cities API fails', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'server_error', message: 'boom' },
        { status: 500 },
      ),
    );

    const { result } = renderHook(() => useCities());

    await waitFor(() => {
      expect(result.current.notice).toBe(CITIES_FALLBACK_NOTICE);
    });
    expect(result.current.cities).toEqual(FALLBACK_CITIES);
    expect(result.current.ready).toBe(true);
  });

  it('keeps fallback cities and sets notice when cities API returns an empty list', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json([]));

    const { result } = renderHook(() => useCities());

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
    expect(result.current.cities).toEqual(FALLBACK_CITIES);
    expect(result.current.notice).toBe(CITIES_FALLBACK_NOTICE);
  });
});
