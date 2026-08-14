import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureCities } from '@shared/test/fixtures';
import { TestProviders } from '@shared/test/providers';
import { Layout } from './Layout';
import { routePaths } from './routes';

function BoomPage() {
  throw new Error('page boom');
}

function SafePage() {
  return <p data-testid="safe-page">safe</p>;
}

describe('Layout error boundary', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cities')) {
          return Response.json(fixtureCities);
        }
        return new Response('not found', { status: 404 });
      }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps the header when a page crashes and clears fallback on navigate', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter initialEntries={['/boom']}>
          <Routes>
            <Route path={routePaths.home} element={<Layout />}>
              <Route index element={<SafePage />} />
              <Route path="boom" element={<BoomPage />} />
              <Route path={routePaths.bookings} element={<SafePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.queryByTestId('safe-page')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('nav-bookings'));

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    expect(screen.getByTestId('safe-page')).toBeInTheDocument();
  });

  it('can recover via retry without leaving the route', async () => {
    const user = userEvent.setup();
    let fail = true;

    function FlakyPage() {
      if (fail) {
        throw new Error('flaky');
      }
      return <p data-testid="flaky-ok">ok</p>;
    }

    render(
      <TestProviders cities={fixtureCities}>
        <MemoryRouter initialEntries={['/flaky']}>
          <Routes>
            <Route path={routePaths.home} element={<Layout />}>
              <Route path="flaky" element={<FlakyPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByTestId('error-boundary-retry'));

    expect(screen.getByTestId('flaky-ok')).toHaveTextContent('ok');
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });
});
