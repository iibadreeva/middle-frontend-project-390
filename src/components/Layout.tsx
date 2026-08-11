import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.shell} data-testid="app">
      <header className={styles.header} data-testid="app-header">
        <NavLink to="/" className={styles.brand} data-testid="app-brand">
          Flight Booking
        </NavLink>
        <nav
          className={styles.nav}
          aria-label="Основная навигация"
          data-testid="app-nav"
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            end
          >
            Поиск
          </NavLink>
          <NavLink
            to="/bookings/demo"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Моя бронь
          </NavLink>
        </nav>
      </header>
      <main className={styles.main} data-testid="app-main">
        <Outlet />
      </main>
    </div>
  );
}
