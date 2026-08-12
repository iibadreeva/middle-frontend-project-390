import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { fixtureCities } from './test/fixtures';

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
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Бронирование авиабилетов' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-page')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('flights-empty')).toBeInTheDocument();
    });
  });
});
