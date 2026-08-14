import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGetCitiesQuery } from '@shared/store/api';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { bookingsHref, homeHref } from './routes';
import styles from './Layout.module.css';

export function Layout() {
  const location = useLocation();
  // Держим GET /api/cities в кэше для поиска и оформления брони.
  useGetCitiesQuery();

  return (
    <div className={styles.shell} data-testid="app">
      <header className={styles.header} data-testid="app-header">
        <h1 className={styles.title} data-testid="home-heading">
          Бронирование авиабилетов
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
            to={bookingsHref}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            data-testid="nav-bookings"
          >
            Мои брони
          </NavLink>
        </nav>
      </header>
      <main className={styles.main} data-testid="app-main">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
