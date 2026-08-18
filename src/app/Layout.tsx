import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGetCitiesQuery } from '@entities/city';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { nextHeaderScrolled } from './headerScrolledState';
import { homeHref, lookupHref } from './routes';
import styles from './Layout.module.css';

export function Layout() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(() =>
    nextHeaderScrolled(window.scrollY, false),
  );
  // Держим GET /api/cities в кэше для поиска и оформления брони.
  useGetCitiesQuery();

  useLayoutEffect(() => {
    let scrolledNow = nextHeaderScrolled(window.scrollY, scrolled);
    if (scrolledNow !== scrolled) {
      // Scroll can restore between the first render and this layout pass.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync restored scrollY before paint
      setScrolled(scrolledNow);
    }

    function sync() {
      const next = nextHeaderScrolled(window.scrollY, scrolledNow);
      if (next === scrolledNow) {
        return;
      }
      scrolledNow = next;
      setScrolled(next);
    }

    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('pageshow', sync);
    return () => {
      window.removeEventListener('scroll', sync);
      window.removeEventListener('pageshow', sync);
    };
    // Hysteresis lives in scrolledNow; re-subscribing on each toggle would reset it.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount snapshot of `scrolled`
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-header-scrolled', scrolled);
    return () => {
      document.documentElement.removeAttribute('data-header-scrolled');
    };
  }, [scrolled]);

  return (
    <div className={styles.shell} data-testid="app">
      <header
        className={
          scrolled ? `${styles.header} ${styles.headerScrolled}` : styles.header
        }
        data-testid="app-header"
      >
        <div className={styles.headerInner}>
          <h1 className={styles.title} data-testid="home-heading">
            <Link to={homeHref} className={styles.titleLink}>
              Бронирование авиабилетов
            </Link>
          </h1>
          <nav
            className={styles.nav}
            aria-label="Основная навигация"
            data-testid="app-nav"
          >
            <NavLink
              to={homeHref}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
              end
              data-testid="nav-search"
            >
              Поиск рейсов
            </NavLink>
            <NavLink
              to={lookupHref()}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
              data-testid="nav-lookup"
            >
              Мои брони
            </NavLink>
          </nav>
        </div>
      </header>
      <main className={styles.main} data-testid="app-main">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.crashButton}
          onClick={() => {
            throw new Error('Bugsink test error');
          }}
        >
          Тестовая ошибка
        </button>
      </footer>
    </div>
  );
}
