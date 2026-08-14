import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureFlights } from '../test/fixtures';
import { TestProviders } from '../test/providers';
import { useFlight } from './useFlight';

const fixtureFlight = fixtureFlights[0];

function wrapper({ children }: { children: ReactNode }) {
  return <TestProviders>{children}</TestProviders>;
}

describe('useFlight', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts in loading and then returns the flight', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(fixtureFlight));

    const { result } = renderHook(() => useFlight('fl_1'), { wrapper });

    expect(result.current.status).toBe('loading');
    expect(result.current.flight).toBeNull();

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.flight).toEqual(fixtureFlight);
  });

  it('maps 404 to not-found', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'not_found', message: 'missing' },
        { status: 404 },
      ),
    );

    const { result } = renderHook(() => useFlight('missing'), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('not-found');
    });
    expect(result.current.flight).toBeNull();
  });

  it('maps other failures to error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { code: 'server_error', message: 'boom' },
        { status: 500 },
      ),
    );

    const { result } = renderHook(() => useFlight('fl_1'), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.flight).toBeNull();
  });

  it('maps a missing flightId to not-found', () => {
    const { result } = renderHook(() => useFlight(undefined), { wrapper });

    expect(result.current.status).toBe('not-found');
    expect(result.current.flight).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reload retries after an error', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        Response.json(
          { code: 'server_error', message: 'boom' },
          { status: 500 },
        ),
      )
      .mockResolvedValueOnce(Response.json(fixtureFlight));

    const { result } = renderHook(() => useFlight('fl_1'), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    act(() => {
      result.current.reload();
    });

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.flight).toEqual(fixtureFlight);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
