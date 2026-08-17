import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureCities } from '@shared/test/fixtures';
import { TestProviders } from '@shared/test/providers';
import { Layout } from './Layout';
import styles from './Layout.module.css';
import { homeHref, routePaths } from './routes';

function BoomPage(): React.JSX.Element {
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
              <Route path={routePaths.lookup} element={<SafePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </TestProviders>,
    );

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.queryByTestId('safe-page')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('nav-lookup'));

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

function renderLayout() {
  return render(
    <TestProviders cities={fixtureCities}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path={routePaths.home} element={<Layout />}>
            <Route index element={<SafePage />} />
            <Route path={routePaths.lookup} element={<SafePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  );
}

describe('Layout header', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    });
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    });
  });

  it('makes the site title a home link', () => {
    renderLayout();

    const title = screen.getByTestId('home-heading');
    const link = within(title).getByRole('link', {
      name: 'Бронирование авиабилетов',
    });
    expect(link).toHaveAttribute('href', homeHref);
  });

  it('does not mark the header as scrolled after a light nudge', () => {
    renderLayout();
    const header = screen.getByTestId('app-header');

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 20,
    });
    fireEvent.scroll(window);

    expect(header).not.toHaveClass(styles.headerScrolled);
  });

  it('marks the header as scrolled after passing the compact threshold', () => {
    renderLayout();
    const header = screen.getByTestId('app-header');
    expect(header).not.toHaveClass(styles.headerScrolled);

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 60,
    });
    fireEvent.scroll(window);

    expect(header).toHaveClass(styles.headerScrolled);
  });

  it('keeps the scrolled header when scroll settles between thresholds', () => {
    renderLayout();
    const header = screen.getByTestId('app-header');

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 60,
    });
    fireEvent.scroll(window);
    expect(header).toHaveClass(styles.headerScrolled);

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 20,
    });
    fireEvent.scroll(window);

    expect(header).toHaveClass(styles.headerScrolled);
  });

  it('clears the scrolled header after returning near the top', () => {
    renderLayout();
    const header = screen.getByTestId('app-header');

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 60,
    });
    fireEvent.scroll(window);
    expect(header).toHaveClass(styles.headerScrolled);

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    });
    fireEvent.scroll(window);

    expect(header).not.toHaveClass(styles.headerScrolled);
  });

  it('syncs the compact header if scroll is restored after the first render', () => {
    let reads = 0;
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? 0 : 60;
      },
    });

    renderLayout();

    expect(screen.getByTestId('app-header')).toHaveClass(styles.headerScrolled);
  });

  it('marks the header as scrolled when mounted below the fold', () => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 60,
    });
    renderLayout();

    expect(screen.getByTestId('app-header')).toHaveClass(styles.headerScrolled);
  });

  it('syncs the compact header after scroll restoration on pageshow', () => {
    renderLayout();
    expect(screen.getByTestId('app-header')).not.toHaveClass(
      styles.headerScrolled,
    );

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 60,
    });
    fireEvent(window, new Event('pageshow'));

    expect(screen.getByTestId('app-header')).toHaveClass(styles.headerScrolled);
  });

  it('toggles document scroll-padding state with the compact header', () => {
    renderLayout();
    expect(document.documentElement).not.toHaveAttribute('data-header-scrolled');

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 60,
    });
    fireEvent.scroll(window);

    expect(document.documentElement).toHaveAttribute('data-header-scrolled');

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    });
    fireEvent.scroll(window);

    expect(document.documentElement).not.toHaveAttribute('data-header-scrolled');
  });
});
