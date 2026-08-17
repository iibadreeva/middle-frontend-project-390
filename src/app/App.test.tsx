import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cityApi } from '@entities/city';
import { CITIES_LOAD_ERROR } from '@shared/lib/messages';
import { fixtureCities } from '@shared/test/fixtures';
import { TestProviders } from '@shared/test/providers';
import { createTestStore } from '@shared/test/store';
import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cities')) {
          return Response.json(fixtureCities);
        }
        if (url.includes('/api/flights')) {
          return Response.json([]);
        }
        return new Response('not found', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders search page on /', async () => {
    render(
      <TestProviders>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(
      screen.getByRole('heading', { name: 'Бронирование авиабилетов' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-page')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('flights-empty')).toBeInTheDocument();
    });
  });

  it('does not toast a cities 5xx on lookup', async () => {
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
        return new Response('not found', { status: 404 });
      }),
    );

    const store = createTestStore();
    render(
      <TestProviders store={store}>
        <MemoryRouter initialEntries={['/lookup']}>
          <App />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(await screen.findByTestId('lookup-page')).toBeInTheDocument();

    await waitFor(() => {
      const cities = cityApi.endpoints.getCities.select(undefined)(
        store.getState(),
      );
      expect(cities.isError).toBe(true);
    });

    expect(screen.queryByText(CITIES_LOAD_ERROR)).not.toBeInTheDocument();
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });
});
