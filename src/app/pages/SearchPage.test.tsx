import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CITIES_FALLBACK_NOTICE,
  CITIES_LOAD_ERROR,
  FLIGHTS_SEARCH_ERROR,
} from '@shared/lib/messages';
import {
  fixtureCities,
  fixtureFlights,
  futureIsoDate,
} from '@shared/test/fixtures';
import { TestProviders } from '@shared/test/providers';
import { createTestStore } from '@shared/test/store';
import { SearchPage } from './SearchPage';

const searchDate = futureIsoDate();
const searchPath = `/?origin=MOW&destination=LED&date=${searchDate}&passengers=1`;

function renderSearch(options?: { preloadCities?: boolean }) {
  const store = createTestStore(
    options?.preloadCities === false ? undefined : { cities: fixtureCities },
  );

  return render(
    <TestProviders store={store}>
      <MemoryRouter initialEntries={[searchPath]}>
        <SearchPage />
      </MemoryRouter>
    </TestProviders>,
  );
}

describe('SearchPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a toast and a non-alerting sticky error when flights fail with 5xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cities')) {
          return Response.json(fixtureCities);
        }
        if (url.includes('/api/flights')) {
          return Response.json(
            { code: 'server_error', message: 'boom' },
            { status: 500 },
          );
        }
        return new Response('not found', { status: 404 });
      }),
    );

    renderSearch();

    expect(await screen.findByTestId('toast-item')).toHaveTextContent(
      FLIGHTS_SEARCH_ERROR,
    );
    const error = await screen.findByTestId('flights-error');
    expect(error).toHaveTextContent(FLIGHTS_SEARCH_ERROR);
    expect(error).not.toHaveAttribute('role', 'alert');
  });

  it('shows the cities fallback notice without a cities toast', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cities')) {
          return Response.json(
            { code: 'server_error', message: 'boom' },
            { status: 500 },
          );
        }
        return Response.json(fixtureFlights);
      }),
    );

    renderSearch({ preloadCities: false });

    expect(
      await screen.findByTestId('cities-fallback-notice'),
    ).toHaveTextContent(CITIES_FALLBACK_NOTICE);
    expect(screen.queryByText(CITIES_LOAD_ERROR)).not.toBeInTheDocument();
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });
});
